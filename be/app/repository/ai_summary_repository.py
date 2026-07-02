from app.entity.ai_summary_entity import AISummary
from app.dto.ai_dto import AISummaryResponse


async def save(cargo_id: str, dto: AISummaryResponse) -> AISummary:
    await AISummary.find(AISummary.cargo_id == cargo_id).delete()
    ai_summary = AISummary(cargo_id=cargo_id, **dto.model_dump())
    await ai_summary.insert()
    return ai_summary


async def find_by_cargo_id(cargo_id: str) -> AISummary | None:
    try:
        return await AISummary.find_one(AISummary.cargo_id == cargo_id)
    except Exception:
        return None
