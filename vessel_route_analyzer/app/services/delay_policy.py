"""
이슈 심각도(severity)를 예상 지연 시간으로 변환하는 단일 판단 기준.
기상 이슈(Open-Meteo)와 뉴스 이슈(Codex CLI) 모두 이 기준을 동일하게 적용해
AI가 임의로 총 지연 시간/위험도/요약문을 "작성"하지 않고, 코드가 결정론적으로 계산한다.
"""

SEVERITY_DELAY_HOURS = {
    "High": 24,
    "Medium": 12,
    "Low": 0,
}


def delay_hours_for_issue(issue: dict) -> int:
    return SEVERITY_DELAY_HOURS.get(issue.get("severity"), 0)


def total_delay_hours(issues: list) -> int:
    return sum(delay_hours_for_issue(issue) for issue in issues)


def combined_risk_label(issues: list) -> str:
    severities = {issue.get("severity") for issue in issues}
    if "High" in severities:
        return "높음 (경고 - High-Risk)"
    if "Medium" in severities:
        return "보통 (주의 - Alert)"
    return "낮음 (안정)"


def build_analysis_summary(issues: list, hours: int) -> str:
    if not issues:
        return "감지된 위험 이슈가 없어 원래 일정대로 진행이 예상됩니다."

    by_category = {}
    for issue in issues:
        category = issue.get("category", "기타")
        by_category[category] = by_category.get(category, 0) + 1
    category_text = ", ".join(f"{category} {count}건" for category, count in by_category.items())

    return (
        f"총 {len(issues)}건의 위험 이슈가 감지되었습니다 ({category_text}). "
        f"판단 기준(High=24h, Medium=12h, Low=0h)에 따른 예상 총 지연 시간은 {hours}시간입니다."
    )
