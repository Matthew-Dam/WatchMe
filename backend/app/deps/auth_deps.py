import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.postgres import get_db
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.deps.db_deps import get_db_session

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    auth_service = AuthService(UserRepository(db))
    payload = auth_service.decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = uuid.UUID(payload["sub"])
    user = await auth_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_profile(
    profile_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    repo = UserRepository(db)
    profile = await repo.get_profile_by_id(uuid.UUID(profile_id))
    if not profile or str(profile.user_id) != str(current_user["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "name": profile.name,
        "avatar_url": profile.avatar_url,
        "is_kid_mode": profile.is_kid_mode,
    }


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    is_admin = current_user.get("email", "").endswith("@watchme.com") or current_user.get("is_admin", False)
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
