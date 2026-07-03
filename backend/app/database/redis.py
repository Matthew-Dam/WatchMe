import redis.asyncio as aioredis
from typing import Optional
from app.config import settings


class RedisConnection:
    client: Optional[aioredis.Redis] = None

    async def connect(self) -> None:
        if self.client is None:
            self.client = aioredis.from_url(settings.REDIS_URI, decode_responses=True)

    async def close(self) -> None:
        if self.client:
            await self.client.close()
            self.client = None

    def get_client(self) -> aioredis.Redis:
        if self.client is None:
            raise RuntimeError("Redis not connected")
        return self.client


redis_client = RedisConnection()
