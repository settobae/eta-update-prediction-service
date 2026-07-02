from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class CargoItem(BaseModel):
    item: str
    ea: int


class CargoRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    projectName: str
    from_: str = Field(alias="from")
    stopover: Optional[str] = None
    to: str
    items: list[CargoItem]
    atd: Optional[datetime] = None
    eta: Optional[datetime] = None
    ata: Optional[datetime] = None


class CargoResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    projectName: str
    from_: str = Field(alias="from")
    stopover: Optional[str] = None
    to: str
    items: list[CargoItem]
    atd: Optional[datetime] = None
    eta: Optional[datetime] = None
    ata: Optional[datetime] = None
    add_at: datetime
    updated_at: datetime
