import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import UUID
from app.models.postgres_models import User, Profile, UserSession, Rating, WatchHistory, WatchlistItem, ImportLog


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, email: str, password_hash: str, display_name: str) -> User:
        user = User(id=uuid.uuid4(), email=email, password_hash=password_hash, display_name=display_name)
        self.db.add(user)
        await self.db.flush()
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_user(self, user_id: uuid.UUID, **kwargs) -> Optional[User]:
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        user.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return user

    async def create_profile(self, user_id: uuid.UUID, name: str, avatar_url: Optional[str], is_kid_mode: bool, pin_hash: Optional[str]) -> Profile:
        profile = Profile(id=uuid.uuid4(), user_id=user_id, name=name, avatar_url=avatar_url, is_kid_mode=is_kid_mode, pin_hash=pin_hash)
        self.db.add(profile)
        await self.db.flush()
        return profile

    async def get_profiles_by_user(self, user_id: uuid.UUID) -> list[Profile]:
        result = await self.db.execute(select(Profile).where(Profile.user_id == user_id))
        return list(result.scalars().all())

    async def get_profile_by_id(self, profile_id: uuid.UUID) -> Optional[Profile]:
        result = await self.db.execute(select(Profile).where(Profile.id == profile_id))
        return result.scalar_one_or_none()

    async def update_profile(self, profile_id: uuid.UUID, **kwargs) -> Optional[Profile]:
        profile = await self.get_profile_by_id(profile_id)
        if not profile:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(profile, key):
                setattr(profile, key, value)
        await self.db.flush()
        return profile

    async def delete_profile(self, profile_id: uuid.UUID) -> bool:
        result = await self.db.execute(delete(Profile).where(Profile.id == profile_id))
        return result.rowcount > 0

    async def create_session(self, user_id: uuid.UUID, refresh_token: str, device_info: Optional[str], ip_address: Optional[str], expires_at: datetime) -> UserSession:
        session = UserSession(id=uuid.uuid4(), user_id=user_id, refresh_token=refresh_token, device_info=device_info, ip_address=ip_address, expires_at=expires_at)
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_session_by_refresh_token(self, refresh_token: str) -> Optional[UserSession]:
        result = await self.db.execute(select(UserSession).where(UserSession.refresh_token == refresh_token))
        return result.scalar_one_or_none()

    async def delete_session(self, session_id: uuid.UUID) -> bool:
        result = await self.db.execute(delete(UserSession).where(UserSession.id == session_id))
        return result.rowcount > 0

    async def delete_user_sessions(self, user_id: uuid.UUID) -> None:
        await self.db.execute(delete(UserSession).where(UserSession.user_id == user_id))

    async def upsert_rating(self, user_id: uuid.UUID, profile_id: uuid.UUID, title_id: uuid.UUID, score: int) -> Rating:
        existing = await self.get_rating(profile_id, title_id)
        if existing:
            existing.score = score
            existing.updated_at = datetime.now(timezone.utc)
            await self.db.flush()
            return existing
        rating = Rating(id=uuid.uuid4(), user_id=user_id, profile_id=profile_id, title_id=title_id, score=score)
        self.db.add(rating)
        await self.db.flush()
        return rating

    async def get_rating(self, profile_id: uuid.UUID, title_id: uuid.UUID) -> Optional[Rating]:
        result = await self.db.execute(select(Rating).where(and_(Rating.profile_id == profile_id, Rating.title_id == title_id)))
        return result.scalar_one_or_none()

    async def get_ratings_by_user(self, user_id: uuid.UUID) -> list[Rating]:
        result = await self.db.execute(select(Rating).where(Rating.user_id == user_id))
        return list(result.scalars().all())

    async def upsert_watch_history(self, profile_id: uuid.UUID, title_id: uuid.UUID, episode_id: Optional[uuid.UUID], progress_seconds: float, completed: bool) -> WatchHistory:
        result = await self.db.execute(
            select(WatchHistory).where(and_(WatchHistory.profile_id == profile_id, WatchHistory.title_id == title_id))
        )
        entry = result.scalar_one_or_none()
        if entry:
            entry.progress_seconds = progress_seconds
            entry.completed = completed
            entry.last_watched_at = datetime.now(timezone.utc)
            if episode_id:
                entry.episode_id = episode_id
        else:
            entry = WatchHistory(id=uuid.uuid4(), profile_id=profile_id, title_id=title_id, episode_id=episode_id, progress_seconds=progress_seconds, completed=completed)
            self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_watch_history(self, profile_id: uuid.UUID, limit: int = 20) -> list[WatchHistory]:
        result = await self.db.execute(
            select(WatchHistory).where(WatchHistory.profile_id == profile_id).order_by(WatchHistory.last_watched_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def add_watchlist_item(self, profile_id: uuid.UUID, title_id: uuid.UUID) -> WatchlistItem:
        item = WatchlistItem(id=uuid.uuid4(), profile_id=profile_id, title_id=title_id)
        self.db.add(item)
        await self.db.flush()
        return item

    async def remove_watchlist_item(self, profile_id: uuid.UUID, title_id: uuid.UUID) -> bool:
        result = await self.db.execute(delete(WatchlistItem).where(and_(WatchlistItem.profile_id == profile_id, WatchlistItem.title_id == title_id)))
        return result.rowcount > 0

    async def get_watchlist(self, profile_id: uuid.UUID) -> list[WatchlistItem]:
        result = await self.db.execute(select(WatchlistItem).where(WatchlistItem.profile_id == profile_id))
        return list(result.scalars().all())

    async def check_watchlist_item(self, profile_id: uuid.UUID, title_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(WatchlistItem).where(and_(WatchlistItem.profile_id == profile_id, WatchlistItem.title_id == title_id)))
        return result.scalar_one_or_none() is not None

    async def check_imported(self, tmdb_id: int) -> Optional[ImportLog]:
        result = await self.db.execute(
            select(ImportLog).where(ImportLog.tmdb_id == tmdb_id, ImportLog.status == "success")
        )
        return result.scalar_one_or_none()

    async def log_import(self, user_id: uuid.UUID, title_name: str, tmdb_id: int, media_type: str, title_id: Optional[str], status: str = "success", error_message: Optional[str] = None) -> ImportLog:
        entry = ImportLog(
            id=uuid.uuid4(),
            user_id=user_id,
            title_name=title_name,
            tmdb_id=tmdb_id,
            media_type=media_type,
            title_id=uuid.UUID(title_id) if title_id else None,
            status=status,
            error_message=error_message,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_import_history(self, user_id: uuid.UUID, limit: int = 50) -> list[ImportLog]:
        result = await self.db.execute(
            select(ImportLog)
            .where(ImportLog.user_id == user_id)
            .order_by(ImportLog.imported_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
