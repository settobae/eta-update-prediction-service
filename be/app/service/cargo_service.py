from fastapi import HTTPException, status
from app.entity.cargo_entity import Cargo
from app.dto.cargo_dto import CargoRequest, CargoResponse
from app.dto.ai_dto import AISummaryRequest, AISummaryResponse
from app.client.ai_client import ai_client
import app.repository.cargo_repository as cargo_repository
import app.repository.ai_summary_repository as ai_summary_repository


def _to_dto(cargo: Cargo) -> CargoResponse:
    data = cargo.model_dump(exclude={"id", "revision_id"})
    return CargoResponse(id=str(cargo.id), **data)


class CargoService:
    async def create(self, dto: CargoRequest) -> CargoResponse:
        cargo = await cargo_repository.create(dto)
        return _to_dto(cargo)

    async def get_all(self) -> list[CargoResponse]:
        cargos = await cargo_repository.find_all()
        return [_to_dto(c) for c in cargos]

    async def update(self, cargo_id: str, dto: CargoRequest) -> CargoResponse:
        cargo = await cargo_repository.update(cargo_id, dto)
        if not cargo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
        return _to_dto(cargo)

    async def delete(self, cargo_id: str) -> None:
        deleted = await cargo_repository.delete(cargo_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")

    async def get_existing_summary(self, cargo_id: str) -> AISummaryResponse | None:
        cargo = await cargo_repository.find_by_id(cargo_id)
        if not cargo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")

        existing = await ai_summary_repository.find_by_cargo_id(cargo_id)
        if not existing:
            return None
        return AISummaryResponse(path=existing.path, summary=existing.summary)

    async def summarize(self, cargo_id: str) -> AISummaryResponse:
        cargo = await cargo_repository.find_by_id(cargo_id)
        if not cargo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
        if not cargo.atd or not cargo.eta:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="atd and eta are required to request a summary",
            )

        request_dto = AISummaryRequest(
            from_=cargo.from_,
            stopover=cargo.stopover,
            to=cargo.to,
            atd=cargo.atd.isoformat(),
            eta=cargo.eta.isoformat(),
        )
        response_dto = await ai_client.request_summary(request_dto)
        await ai_summary_repository.save(cargo_id, response_dto)
        return response_dto


cargo_service = CargoService()
