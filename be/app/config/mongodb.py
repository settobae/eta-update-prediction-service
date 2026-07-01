import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

load_dotenv()

client: AsyncIOMotorClient = None


async def connect():
    global client
    from app.entity.cargo_entity import Cargo
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    await init_beanie(
        database=client[os.getenv("MONGODB_DB")],
        document_models=[Cargo],
    )


async def disconnect():
    global client
    if client:
        client.close()
