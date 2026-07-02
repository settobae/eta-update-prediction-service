"""
CargoRequest가 시간까지 받도록 스키마를 변경하면서, 기존에 저장된 문서들의
atd/eta/ata 값을 00시(자정)로 정규화하기 위한 1회성 마이그레이션 스크립트.

실행:
    cd be
    python -m scripts.migrate_cargo_time
"""
import asyncio
from datetime import datetime

from app.config import mongodb
from app.entity.cargo_entity import Cargo


async def migrate() -> None:
    await mongodb.connect()

    updated = 0
    async for cargo in Cargo.find_all():
        changed = False
        for field in ("atd", "eta", "ata"):
            value = getattr(cargo, field)
            if value is None:
                continue
            midnight = datetime(value.year, value.month, value.day, tzinfo=value.tzinfo)
            if value != midnight:
                setattr(cargo, field, midnight)
                changed = True

        if changed:
            await cargo.save()
            updated += 1

    print(f"done. updated {updated} document(s).")
    await mongodb.disconnect()


if __name__ == "__main__":
    asyncio.run(migrate())
