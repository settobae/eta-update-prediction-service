import logging

from app.services.codex_runner import run_codex_prompt

logger = logging.getLogger(__name__)


async def get_route_countries(route_points: list) -> list:
    """
    항로 대표 좌표들이 속하거나 가장 가까운 연안 국가명을 codex에 한 번에 질의해
    중복 제거된 리스트로 반환한다. 실패 시 빈 리스트를 반환해(검색 범위 제한 없이) 계속 진행한다.
    """
    coords_text = "\n".join(
        f"{i + 1}. 경도 {p[0]}, 위도 {p[1]}" for i, p in enumerate(route_points)
    )
    prompt = (
        f"아래는 선박 항로상의 대표 좌표 목록입니다. 각 좌표가 속하거나 가장 가까운 연안 국가명을 알려주세요.\n"
        f"{coords_text}\n\n"
        f"국가를 특정하기 어려우면(공해상 등) 가장 가까운 연안 국가명을 추정해 채우십시오.\n"
        f"반드시 아래 JSON 형식으로만 응답하십시오. 다른 설명은 생략하십시오.\n"
        f"{{\"countries\": [\"1번 좌표 국가명\", \"2번 좌표 국가명\", \"...\"]}}"
    )
    try:
        data = await run_codex_prompt(prompt, timeout_seconds=45.0)
        countries = [c for c in data.get("countries", []) if isinstance(c, str) and c.strip()]
        unique_countries = list(dict.fromkeys(countries))  # 순서를 유지한 채 중복 제거
        logger.info("항로 통과 국가 추정 성공 | countries=%s", unique_countries)
        return unique_countries
    except Exception as e:
        logger.warning("항로 통과 국가 추정 실패, 국가 힌트 없이 진행 | %s", e)
        return []
