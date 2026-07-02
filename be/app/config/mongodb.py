from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config.settings import MONGODB_URI, MONGODB_DB

client: AsyncIOMotorClient = None


async def connect():
    global client
    from app.entity.cargo_entity import Cargo
    from app.entity.ai_summary_entity import AISummary
    client = AsyncIOMotorClient(MONGODB_URI)
    await init_beanie(
        database=client[MONGODB_DB],
        document_models=[Cargo, AISummary],
    )


async def disconnect():
    global client
    if client:
        client.close()
