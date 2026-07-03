from typing import Optional
from datetime import datetime, timezone
from app.database.supabase import supabase


class ChatRepository:
    async def save_message(self, data: dict) -> dict:
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        result = await supabase.insert("chat_messages", data, use_service_role=True)
        return result

    async def get_messages(self, title_id: str, limit: int = 50, before_id: Optional[str] = None) -> list[dict]:
        filters = {"title_id": f"eq.{title_id}"}
        if before_id:
            filters["id"] = f"lt.{before_id}"
        items, _ = await supabase.select(
            "chat_messages", "*", filters,
            "created_at.desc", limit, 0,
        )
        items.reverse()
        return items

    async def delete_messages_by_title(self, title_id: str) -> int:
        if not supabase.client:
            return 0
        key = supabase.service_key or supabase.anon_key
        headers = {"apikey": key, "Authorization": f"Bearer {key}"}
        resp = await supabase.client.delete(
            "/rest/v1/chat_messages",
            params={"title_id": f"eq.{title_id}"},
            headers=headers,
        )
        return len(resp.json()) if resp.json() else 0
