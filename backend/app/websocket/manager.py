import json
import asyncio
from typing import Optional
from fastapi import WebSocket
from app.database.redis import redis_client


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self._pubsub_task: Optional[asyncio.Task] = None

    async def connect(self, room: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
        await self._subscribe_room(room)

    async def disconnect(self, room: str, websocket: WebSocket) -> None:
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def broadcast(self, room: str, message: dict) -> None:
        if room in self.active_connections:
            dead = []
            for ws in self.active_connections[room]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[room].remove(ws)
        await self._publish_room(room, message)

    async def send_personal(self, websocket: WebSocket, message: dict) -> None:
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def _publish_room(self, room: str, message: dict) -> None:
        try:
            client = redis_client.get_client()
            payload = json.dumps({"room": room, "message": message})
            await client.publish(f"ws:{room}", payload)
        except Exception:
            pass

    async def _subscribe_room(self, room: str) -> None:
        try:
            client = redis_client.get_client()
            pubsub = client.pubsub()
            await pubsub.subscribe(f"ws:{room}")
            if not self._pubsub_task or self._pubsub_task.done():
                self._pubsub_task = asyncio.create_task(self._listen_pubsub(pubsub))
        except Exception:
            pass

    async def _listen_pubsub(self, pubsub) -> None:
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    room = data["room"]
                    msg = data["message"]
                    if room in self.active_connections:
                        dead = []
                        for ws in self.active_connections[room]:
                            try:
                                await ws.send_json(msg)
                            except Exception:
                                dead.append(ws)
                        for ws in dead:
                            self.active_connections[room].remove(ws)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe()


manager = ConnectionManager()
