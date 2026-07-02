import os
import math
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from app.config import config
from app.services.ai_verifier import AIVerificationEngine
from app.services.weather import get_weather_issues

logger = logging.getLogger(__name__)

def haversine_distance(p1: list, p2: list) -> float:
    """
    두 지점(p = [lon, lat]) 간의 대원 거리(Great-Circle Distance)를 Haversine 공식으로 구합니다 (단위: km).
    """
    lon1, lat1 = math.radians(p1[0]), math.radians(p1[1])
    lon2, lat2 = math.radians(p2[0]), math.radians(p2[1])
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371.0
    return c * r

def parse_to_kst(time_str: str) -> datetime:
    """
    Naive 또는 UTC ISO 타임 스트링을 파싱하여 한국 시간(KST, UTC+9) datetime 객체로 변환합니다.
    """
    kst_tz = timezone(timedelta(hours=9))
    if time_str.endswith("Z"):
        return datetime.fromisoformat(time_str[:-1]).replace(tzinfo=timezone.utc).astimezone(kst_tz)
    
    dt = datetime.fromisoformat(time_str)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=kst_tz)
    return dt.astimezone(kst_tz)

def calculate_points_eta(atd: str, eta: str, route_points: list, delay_hours: int) -> list:
    """
    출발 시각(atd)과 계획된 도착 시각(eta)을 기준으로 지연 시간(delay_hours)을 가산한 후,
    10개 좌표 간의 누적 해상 거리에 비례하여 각 좌표의 KST 도착 예정 시각(arrive_at)을 계산합니다.
    """
    n = len(route_points)
    if n == 0:
        return []

    # 1. 구간별 해상 거리 및 누적 거리 계산
    distances = [0.0]
    for i in range(1, n):
        dist = haversine_distance(route_points[i-1], route_points[i])
        distances.append(distances[-1] + dist)
    
    total_distance = distances[-1]
    
    # 2. 타임존(KST)이 반영된 출발 시각(atd) 및 계획 도착 시각(eta) 파싱
    atd_dt = parse_to_kst(atd)
    eta_dt = parse_to_kst(eta)

    # 3. 지연 시간이 가산된 최종 조정 도착 시각 (KST)
    adjusted_dt = eta_dt + timedelta(hours=delay_hours)
    
    # 총 운항 소요 시간
    total_travel_time = adjusted_dt - atd_dt

    # 4. 거리 비율에 맞추어 각 좌표별 도달 예정시간(arrive_at) 계산
    points_with_eta = []
    for i in range(n):
        ratio = (distances[i] / total_distance) if total_distance > 0 else 0
        point_eta_dt = atd_dt + (total_travel_time * ratio)
        
        points_with_eta.append({
            "lat": route_points[i][1],
            "lon": route_points[i][0],
            "arrive_at": point_eta_dt.isoformat()
        })
        
    return points_with_eta

def _combined_risk_label(issues: list) -> str:
    severities = {issue.get("severity") for issue in issues}
    if "High" in severities:
        return "높음 (경고 - High-Risk)"
    if "Medium" in severities:
        return "보통 (주의 - Alert)"
    return "낮음 (안정)"


async def analyze_route_issues(departure: str, destination: str, atd: str, eta: str, route_points: list) -> dict:
    """
    기상 이슈는 Open-Meteo 기상/해양 API에서, 지정학/항구정체 등 뉴스 기반 이슈는 Codex CLI
    실행자/검수자 파이프라인(공신력 있는 주요 매체 한정)에서 각각 조회한 뒤 병합하는 상위 통합
    서비스 비동기 함수입니다. 두 조회는 병렬로 실행되어 전체 응답 시간을 단축합니다.
    """
    # 기상 예보 조회 시점 산출을 위한 기준(지연 미반영) 도착 시각
    baseline_points = calculate_points_eta(atd, eta, route_points, delay_hours=0)
    weather_task = asyncio.create_task(get_weather_issues(baseline_points))

    engine = AIVerificationEngine(
        model_name=config.GEMINI_MODEL_NAME
    )

    logger.info("Codex CLI 실행자/검수자 파이프라인 구동 시작 | departure=%s destination=%s", departure, destination)

    # AI 검증 수행 (예외 발생 대비 try-except)
    try:
        raw_result = await engine.verify_route_threats(
            departure=departure,
            destination=destination,
            eta_scheduled=eta,
            route_points=route_points
        )
        logger.info("Codex CLI 실행자/검수자 검증 완료 | issues=%d개", len(raw_result.get("issues", [])))
    except Exception as e:
        logger.error("Codex AI 분석 에러 (AIVerificationEngine 실패), 안전 fallback으로 전환 | %s", e)
        raw_result = {
            "issues": [
                {
                    "category": "시스템 정보",
                    "location": "전체 경로",
                    "severity": "Low",
                    "description": "Codex CLI 실행자/검수자 파이프라인 호출 실패로 뉴스 기반 이슈 분석이 생략되었습니다. (기상 이슈는 별도로 반영됨)",
                    "article_link": "https://platform.openai.com/",
                    "publisher": "OpenAI",
                    "published_at": "",
                    "source_tier": "Tier 4",
                    "verification_status": "corrected"
                }
            ],
            "total_delay_hours": 0,
            "analysis_summary": "Codex CLI 기반 뉴스 위험 분석이 실패하여 해당 부분은 생략되었습니다."
        }

    weather_issues, weather_delay_hours = await weather_task
    logger.info(
        "기상 API 이슈 조회 완료 | issues=%d개 weather_delay_hours=%d",
        len(weather_issues), weather_delay_hours
    )

    news_issues = raw_result.get("issues", [])
    news_delay_hours = int(raw_result.get("total_delay_hours", 0))

    combined_issues = weather_issues + news_issues
    delay_hours = weather_delay_hours + news_delay_hours

    # KST 비례배분 예정 시각 산출 진행 로그 출력
    logger.info("KST 비례배분 도달 일정 산출 중 | atd=%s eta=%s", atd, eta)

    # 지연 시간 및 KST 타임존 기반 각 포인트별 예정 시각 산출 (atd와 eta 기준 비례배분)
    points_with_eta = calculate_points_eta(atd, eta, route_points, delay_hours)

    # 최종 조정 도착 일정 계산 (KST)
    eta_dt = parse_to_kst(eta)
    adjusted_dt = eta_dt + timedelta(hours=delay_hours)

    result = {
        "issues": combined_issues,
        "delay_risk": _combined_risk_label(combined_issues),
        "total_delay_hours": delay_hours,
        "analysis_summary": raw_result.get("analysis_summary", "분석이 정상적으로 완료되었습니다."),
        "eta_adjusted": adjusted_dt.isoformat(),
        "route_points": points_with_eta,
    }

    logger.info(
        "선박 항로 및 외부 위협 종합 분석 파이프라인 완료 | total_delay_hours=%d eta_adjusted=%s",
        delay_hours, result["eta_adjusted"]
    )

    return result
