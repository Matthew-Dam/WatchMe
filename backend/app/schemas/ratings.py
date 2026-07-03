from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class RatingCreate(BaseModel):
    score: int = Field(..., ge=1, le=10)


class RatingResponse(BaseModel):
    id: UUID
    user_id: UUID
    profile_id: UUID
    title_id: UUID
    score: int
    created_at: datetime
    updated_at: datetime


class TitleRatingSummary(BaseModel):
    title_id: str
    average_rating: float
    total_ratings: int
    distribution: dict
    abandon_point: dict = {}


class UserRatingHistory(BaseModel):
    items: list[RatingResponse]
    total: int
