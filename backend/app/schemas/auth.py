from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    is_verified: bool


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    is_kid_mode: bool = False
    pin: Optional[str] = Field(None, min_length=4, max_length=4)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_url: Optional[str] = None
    is_kid_mode: Optional[bool] = None
    pin: Optional[str] = Field(None, min_length=4, max_length=4)


class ProfileResponse(BaseModel):
    id: UUID
    name: str
    avatar_url: Optional[str] = None
    is_kid_mode: bool
    created_at: datetime


class ProfileSwitch(BaseModel):
    profile_id: UUID
