import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, or_, text, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.postgres_models import Comment, CommentLike
from app.database.postgres import async_session_factory


class CommentRepository:
    async def create(self, data: dict) -> str:
        comment_id = uuid.uuid4()
        async with async_session_factory() as db:
            stmt = text("""
                INSERT INTO comments (id, title_id, profile_id, profile_name, text, timestamp_seconds, parent_id, spoiler_tag, likes, is_deleted, created_at)
                VALUES (:id, :title_id, :profile_id, :profile_name, :text, :timestamp_seconds, :parent_id, :spoiler_tag, :likes, :is_deleted, :created_at)
            """)
            await db.execute(stmt, {
                "id": comment_id,
                "title_id": data["title_id"],
                "profile_id": data["profile_id"],
                "profile_name": data["profile_name"],
                "text": data["text"],
                "timestamp_seconds": data["timestamp_seconds"] if data.get("timestamp_seconds") is not None else 0.0,
                "parent_id": data.get("parent_id"),
                "spoiler_tag": data.get("spoiler_tag", False),
                "likes": 0,
                "is_deleted": False,
                "created_at": datetime.now(timezone.utc),
            })
            await db.commit()
        return str(comment_id)

    async def get_by_id(self, comment_id: str) -> Optional[dict]:
        async with async_session_factory() as db:
            stmt = select(Comment).where(Comment.id == uuid.UUID(comment_id))
            result = await db.execute(stmt)
            comment = result.scalar_one_or_none()
            if not comment:
                return None
            return self._to_dict(comment)

    async def update(self, comment_id: str, data: dict) -> bool:
        async with async_session_factory() as db:
            stmt = select(Comment).where(Comment.id == uuid.UUID(comment_id))
            result = await db.execute(stmt)
            comment = result.scalar_one_or_none()
            if not comment:
                return False
            for key, value in data.items():
                if hasattr(comment, key):
                    setattr(comment, key, value)
            comment.edited_at = datetime.now(timezone.utc)
            await db.commit()
            return True

    async def delete(self, comment_id: str) -> bool:
        return await self.update(comment_id, {"is_deleted": True})

    async def list_by_title(self, title_id: str, page: int = 1, page_size: int = 20, max_timestamp: Optional[float] = None, parent_id: Optional[str] = None) -> tuple[list[dict], int]:
        async with async_session_factory() as db:
            filters = [Comment.title_id == title_id, Comment.is_deleted == False]
            if max_timestamp is not None:
                filters.append(Comment.timestamp_seconds <= max_timestamp)
            if parent_id is not None:
                filters.append(Comment.parent_id == uuid.UUID(parent_id))
            else:
                filters.append(Comment.parent_id.is_(None))

            count_q = select(func.count()).select_from(Comment).where(and_(*filters))
            total_result = await db.execute(count_q)
            total = total_result.scalar() or 0

            q = select(Comment).where(and_(*filters)).order_by(Comment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
            result = await db.execute(q)
            items = [self._to_dict(c) for c in result.scalars().all()]
            return items, total

    async def toggle_like(self, comment_id: str, profile_id: str) -> dict:
        cid = uuid.UUID(comment_id)
        pid = uuid.UUID(profile_id)
        async with async_session_factory() as db:
            comment = await db.execute(select(Comment).where(Comment.id == cid))
            comment = comment.scalar_one_or_none()
            if not comment:
                return {"liked": False, "likes_count": 0}

            existing = await db.execute(
                select(CommentLike).where(and_(CommentLike.comment_id == cid, CommentLike.profile_id == pid))
            )
            existing = existing.scalar_one_or_none()

            if existing:
                await db.delete(existing)
                comment.likes -= 1
                liked = False
            else:
                db.add(CommentLike(id=uuid.uuid4(), comment_id=cid, profile_id=pid))
                comment.likes += 1
                liked = True

            await db.commit()
            return {"liked": liked, "likes_count": comment.likes}

    async def get_replies(self, comment_id: str, page: int = 1, page_size: int = 20) -> tuple[list[dict], int]:
        async with async_session_factory() as db:
            filters = [Comment.parent_id == uuid.UUID(comment_id), Comment.is_deleted == False]
            count_q = select(func.count()).select_from(Comment).where(and_(*filters))
            total_result = await db.execute(count_q)
            total = total_result.scalar() or 0

            q = select(Comment).where(and_(*filters)).order_by(Comment.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
            result = await db.execute(q)
            items = [self._to_dict(c) for c in result.scalars().all()]
            return items, total

    def _to_dict(self, c: Comment) -> dict:
        return {
            "id": str(c.id),
            "title_id": c.title_id,
            "profile_id": str(c.profile_id),
            "profile_name": c.profile_name,
            "text": c.text,
            "timestamp_seconds": c.timestamp_seconds,
            "parent_id": str(c.parent_id) if c.parent_id else None,
            "spoiler_tag": c.spoiler_tag,
            "likes": c.likes,
            "is_deleted": c.is_deleted,
            "avatar_url": None,
            "replies": [],
            "created_at": c.created_at.isoformat() if c.created_at else datetime.now(timezone.utc).isoformat(),
            "edited_at": c.edited_at.isoformat() if c.edited_at else None,
        }
