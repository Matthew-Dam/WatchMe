import json
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import StreamingResponse
from app.database.postgres import async_session_factory
from app.repositories.user_repo import UserRepository
from app.repositories.chat_repo import ChatRepository
from app.services.auth_service import AuthService
from app.services.sse_manager import chat_sse_manager

router = APIRouter(tags=["Chat"])


async def _verify_token(token: str, profile_id: str) -> dict | None:
    async with async_session_factory() as db:
        auth_service = AuthService(UserRepository(db))
        payload = auth_service.decode_token(token)
        if not payload:
            return None
        user_id = uuid.UUID(payload["sub"])
        user = await auth_service.get_user(user_id)
        if not user:
            return None
        repo = UserRepository(db)
        profile = await repo.get_profile_by_id(uuid.UUID(profile_id))
        if not profile or str(profile.user_id) != str(user_id):
            return None
        return {
            "id": str(profile.id),
            "user_id": str(user["id"]),
            "name": profile.name,
            "avatar_url": profile.avatar_url,
        }


async def _event_generator(room: str, history: list[dict]):
    yield f"data: {json.dumps({'type': 'history', 'messages': history})}\n\n"
    queue = chat_sse_manager.join(room)
    try:
        while True:
            message = await queue.get()
            yield f"data: {json.dumps(message)}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        chat_sse_manager.leave(room, queue)


@router.get("/events/chat/{title_id}")
async def chat_sse(
    title_id: str,
    token: str = Query(...),
    profile_id: str = Query(...),
):
    profile = await _verify_token(token, profile_id)
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid auth")
    history: list[dict] = []
    try:
        chat_repo = ChatRepository()
        raw_history = await chat_repo.get_messages(title_id, 50)
        for m in raw_history:
            history.append({
                "id": m.get("id", ""),
                "user_id": m.get("profile_id", ""),
                "username": m.get("profile_name", "Unknown"),
                "avatar_url": m.get("avatar_url"),
                "title_id": title_id,
                "content": m.get("text", ""),
                "is_system": False,
                "created_at": m.get("created_at", ""),
            })
    except Exception:
        pass
    room = f"chat:{title_id}"
    return StreamingResponse(
        _event_generator(room, history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/titles/{title_id}/chat/send")
async def send_chat_message(
    title_id: str,
    token: str = Query(...),
    profile_id: str = Query(...),
    content: str = Query(..., min_length=1, max_length=1000),
    timestamp_seconds: float = Query(0.0),
):
    profile = await _verify_token(token, profile_id)
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid auth")
    raw_message = {
        "title_id": title_id,
        "profile_id": profile["id"],
        "profile_name": profile["name"],
        "avatar_url": profile["avatar_url"],
        "text": content,
        "timestamp_seconds": timestamp_seconds,
    }
    broadcast_msg = {
        "type": "message",
        "id": str(uuid.uuid4()),
        "user_id": profile["id"],
        "username": profile["name"],
        "avatar_url": profile["avatar_url"],
        "title_id": title_id,
        "content": content,
        "is_system": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        chat_repo = ChatRepository()
        saved = await chat_repo.save_message(raw_message)
        if saved and saved.get("id"):
            broadcast_msg["id"] = saved["id"]
        if saved and saved.get("created_at"):
            broadcast_msg["created_at"] = saved["created_at"]
    except Exception:
        pass
    room = f"chat:{title_id}"
    await chat_sse_manager.broadcast(room, broadcast_msg)
    return broadcast_msg
