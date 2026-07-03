import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.websocket.manager import manager
from app.repositories.chat_repo import ChatRepository
from app.repositories.comment_repo import CommentRepository
from app.services.auth_service import AuthService
from app.repositories.user_repo import UserRepository
from app.database.postgres import async_session_factory

router = APIRouter()


@router.websocket("/ws/chat/{title_id}")
async def chat_websocket(websocket: WebSocket, title_id: str, token: str = Query(...), profile_id: str = Query(...)):
    async with async_session_factory() as db:
        auth_service = AuthService(UserRepository(db))
        payload = auth_service.decode_token(token)
        if not payload:
            await websocket.close(code=4001)
            return
        user_id = uuid.UUID(payload["sub"])
        user = await auth_service.get_user(user_id)
        if not user:
            await websocket.close(code=4001)
            return
        from app.deps.auth_deps import get_current_profile
        repo = UserRepository(db)
        profile = await repo.get_profile_by_id(uuid.UUID(profile_id))
        if not profile or str(profile.user_id) != str(user_id):
            await websocket.close(code=4001)
            return
        profile_name = profile.name
        profile_avatar = profile.avatar_url
    room = f"chat:{title_id}"
    await manager.connect(room, websocket)
    chat_repo = ChatRepository()
    raw_history = await chat_repo.get_messages(title_id, 50)
    history = []
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
    await manager.send_personal(websocket, {
        "type": "history",
        "messages": history,
    })
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            content = msg_data.get("content", msg_data.get("text", ""))
            raw_message = {
                "title_id": title_id,
                "profile_id": profile_id,
                "profile_name": profile_name,
                "avatar_url": profile_avatar,
                "text": content,
                "timestamp_seconds": msg_data.get("timestamp_seconds", 0.0),
            }
            saved = await chat_repo.save_message(raw_message)
            broadcast_msg = {
                "type": "message",
                "id": saved.get("id", str(uuid.uuid4())),
                "user_id": profile_id,
                "username": profile_name,
                "avatar_url": profile_avatar,
                "title_id": title_id,
                "content": content,
                "is_system": False,
                "created_at": saved.get("created_at", ""),
            }
            await manager.broadcast(room, broadcast_msg)
    except WebSocketDisconnect:
        await manager.disconnect(room, websocket)
    except Exception:
        await manager.disconnect(room, websocket)


@router.websocket("/ws/watch-party/{party_id}")
async def watch_party_websocket(websocket: WebSocket, party_id: str, token: str = Query(...)):
    async with async_session_factory() as db:
        auth_service = AuthService(UserRepository(db))
        payload = auth_service.decode_token(token)
        if not payload:
            await websocket.close(code=4001)
            return
    room = f"party:{party_id}"
    await manager.connect(room, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            event_type = msg_data.get("type", "")
            if event_type in ("play", "pause", "seek"):
                message = {
                    "type": event_type,
                    "profile_id": payload["sub"],
                    "timestamp": msg_data.get("timestamp", 0.0),
                    "current_time": msg_data.get("current_time", 0.0),
                    "party_id": party_id,
                }
                await manager.broadcast(room, message)
            elif event_type == "drift_correction":
                message = {
                    "type": "drift_correction",
                    "profile_id": payload["sub"],
                    "current_time": msg_data.get("current_time", 0.0),
                    "party_id": party_id,
                }
                await manager.broadcast(room, message)
    except WebSocketDisconnect:
        await manager.disconnect(room, websocket)
    except Exception:
        await manager.disconnect(room, websocket)
