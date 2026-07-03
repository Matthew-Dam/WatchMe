from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


def utcnow():
    return datetime.now(timezone.utc)


class Title(BaseModel):
    id: str = Field(alias="_id", default=None)
    title: str
    description: str
    year: int
    duration: int
    genres: list[str] = []
    countries: list[str] = []
    categories: list[str] = []
    cast: list[str] = []
    crew: dict = {}
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    hls_url: dict = {}
    mood_tags: list[str] = []
    abandon_point: dict = {"percentage": 0.0, "timestamp": 0.0}
    rating_distribution: dict = {}
    average_rating: float = 0.0
    total_ratings: int = 0
    is_published: bool = False
    content_type: str = "movie"
    seasons: list = []
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Episode(BaseModel):
    id: str = Field(alias="_id", default=None)
    title_id: str
    season_number: int
    episode_number: int
    title: str
    description: str
    duration: int
    hls_url: dict = {}
    still_url: Optional[str] = None
    air_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)


class Comment(BaseModel):
    id: str = Field(alias="_id", default=None)
    title_id: str
    profile_id: str
    profile_name: str
    text: str
    timestamp_seconds: float = 0.0
    parent_id: Optional[str] = None
    spoiler_tag: bool = False
    likes: int = 0
    created_at: datetime = Field(default_factory=utcnow)
    edited_at: Optional[datetime] = None


class ChatMessage(BaseModel):
    id: str = Field(alias="_id", default=None)
    title_id: str
    profile_id: str
    profile_name: str
    text: str
    timestamp_seconds: float = 0.0
    created_at: datetime = Field(default_factory=utcnow)


class Genre(BaseModel):
    id: str = Field(alias="_id", default=None)
    name: str
    slug: str
    description: Optional[str] = None


class Category(BaseModel):
    id: str = Field(alias="_id", default=None)
    name: str
    slug: str
    description: Optional[str] = None


class Country(BaseModel):
    id: str = Field(alias="_id", default=None)
    name: str
    slug: str
    description: Optional[str] = None


class MoodTag(BaseModel):
    id: str = Field(alias="_id", default=None)
    name: str
    slug: str
    description: Optional[str] = None
