import json
import asyncio
import uuid
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import StreamingResponse
from app.database.postgres import async_session_factory
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.services.sse_manager import party_sse_manager

router = APIRouter(tags=["WatchParty"])


async def _verify_token(token: str) -> dict | None:
    async with async_session_factory() as db:
        auth_service = AuthService(UserRepository(db))
        payload = auth_service.decode_token(token)
        if not payload:
            return None
        user_id = uuid.UUID(payload["sub"])
        user = await auth_service.get_user(user_id)
        if not user:
            return None
        return {"id": str(user.id), "email": user.get("email", "")}


async def _event_generator(room: str):
    queue = party_sse_manager.join(room)
    try:
        while True:
            message = await queue.get()
            yield f"data: {json.dumps(message)}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        party_sse_manager.leave(room, queue)


@router.get("/events/watch-party/{party_id}")
async def watch_party_sse(
    party_id: str,
    token: str = Query(...),
):
    user = await _verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid auth")
    room = f"party:{party_id}"
    return StreamingResponse(
        _event_generator(room),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/watch-party/{party_id}/event")
async def send_party_event(
    party_id: str,
    token: str = Query(...),
    event_type: str = Query(...),
    profile_id: str = Query(...),
    username: str = Query(""),
    avatar_url: str | None = Query(None),
    current_time: float = Query(0.0),
):
    user = await _verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid auth")
    room = f"party:{party_id}"
    event: dict = {
        "type": event_type,
        "profile_id": profile_id,
        "username": username,
        "avatar_url": avatar_url,
        "current_time": current_time,
    }
    await party_sse_manager.broadcast(room, event)
    return {"ok": True}
