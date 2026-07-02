from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from app.entity.cargo_entity import Cargo
from app.dto.cargo_dto import CargoRequest


async def create(dto: CargoRequest) -> Cargo:
    now = datetime.now(timezone.utc)
    data = dto.model_dump()
    cargo = Cargo(**data, add_at=now, updated_at=now)
    await cargo.insert()
    return cargo


async def find_by_id(cargo_id: str) -> Cargo | None:
    try:
        return await Cargo.get(ObjectId(cargo_id))
    except (InvalidId, Exception):
        return None


async def find_all() -> list[Cargo]:
    now = datetime.now(timezone.utc)

    upcoming = await (
        Cargo.find(Cargo.eta >= now)
        .sort(+Cargo.eta)
        .to_list()
    )

    remaining = await (
        Cargo.find({"$or": [{"eta": {"$lt": now}}, {"eta": None}]})
        .sort(-Cargo.updated_at)
        .to_list()
    )

    return upcoming + remaining


async def update(cargo_id: str, dto: CargoRequest) -> Cargo | None:
    try:
        cargo = await Cargo.get(ObjectId(cargo_id))
    except (InvalidId, Exception):
        return None

    if not cargo:
        return None

    data = dto.model_dump()

    for attr, value in data.items():
        setattr(cargo, attr, value)

    cargo.updated_at = datetime.now(timezone.utc)
    await cargo.save()
    return cargo


async def delete(cargo_id: str) -> bool:
    try:
        cargo = await Cargo.get(ObjectId(cargo_id))
    except (InvalidId, Exception):
        return False

    if not cargo:
        return False

    await cargo.delete()
    return True
