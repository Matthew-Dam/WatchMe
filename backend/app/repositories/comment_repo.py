from typing import Optional
from datetime import datetime, timezone
from app.database.supabase import supabase


class CommentRepository:
    async def create(self, data: dict) -> str:
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        data["likes"] = 0
        result = await supabase.insert("comments", data, use_service_role=True)
        return result["id"]

    async def get_by_id(self, comment_id: str) -> Optional[dict]:
        return await supabase.select_one("comments", comment_id)

    async def update(self, comment_id: str, data: dict) -> bool:
        data["edited_at"] = datetime.now(timezone.utc).isoformat()
        return await supabase.update("comments", comment_id, data, use_service_role=True)

    async def delete(self, comment_id: str) -> bool:
        return await supabase.update("comments", comment_id, {"is_deleted": True}, use_service_role=True)

    async def list_by_title(self, title_id: str, page: int = 1, page_size: int = 20, max_timestamp: Optional[float] = None, parent_id: Optional[str] = None) -> tuple[list[dict], int]:
        filters = {"title_id": f"eq.{title_id}", "is_deleted": "eq.false"}
        if max_timestamp is not None:
            filters["timestamp_seconds"] = f"lte.{max_timestamp}"
        if parent_id is not None:
            filters["parent_id"] = f"eq.{parent_id}"
        else:
            filters["parent_id"] = "is.null"
        items, total = await supabase.select(
            "comments", "*", filters,
            "created_at.desc", page_size, (page - 1) * page_size,
        )
        return items, total

    async def toggle_like(self, comment_id: str, increment: bool = True) -> int:
        comment = await self.get_by_id(comment_id)
        if not comment:
            return 0
        current = comment.get("likes", 0)
        new_count = current + (1 if increment else -1)
        await supabase.update("comments", comment_id, {"likes": new_count}, use_service_role=True)
        return new_count

    async def get_replies(self, comment_id: str, page: int = 1, page_size: int = 20) -> tuple[list[dict], int]:
        filters = {"parent_id": f"eq.{comment_id}", "is_deleted": "eq.false"}
        items, total = await supabase.select(
            "comments", "*", filters,
            "created_at.asc", page_size, (page - 1) * page_size,
        )
        return items, total
