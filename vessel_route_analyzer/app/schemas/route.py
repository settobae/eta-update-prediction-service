from pydantic import BaseModel, Field
from typing import List, Optional

class RouteRequest(BaseModel):
    departure_from: str = Field(..., alias="from", description="출발지. 항구 또는 도시명")
    stopover: Optional[str] = Field(default=None, description="경유지. 없으면 null 또는 생략")
    to: str = Field(..., description="목적지. 항구 또는 도시명")
    atd: str = Field(..., description="실제 출발 시각 ATD (ISO 8601 문자열)")
    eta: str = Field(..., description="계획 도착 시각 ETA (ISO 8601 문자열)")

    class Config:
        populate_by_name = True # Pydantic v2에서 json 필드명 'from' 호환용 설정

class PathPoint(BaseModel):
    lat: float = Field(..., description="위도 좌표")
    lon: float = Field(..., description="경도 좌표")
    arrive_at: str = Field(..., description="한국시각(KST) 기준 해당 좌표 도달 예정 시각")
    point_type: Optional[str] = Field(
        default=None,
        description="좌표 유형. departure(출발), stopover(경유), waypoint(중간 경로점), arrival(도착) 중 하나"
    )

class IssueItem(BaseModel):
    category: str = Field(..., description="이슈 카테고리. 기상, 지정학/해적, 항구정체, 기타 중 하나")
    location: str = Field(..., description="이슈 발생 예상 지역 또는 해역")
    severity: str = Field(..., description="이슈 심각도. High, Medium, Low 중 하나")
    description: str = Field(..., description="이슈 상세 내용과 항로 또는 ETA에 미치는 영향")
    article_link: str = Field(..., description="실제 기사 상세 URL. 메인 페이지나 검색 결과 페이지는 허용되지 않음")
    publisher: str = Field(..., description="기사 발행 매체명")
    published_at: str = Field(..., description="기사 발행 시각 또는 날짜. 확인 불가 시 빈 문자열")
    source_tier: str = Field(..., description="출처 등급. Tier 1(국제 주요 매체), Tier 2(인근국 주요 매체), Tier 3(공식기관), Tier 4(기타)")
    verification_status: str = Field(..., description="검수 결과. verified, corrected, rejected_reference 중 하나")

class SummaryDetails(BaseModel):
    delay_risk: str = Field(..., description="도착 일정 변화 예상 수준. 낮음 (안정), 보통 (주의 - Alert), 높음 (경고 - High-Risk) 중 하나")
    total_delay_hours: int = Field(..., description="예상 총 지연 시간(시간)")
    eta_adjusted: str = Field(..., description="이슈와 지연이 반영된 최종 ETA. 한국시각(KST) 기준")
    issues: List[IssueItem] = Field(..., description="검수 완료된 경로상 이슈와 근거 기사 목록")
    analysis_summary: str = Field(..., description="실행자 초안을 검수자가 교정한 최종 종합 소견")

class RouteResponse(BaseModel):
    path: List[PathPoint] = Field(..., description="출발지부터 목적지까지 대표 10개 항로 좌표와 각 좌표의 KST 도달 예정 시각")
    summary: SummaryDetails = Field(..., description="검수 완료 이슈, 지연 지표, 보정 ETA, 최종 분석 소견")
