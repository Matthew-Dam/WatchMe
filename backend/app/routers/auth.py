import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    UserResponse, UserUpdateRequest, ProfileCreate, ProfileUpdate,
    ProfileResponse, ProfileSwitch,
)
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.deps.db_deps import get_db_session
from app.deps.auth_deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service(db: AsyncSession = Depends(get_db_session)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    try:
        return await service.register(req.email, req.password, req.display_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    device_info = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    try:
        return await service.login(req.email, req.password, device_info, ip_address)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    try:
        result = await service.refresh_access_token(req.refresh_token)
        return TokenResponse(**result, refresh_token=req.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(req: RefreshRequest, db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    await service.logout(req.refresh_token)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(req: UserUpdateRequest, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    result = await service.update_user(
        current_user["id"],
        display_name=req.display_name,
        avatar_url=req.avatar_url,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**result)


@router.get("/profiles", response_model=list[ProfileResponse])
async def list_profiles(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    return await service.get_profiles(current_user["id"])


@router.post("/profiles", response_model=ProfileResponse, status_code=201)
async def create_profile(req: ProfileCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    return await service.create_profile(current_user["id"], req.name, req.avatar_url, req.is_kid_mode, req.pin)


@router.put("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(profile_id: uuid.UUID, req: ProfileUpdate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    result = await service.update_profile(
        profile_id, current_user["id"],
        name=req.name, avatar_url=req.avatar_url,
        is_kid_mode=req.is_kid_mode, pin=req.pin,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse(**result)


@router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: uuid.UUID, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    success = await service.delete_profile(profile_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile deleted"}
