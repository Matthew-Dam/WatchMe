import uuid
from typing import Optional
from app.repositories.user_repo import UserRepository, Rating
from app.repositories.catalog_repo import CatalogRepository


class RatingService:
    def __init__(self, user_repo: UserRepository, catalog_repo: CatalogRepository):
        self.user_repo = user_repo
        self.catalog_repo = catalog_repo

    async def upsert_rating(self, user_id: uuid.UUID, profile_id: uuid.UUID, title_id: str, score: int) -> dict:
        title_id_uuid = uuid.UUID(title_id)
        rating = await self.user_repo.upsert_rating(user_id, profile_id, title_id_uuid, score)
        await self._update_title_rating_aggregate(title_id)
        return {
            "id": rating.id,
            "user_id": rating.user_id,
            "profile_id": rating.profile_id,
            "title_id": str(rating.title_id) if isinstance(rating.title_id, uuid.UUID) else rating.title_id,
            "score": rating.score,
            "created_at": rating.created_at,
            "updated_at": rating.updated_at,
        }

    async def get_rating(self, profile_id: uuid.UUID, title_id: str) -> Optional[dict]:
        title_id_uuid = uuid.UUID(title_id)
        rating = await self.user_repo.get_rating(profile_id, title_id_uuid)
        if not rating:
            return None
        return {
            "id": rating.id,
            "user_id": rating.user_id,
            "profile_id": rating.profile_id,
            "title_id": str(rating.title_id) if isinstance(rating.title_id, uuid.UUID) else rating.title_id,
            "score": rating.score,
            "created_at": rating.created_at,
            "updated_at": rating.updated_at,
        }

    async def get_title_summary(self, title_id: str) -> dict:
        title = await self.catalog_repo.get_title_by_id(title_id)
        if not title:
            return {
                "title_id": title_id,
                "average_rating": 0.0,
                "total_ratings": 0,
                "distribution": {},
                "abandon_point": {},
            }
        return {
            "title_id": title_id,
            "average_rating": title.get("average_rating", 0.0),
            "total_ratings": title.get("total_ratings", 0),
            "distribution": title.get("rating_distribution", {}),
            "abandon_point": title.get("abandon_point", {}),
        }

    async def get_user_rating_history(self, user_id: uuid.UUID) -> dict:
        ratings = await self.user_repo.get_ratings_by_user(user_id)
        items = [
            {
                "id": r.id,
                "user_id": r.user_id,
                "profile_id": r.profile_id,
                "title_id": str(r.title_id),
                "score": r.score,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in ratings
        ]
        return {"items": items, "total": len(items)}

    async def _update_title_rating_aggregate(self, title_id: str) -> None:
        title_id_uuid = uuid.UUID(title_id)
        from app.database.postgres import async_session_factory
        from sqlalchemy import text
        async with async_session_factory() as session:
            result = await session.execute(
                text("SELECT score, COUNT(*) as count FROM ratings WHERE title_id = :tid GROUP BY score"),
                {"tid": title_id_uuid},
            )
            rows = result.fetchall()
        distribution = {str(row[0]): row[1] for row in rows}
        total = sum(distribution.values())
        avg = sum(int(k) * v for k, v in distribution.items()) / total if total > 0 else 0.0
        await self.catalog_repo.update_title(title_id, {
            "average_rating": round(avg, 2),
            "total_ratings": total,
            "rating_distribution": distribution,
        })
