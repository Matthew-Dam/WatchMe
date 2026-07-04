import asyncio
import json
from typing import Any


class SSEManager:
    def __init__(self):
        self._rooms: dict[str, set[asyncio.Queue]] = {}

    def join(self, room: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        if room not in self._rooms:
            self._rooms[room] = set()
        self._rooms[room].add(queue)
        return queue

    def leave(self, room: str, queue: asyncio.Queue):
        if room in self._rooms:
            self._rooms[room].discard(queue)
            if not self._rooms[room]:
                del self._rooms[room]

    async def broadcast(self, room: str, message: dict[str, Any]):
        if room in self._rooms:
            for queue in list(self._rooms[room]):
                await queue.put(message)

    def room_size(self, room: str) -> int:
        return len(self._rooms.get(room, set()))


chat_sse_manager = SSEManager()
party_sse_manager = SSEManager()
