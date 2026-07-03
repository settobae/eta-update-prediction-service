from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class AISummaryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from")
    stopover: Optional[str] = None
    to: str
    atd: str
    eta: str


class PathPoint(BaseModel):
    lat: float
    lon: float
    arrive_at: datetime
    point_type: Optional[str] = None


class IssueItem(BaseModel):
    category: str
    location: str
    severity: str
    description: str
    article_link: str
    publisher: str
    published_at: str
    source_tier: str
    verification_status: str


class Summary(BaseModel):
    delay_risk: str
    total_delay_hours: int
    eta_adjusted: str
    issues: list[IssueItem]
    analysis_summary: str


class AISummaryResponse(BaseModel):
    path: list[PathPoint]
    summary: Summary
