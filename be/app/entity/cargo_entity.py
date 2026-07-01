from beanie import Document
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class CargoItem(BaseModel):
    item: str
    ea: int


class Cargo(Document):
    model_config = ConfigDict(populate_by_name=True)

    projectName: str
    from_: str = Field(alias="from")
    stopover: str
    to: str
    items: list[CargoItem]
    atd: Optional[datetime] = None
    eta: Optional[datetime] = None
    ata: Optional[datetime] = None
    add_at: datetime
    updated_at: datetime

    class Settings:
        name = "cargos"
