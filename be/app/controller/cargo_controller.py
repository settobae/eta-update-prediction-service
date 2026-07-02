from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.service.cargo_service import cargo_service
from app.dto.cargo_dto import CargoRequest
from app.controller.cargo_swagger import create_docs, get_all_docs, update_docs, delete_docs, summary_docs

router = APIRouter(
    prefix="/cargos",
    tags=["Cargo"],
)


@router.post("/", **create_docs)
async def create_cargo(dto: CargoRequest):
    result = await cargo_service.create(dto)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=jsonable_encoder(result.model_dump(by_alias=True, mode="json")),
    )


@router.get("/", **get_all_docs)
async def get_all_cargos():
    result = await cargo_service.get_all()
    return JSONResponse(
        content=jsonable_encoder([r.model_dump(by_alias=True, mode="json") for r in result])
    )


@router.get("/summary/{cargo_id}", **summary_docs)
async def get_cargo_summary(cargo_id: str):
    result = await cargo_service.summarize(cargo_id)
    return JSONResponse(
        content=jsonable_encoder(result.model_dump(mode="json"))
    )


@router.put("/{cargo_id}", **update_docs)
async def update_cargo(cargo_id: str, dto: CargoRequest):
    result = await cargo_service.update(cargo_id, dto)
    return JSONResponse(
        content=jsonable_encoder(result.model_dump(by_alias=True, mode="json"))
    )


@router.delete("/{cargo_id}", status_code=status.HTTP_200_OK, **delete_docs)
async def delete_cargo(cargo_id: str):
    await cargo_service.delete(cargo_id)
    return {"ok": True}
