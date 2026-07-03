import uuid
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps.db_deps import get_db_session
from app.deps.auth_deps import get_current_user
from app.repositories.user_repo import UserRepository
from app.repositories.catalog_repo import CatalogRepository
from app.services.rating_service import RatingService
from app.schemas.ratings import RatingCreate, RatingResponse, TitleRatingSummary

router = APIRouter(prefix="/titles", tags=["Titles"])


class ProgressRequest(BaseModel):
    progress: float
    duration: float
    episode_id: Optional[str] = None


async def _resolve_profile_id(current_user: dict, profile_id: Optional[str], db: AsyncSession) -> Optional[uuid.UUID]:
    if profile_id:
        return uuid.UUID(profile_id)
    repo = UserRepository(db)
    profiles_list = await repo.get_profiles_by_user(current_user["id"])
    if profiles_list:
        return profiles_list[0].id
    return None


@router.post("/{title_id}/progress")
async def save_progress(
    title_id: str,
    body: ProgressRequest,
    current_user: dict = Depends(get_current_user),
    profile_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
):
    resolved_id = await _resolve_profile_id(current_user, profile_id, db)
    if not resolved_id:
        raise HTTPException(status_code=400, detail="No profile found")
    repo = UserRepository(db)
    completed = body.duration > 0 and (body.progress / body.duration) >= 0.9
    episode_uuid = uuid.UUID(body.episode_id) if body.episode_id else None
    await repo.upsert_watch_history(
        profile_id=resolved_id,
        title_id=uuid.UUID(title_id),
        episode_id=episode_uuid,
        progress_seconds=body.progress,
        completed=completed,
    )
    return {"status": "ok"}


@router.get("/{title_id}/credits")
async def get_credits(title_id: str):
    repo = CatalogRepository()
    title = await repo.get_title_by_id(title_id)
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    cast_list = title.get("cast", [])
    crew = title.get("crew", {})
    cast = [
        {"id": str(i), "name": name, "character": "", "avatar_url": None}
        for i, name in enumerate(cast_list)
    ]
    return {"cast": cast, "crew": crew}


@router.get("/{title_id}/analytics/abandon")
async def get_abandon_analytics(title_id: str):
    repo = CatalogRepository()
    title = await repo.get_title_by_id(title_id)
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    abandon = title.get("abandon_point", {})
    return {
        "percentage": abandon.get("percentage", 0),
        "minute": abandon.get("timestamp", 0),
    }


@router.post("/{title_id}/ratings", response_model=RatingResponse)
async def rate_title_from_titles(
    title_id: str,
    data: RatingCreate,
    current_user: dict = Depends(get_current_user),
    profile_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
):
    resolved_id = await _resolve_profile_id(current_user, profile_id, db)
    if not resolved_id:
        raise HTTPException(status_code=400, detail="No profile found")
    service = RatingService(UserRepository(db), CatalogRepository())
    result = await service.upsert_rating(current_user["id"], resolved_id, title_id, data.score)
    return RatingResponse(**result)


@router.get("/{title_id}/ratings/me")
async def get_my_rating(
    title_id: str,
    current_user: dict = Depends(get_current_user),
    profile_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
):
    resolved_id = await _resolve_profile_id(current_user, profile_id, db)
    if not resolved_id:
        raise HTTPException(status_code=400, detail="No profile found")
    service = RatingService(UserRepository(db), CatalogRepository())
    result = await service.get_rating(resolved_id, title_id)
    if not result:
        raise HTTPException(status_code=404, detail="Rating not found")
    return RatingResponse(**result)


@router.get("/{title_id}/ratings/summary", response_model=TitleRatingSummary)
async def rating_summary_from_titles(title_id: str, db: AsyncSession = Depends(get_db_session)):
    service = RatingService(UserRepository(db), CatalogRepository())
    return await service.get_title_summary(title_id)
