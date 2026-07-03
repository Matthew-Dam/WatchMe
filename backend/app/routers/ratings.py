import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.ratings import RatingCreate, RatingResponse, TitleRatingSummary, UserRatingHistory
from app.repositories.user_repo import UserRepository
from app.repositories.catalog_repo import CatalogRepository
from app.services.rating_service import RatingService
from app.deps.db_deps import get_db_session
from app.deps.auth_deps import get_current_user, get_current_profile

router = APIRouter(prefix="/ratings", tags=["Ratings"])


def get_rating_service(db: AsyncSession = Depends(get_db_session)) -> RatingService:
    return RatingService(UserRepository(db), CatalogRepository())


@router.post("/{title_id}", response_model=RatingResponse)
async def rate_title(
    title_id: str,
    data: RatingCreate,
    current_user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db_session),
):
    service = get_rating_service(db)
    result = await service.upsert_rating(current_user["id"], uuid.UUID(profile["id"]), title_id, data.score)
    return RatingResponse(**result)


@router.get("/{title_id}", response_model=RatingResponse)
async def get_rating(
    title_id: str,
    current_user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db_session),
):
    service = get_rating_service(db)
    result = await service.get_rating(uuid.UUID(profile["id"]), title_id)
    if not result:
        raise HTTPException(status_code=404, detail="Rating not found")
    return RatingResponse(**result)


@router.get("/{title_id}/summary", response_model=TitleRatingSummary)
async def rating_summary(title_id: str, db: AsyncSession = Depends(get_db_session)):
    service = get_rating_service(db)
    return await service.get_title_summary(title_id)


@router.get("/user/history", response_model=UserRatingHistory)
async def rating_history(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db_session)):
    service = get_rating_service(db)
    return await service.get_user_rating_history(current_user["id"])
