from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.config import settings


class MongoDBConnection:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self) -> None:
        if self.client is None:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.MONGODB_DB]

    async def close(self) -> None:
        if self.client:
            self.client.close()
            self.client = None
            self.db = None

    def get_collection(self, name: str):
        if self.db is None:
            raise RuntimeError("MongoDB not connected")
        return self.db[name]


mongodb = MongoDBConnection()
