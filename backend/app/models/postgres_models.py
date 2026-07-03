import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, Float, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.postgres import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(512), nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(512), nullable=True, default=None)
    is_kid_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="profiles")
    ratings = relationship("Rating", back_populates="profile", cascade="all, delete-orphan")
    watch_history = relationship("WatchHistory", back_populates="profile", cascade="all, delete-orphan")
    watchlist_items = relationship("WatchlistItem", back_populates="profile", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    refresh_token: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    device_info: Mapped[str] = mapped_column(String(512), nullable=True, default=None)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True, default=None)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="sessions")


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("profile_id", "title_id", name="uq_profile_title_rating"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    title_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="ratings")
    profile = relationship("Profile", back_populates="ratings")


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    title_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    episode_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True, default=None)
    progress_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    last_watched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    profile = relationship("Profile", back_populates="watch_history")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    title_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    profile = relationship("Profile", back_populates="watchlist_items")


class ImportLog(Base):
    __tablename__ = "import_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    title_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tmdb_id: Mapped[int] = mapped_column(Integer, nullable=True, default=None)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)
    title_id: Mapped[str] = mapped_column(String(36), nullable=True, default=None)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    error_message: Mapped[str] = mapped_column(Text, nullable=True, default=None)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    stripe_customer_id: Mapped[str] = mapped_column(String(255), nullable=True, default=None)

    user = relationship("User", back_populates="subscription")
