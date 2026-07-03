from typing import Optional
from app.repositories.comment_repo import CommentRepository


class CommentService:
    def __init__(self, comment_repo: CommentRepository):
        self.repo = comment_repo

    async def create_comment(self, title_id: str, profile_id: str, profile_name: str, text: str, timestamp_seconds: float, parent_id: Optional[str], spoiler_tag: bool) -> dict:
        data = {
            "title_id": title_id,
            "profile_id": profile_id,
            "profile_name": profile_name,
            "text": text,
            "timestamp_seconds": timestamp_seconds,
            "parent_id": parent_id,
            "spoiler_tag": spoiler_tag,
        }
        comment_id = await self.repo.create(data)
        comment = await self.repo.get_by_id(comment_id)
        return comment

    async def update_comment(self, comment_id: str, profile_id: str, text: Optional[str], spoiler_tag: Optional[bool]) -> Optional[dict]:
        comment = await self.repo.get_by_id(comment_id)
        if not comment or comment["profile_id"] != profile_id:
            return None
        update_data = {}
        if text is not None:
            update_data["text"] = text
        if spoiler_tag is not None:
            update_data["spoiler_tag"] = spoiler_tag
        if not update_data:
            return comment
        await self.repo.update(comment_id, update_data)
        return await self.repo.get_by_id(comment_id)

    async def delete_comment(self, comment_id: str, profile_id: str) -> bool:
        comment = await self.repo.get_by_id(comment_id)
        if not comment or comment["profile_id"] != profile_id:
            return False
        return await self.repo.delete(comment_id)

    async def get_comments(self, title_id: str, page: int, page_size: int, max_timestamp: Optional[float] = None, parent_id: Optional[str] = None) -> dict:
        items, total = await self.repo.list_by_title(title_id, page, page_size, max_timestamp, parent_id)
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    async def toggle_like(self, comment_id: str) -> int:
        comment = await self.repo.get_by_id(comment_id)
        if not comment:
            return 0
        return await self.repo.toggle_like(comment_id, True)

    async def get_spoiler_free_comments(self, title_id: str, current_position: float, page: int, page_size: int) -> dict:
        return await self.get_comments(title_id, page, page_size, max_timestamp=current_position)
