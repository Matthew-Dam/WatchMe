import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.deps.db_deps import get_db_session
from app.deps.auth_deps import get_current_user
from app.repositories.user_repo import UserRepository
from app.models.postgres_models import Subscription

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

PLANS = {
    "free": {"price": 0, "max_profiles": 1, "quality": "SD", "ads": True},
    "basic": {"price": 5.99, "max_profiles": 2, "quality": "HD", "ads": False},
    "standard": {"price": 9.99, "max_profiles": 4, "quality": "FHD", "ads": False},
    "premium": {"price": 14.99, "max_profiles": 6, "quality": "UHD", "ads": False},
}


class PlanInfo(BaseModel):
    id: str
    name: str
    price: float
    max_profiles: int
    quality: str
    ads: bool


@router.get("/plans")
async def list_plans():
    return [
        PlanInfo(id=k, name=k.capitalize(), **v)
        for k, v in PLANS.items()
    ]


@router.get("/my")
async def get_my_subscription(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user["id"])
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return {
            "plan": "free",
            "status": "active",
            "start_date": datetime.now(timezone.utc),
            "end_date": None,
        }
    return {
        "id": str(sub.id),
        "plan": sub.plan,
        "status": sub.status,
        "start_date": sub.start_date,
        "end_date": sub.end_date,
    }


class ChangePlanRequest(BaseModel):
    plan: str = Field(..., pattern="^(free|basic|standard|premium)$")


@router.post("/change-plan")
async def change_plan(
    req: ChangePlanRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user["id"])
    )
    sub = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if sub:
        sub.plan = req.plan
        sub.status = "active"
        sub.end_date = None
        if req.plan == "free":
            sub.end_date = now + timedelta(days=30)
    else:
        sub = Subscription(
            id=uuid.uuid4(),
            user_id=current_user["id"],
            plan=req.plan,
            status="active",
            start_date=now,
            end_date=None if req.plan != "free" else now + timedelta(days=30),
        )
        db.add(sub)
    await db.flush()
    return {
        "id": str(sub.id),
        "plan": sub.plan,
        "status": sub.status,
        "start_date": sub.start_date,
        "end_date": sub.end_date,
    }
