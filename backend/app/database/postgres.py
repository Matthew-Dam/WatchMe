import re
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
from app.config import settings


class Base(DeclarativeBase):
    pass


_async_uri = settings.POSTGRES_URI
_engine_kwargs = {"echo": settings.DEBUG, "pool_pre_ping": True}
# Strip sslmode from async URI — asyncpg can't parse it; pass ssl via connect_args instead
match = re.search(r"\?sslmode=(\w+)", _async_uri)
if match:
    _async_uri = re.sub(r"\?sslmode=\w+", "", _async_uri)
    if match.group(1) == "require":
        _engine_kwargs["connect_args"] = {"ssl": "require"}

engine = create_async_engine(_async_uri, **_engine_kwargs)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class PostgreSQLConnection:
    async def connect(self) -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close(self) -> None:
        await engine.dispose()


postgres = PostgreSQLConnection()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
