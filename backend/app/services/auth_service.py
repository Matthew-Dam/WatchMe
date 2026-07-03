import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import jwt, JWTError
from app.config import settings
from app.repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

    def create_access_token(self, user_id: uuid.UUID) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {"sub": str(user_id), "exp": expire, "type": "access"}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def create_refresh_token(self, user_id: uuid.UUID) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None

    async def register(self, email: str, password: str, display_name: str) -> dict:
        existing = await self.user_repo.get_user_by_email(email)
        if existing:
            raise ValueError("Email already registered")
        password_hash = self.hash_password(password)
        user = await self.user_repo.create_user(email, password_hash, display_name)
        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token(user.id)
        session_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.user_repo.create_session(user.id, refresh_token, None, None, session_expires)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    async def login(self, email: str, password: str, device_info: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
        user = await self.user_repo.get_user_by_email(email)
        if not user or not self.verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise ValueError("Account is disabled")
        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token(user.id)
        session_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.user_repo.create_session(user.id, refresh_token, device_info, ip_address, session_expires)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

    async def refresh_access_token(self, refresh_token: str) -> dict:
        payload = self.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")
        session = await self.user_repo.get_session_by_refresh_token(refresh_token)
        if not session:
            raise ValueError("Session not found")
        user_id = uuid.UUID(payload["sub"])
        user = await self.user_repo.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        new_access_token = self.create_access_token(user_id)
        return {"access_token": new_access_token, "token_type": "bearer"}

    async def logout(self, refresh_token: str) -> None:
        session = await self.user_repo.get_session_by_refresh_token(refresh_token)
        if session:
            await self.user_repo.delete_session(session.id)

    async def get_user(self, user_id: uuid.UUID) -> Optional[dict]:
        user = await self.user_repo.get_user_by_id(user_id)
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified,
        }

    async def update_user(self, user_id: uuid.UUID, **kwargs) -> Optional[dict]:
        user = await self.user_repo.update_user(user_id, **kwargs)
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified,
        }

    async def get_profiles(self, user_id: uuid.UUID) -> list[dict]:
        profiles = await self.user_repo.get_profiles_by_user(user_id)
        return [
            {
                "id": p.id,
                "name": p.name,
                "avatar_url": p.avatar_url,
                "is_kid_mode": p.is_kid_mode,
                "created_at": p.created_at,
            }
            for p in profiles
        ]

    async def create_profile(self, user_id: uuid.UUID, name: str, avatar_url: Optional[str], is_kid_mode: bool, pin: Optional[str]) -> dict:
        pin_hash = self.hash_password(pin) if pin else None
        profile = await self.user_repo.create_profile(user_id, name, avatar_url, is_kid_mode, pin_hash)
        return {
            "id": profile.id,
            "name": profile.name,
            "avatar_url": profile.avatar_url,
            "is_kid_mode": profile.is_kid_mode,
            "created_at": profile.created_at,
        }

    async def update_profile(self, profile_id: uuid.UUID, user_id: uuid.UUID, **kwargs) -> Optional[dict]:
        profile = await self.user_repo.get_profile_by_id(profile_id)
        if not profile or profile.user_id != user_id:
            return None
        if "pin" in kwargs and kwargs["pin"]:
            kwargs["pin_hash"] = self.hash_password(kwargs.pop("pin"))
        elif "pin" in kwargs:
            kwargs.pop("pin")
        profile = await self.user_repo.update_profile(profile_id, **kwargs)
        if not profile:
            return None
        return {
            "id": profile.id,
            "name": profile.name,
            "avatar_url": profile.avatar_url,
            "is_kid_mode": profile.is_kid_mode,
            "created_at": profile.created_at,
        }

    async def delete_profile(self, profile_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        profile = await self.user_repo.get_profile_by_id(profile_id)
        if not profile or profile.user_id != user_id:
            return False
        return await self.user_repo.delete_profile(profile_id)
