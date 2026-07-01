import os
from motor.motor_asyncio import AsyncIOMotorClient

client: AsyncIOMotorClient = None


async def connect():
    global client
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://root:root@localhost:27017"))


async def disconnect():
    global client
    if client:
        client.close()


def get_db():
    return client[os.getenv("MONGODB_DB", "cargo_tracker")]
