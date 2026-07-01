from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from typing import Optional


class CargoItem(BaseModel):
    item: str
    ea: int


class CargoRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    projectName: str
    from_: str = Field(alias="from")
    stopover: str
    to: str
    items: list[CargoItem]
    atd: Optional[date] = None
    eta: Optional[date] = None
    ata: Optional[date] = None


class CargoResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    projectName: str
    from_: str = Field(alias="from")
    stopover: str
    to: str
    items: list[CargoItem]
    atd: Optional[date] = None
    eta: Optional[date] = None
    ata: Optional[date] = None
    add_at: datetime
    updated_at: datetime
