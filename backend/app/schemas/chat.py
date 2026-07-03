from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChatMessageSend(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    timestamp_seconds: float = 0.0


class ChatMessageResponse(BaseModel):
    id: str
    title_id: str
    profile_id: str
    profile_name: str
    text: str
    timestamp_seconds: float
    created_at: datetime


class ChatHistory(BaseModel):
    items: list[ChatMessageResponse]
    total: int
