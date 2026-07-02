import json
import logging

from app.services.codex_runner import run_codex_prompt

logger = logging.getLogger(__name__)

# 국가당 검색 시도 상한 (최소 시간 안에 답변하도록 검색 범위를 제한)
MAX_SEARCHES_PER_COUNTRY = 2
NEWS_SEARCH_TIMEOUT_SECONDS = 120.0


class AIVerificationEngine:
    """
    로컬 시스템에 설치된 'codex' CLI 명령어를 subprocess 비동기 호출 방식으로 가동하여,
    API Key 요금이나 구글 API 쿼터 한도 없이 분석 결과를 받아오는 AI 자체 검증 엔진 클래스입니다.
    """
    def __init__(self, model_name: str = "gemini-3.5-flash"):
        self.model_name = model_name

    async def verify_route_threats(
        self, departure: str, destination: str, eta_scheduled: str, route_points: list, countries: list = None
    ) -> dict:
        countries = countries or []
        coords_text = "\n".join([f"Point {i+1}: Longitude {p[0]}, Latitude {p[1]}" for i, p in enumerate(route_points)])

        executor_prompt = self._build_executor_prompt(departure, destination, eta_scheduled, coords_text, countries)
        executor_result = await run_codex_prompt(executor_prompt, timeout_seconds=NEWS_SEARCH_TIMEOUT_SECONDS)
        logger.info(
            "실행자 뉴스 검색 완료 | search_count=%s issues=%d개",
            executor_result.get("search_count"), len(executor_result.get("issues", []))
        )

        reviewer_prompt = self._build_reviewer_prompt(
            departure=departure,
            destination=destination,
            eta_scheduled=eta_scheduled,
            coords_text=coords_text,
            executor_result=executor_result
        )
        reviewer_result = await run_codex_prompt(reviewer_prompt, timeout_seconds=NEWS_SEARCH_TIMEOUT_SECONDS)
        logger.info(
            "검수자 뉴스 검증 완료 | search_count=%s issues=%d개",
            reviewer_result.get("search_count"), len(reviewer_result.get("issues", []))
        )

        reviewer_result["executor_search_count"] = executor_result.get("search_count", 0)
        reviewer_result["reviewer_search_count"] = reviewer_result.get("search_count", 0)
        return reviewer_result

    def _build_executor_prompt(
        self, departure: str, destination: str, eta_scheduled: str, coords_text: str, countries: list
    ) -> str:
        countries_text = ", ".join(countries) if countries else "(국가 추정 실패 - 좌표 인근 지역 기준으로 자유롭게 검색하십시오)"
        return (
            f"--- 해상 물류 항로 정보 ---\n"
            f"출발지: {departure}\n"
            f"도착지: {destination}\n"
            f"계획된 도착 일정 (ETA): {eta_scheduled}\n\n"
            f"--- 항로상 대표 좌표 10개 (경도, 위도) ---\n"
            f"{coords_text}\n\n"
            f"--- 항로가 지나거나 인접한 국가 ---\n"
            f"{countries_text}\n\n"
            f"--- 역할 ---\n"
            f"당신은 해상 물류 위험분석 실행자입니다.\n"
            f"기상 이슈는 별도 기상 API로 처리하므로 조사 대상에서 제외하십시오. 아래 두 카테고리만 조사하십시오: 지정학/해적, 항구정체(기타 포함).\n\n"
            f"검색 방법 (최소 시간 안에 답변하기 위해 반드시 준수):\n"
            f"1. 위에 나열된 국가마다 \"[국가명] 지연 차질 봉쇄 혼잡\"처럼 키워드를 조합한 검색어 1개로 검색하십시오.\n"
            f"2. 국가당 검색 시도는 최대 {MAX_SEARCHES_PER_COUNTRY}회로 제한합니다. 결과가 마땅치 않으면 바로 다음 국가로 넘어가고, 같은 국가에 대해 검색어를 바꿔가며 여러 번 재검색하지 마십시오.\n"
            f"3. 전체적으로 이슈가 없으면 issues를 빈 배열로 반환해도 됩니다.\n"
            f"4. CNN, Reuters, BBC, AP, AFP, Bloomberg, 연합뉴스 등 공신력 있는 주요 매체의 기사만 근거로 사용하십시오. 위 매체 중 하나에서 명확한 기사를 찾으면 충분하며, 여러 매체를 교차 검증하지 마십시오.\n"
            f"5. 반드시 실제 기사 상세 URL(article_link)을 포함하십시오. 메인 홈페이지, 검색 결과 페이지, 깨진 링크는 금지입니다.\n"
            f"6. 위험도(delay_risk), 지연 시간(total_delay_hours), 종합 소견(analysis_summary)은 작성하지 마십시오. 이는 severity를 기준으로 시스템이 별도로 계산합니다. severity만 정확히 판단하면 됩니다.\n"
            f"7. 응답은 마크다운 없이 반드시 단일 JSON 객체로만 반환하십시오.\n\n"
            f"최종 반환 JSON 규격:\n"
            f"{{\n"
            f"  \"issues\": [\n"
            f"    {{\n"
            f"      \"category\": \"지정학/해적 | 항구정체 | 기타 중 택일\",\n"
            f"      \"location\": \"이슈 발생 해역/지역 명칭\",\n"
            f"      \"severity\": \"High | Medium | Low\",\n"
            f"      \"description\": \"구체적인 보안/정체 위협 설명\",\n"
            f"      \"article_link\": \"실시간 검색으로 취득한 실제 뉴스 기사 개별 상세 URL\",\n"
            f"      \"publisher\": \"기사 발행 매체명 (CNN, Reuters 등 공신력 있는 매체)\",\n"
            f"      \"published_at\": \"기사 발행 시각 또는 날짜\",\n"
            f"      \"source_tier\": \"Tier 1 | Tier 2\",\n"
            f"      \"verification_status\": \"verified\"\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"search_count\": 실제로 시도한 검색 횟수 총합 (정수값)\n"
            f"}}"
        )

    def _build_reviewer_prompt(
        self,
        departure: str,
        destination: str,
        eta_scheduled: str,
        coords_text: str,
        executor_result: dict
    ) -> str:
        executor_json = json.dumps(executor_result, ensure_ascii=False, indent=2)
        return (
            f"--- 해상 물류 항로 정보 ---\n"
            f"출발지: {departure}\n"
            f"도착지: {destination}\n"
            f"계획된 도착 일정 (ETA): {eta_scheduled}\n\n"
            f"--- 항로상 대표 좌표 10개 (경도, 위도) ---\n"
            f"{coords_text}\n\n"
            f"--- 실행자 초안 ---\n"
            f"{executor_json}\n\n"
            f"--- 역할 ---\n"
            f"당신은 해상 물류 위험분석 검수자입니다. 기상 이슈는 대상이 아닙니다.\n"
            f"1. 실행자 초안의 각 기사 링크가 CNN, Reuters, BBC, AP, AFP, Bloomberg, 연합뉴스 등 공신력 있는 매체의 실제 기사 상세 URL인지만 가볍게 확인하십시오.\n"
            f"2. 명백히 문제가 있는 항목(깨진 링크, 무관한 매체, 좌표와 무관한 이슈)만 수정/삭제하고, 재검색은 이슈당 최대 1회로 제한하십시오. 문제가 없어 보이면 재검색하지 말고 그대로 채택하십시오.\n"
            f"3. 각 이슈가 항로 좌표와 관련 있는지, 설명과 지연 추정이 크게 과장되지 않았는지 검토하십시오.\n"
            f"4. 필요하면 이슈를 수정, 삭제, 보완하십시오.\n"
            f"5. source_tier는 다음 기준을 따르십시오: Tier 1=국제 주요 매체, Tier 2=인근국 주요 매체.\n"
            f"6. verification_status는 검수 후 그대로 유지하면 verified, 내용이나 링크를 보정했으면 corrected, 출처가 부적합하면 rejected_reference로 표시하십시오.\n"
            f"7. 위험도(delay_risk), 지연 시간(total_delay_hours), 종합 소견(analysis_summary)은 작성하지 마십시오. 이는 severity를 기준으로 시스템이 별도로 계산합니다.\n"
            f"8. 검수 결과는 마크다운 없이 반드시 아래 JSON 형식으로만 반환하십시오.\n\n"
            f"최종 반환 JSON 규격:\n"
            f"{{\n"
            f"  \"issues\": [\n"
            f"    {{\n"
            f"      \"category\": \"지정학/해적 | 항구정체 | 기타 중 택일\",\n"
            f"      \"location\": \"이슈 발생 해역/지역 명칭\",\n"
            f"      \"severity\": \"High | Medium | Low\",\n"
            f"      \"description\": \"검수 후 확정된 위협 설명\",\n"
            f"      \"article_link\": \"검수 후 유지한 실제 뉴스 기사 상세 URL\",\n"
            f"      \"publisher\": \"기사 발행 매체명 (CNN, Reuters 등 공신력 있는 매체)\",\n"
            f"      \"published_at\": \"기사 발행 시각 또는 날짜\",\n"
            f"      \"source_tier\": \"Tier 1 | Tier 2\",\n"
            f"      \"verification_status\": \"verified | corrected | rejected_reference\"\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"search_count\": 검수 과정에서 실제로 재검색한 횟수 (정수값, 없으면 0)\n"
            f"}}"
        )
