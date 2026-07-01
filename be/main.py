from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import mongodb
from app.config.settings import APP_NAME, APP_VERSION, CORS_ORIGINS
from app.controller.cargo_controller import router as cargo_router
from app.controller.cargo_swagger import cargo_tags_metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongodb.connect()
    yield
    await mongodb.disconnect()


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=cargo_tags_metadata,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cargo_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok"}
