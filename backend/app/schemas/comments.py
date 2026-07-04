from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    timestamp_seconds: Optional[float] = 0.0
    parent_id: Optional[str] = None
    spoiler_tag: bool = False


class CommentUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1, max_length=2000)
    spoiler_tag: Optional[bool] = None


class CommentResponse(BaseModel):
    id: str
    title_id: str
    user_id: str
    username: str
    avatar_url: str | None = None
    parent_id: str | None = None
    content: str
    is_spoiler: bool = False
    video_timestamp: float = 0.0
    likes_count: int = 0
    is_liked: bool = False
    replies: list["CommentResponse"] = []
    created_at: datetime
    updated_at: datetime | None = None


class CommentList(BaseModel):
    items: list[CommentResponse]
    total: int
    page: int
    page_size: int
