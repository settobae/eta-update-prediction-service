from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import mongodb
from app.controller.cargo_controller import router as cargo_router
from app.controller.cargo_swagger import cargo_tags_metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongodb.connect()
    yield
    await mongodb.disconnect()


app = FastAPI(
    title="Cargo Tracker API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=cargo_tags_metadata,
    lifespan=lifespan,
)

app.include_router(cargo_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok"}
