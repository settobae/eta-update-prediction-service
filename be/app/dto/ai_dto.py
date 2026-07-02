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


class Summary(BaseModel):
    data: str


class AISummaryResponse(BaseModel):
    path: list[PathPoint]
    summary: Summary
