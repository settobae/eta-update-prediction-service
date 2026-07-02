from beanie import Document
from pydantic import BaseModel
from datetime import datetime


class PathPoint(BaseModel):
    lat: float
    lon: float
    arrive_at: datetime


class Summary(BaseModel):
    data: str


class AISummary(Document):
    cargo_id: str
    path: list[PathPoint]
    summary: Summary

    class Settings:
        name = "ai_summaries"
