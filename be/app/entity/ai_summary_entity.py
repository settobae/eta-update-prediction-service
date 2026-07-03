from beanie import Document
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


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


class AISummary(Document):
    cargo_id: str
    path: list[PathPoint]
    summary: Summary

    class Settings:
        name = "ai_summaries"
