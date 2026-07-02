from fastapi import HTTPException, status
from app.entity.cargo_entity import Cargo
from app.dto.cargo_dto import CargoRequest, CargoResponse
import app.repository.cargo_repository as cargo_repository


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


cargo_service = CargoService()
