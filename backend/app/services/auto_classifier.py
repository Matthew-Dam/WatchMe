from typing import Optional
from app.services.tmdb_service import TMDBService
from app.services.mood_classifier import classify_moods
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.user_repo import UserRepository
from sqlalchemy.ext.asyncio import AsyncSession


MAX_CATEGORIES = 3


async def enrich_with_tmdb(
    title: str,
    year: Optional[int] = None,
    description: Optional[str] = None,
) -> Optional[dict]:
    tmdb = TMDBService()
    try:
        results = await tmdb.search_movie(title)
        if not results:
            if year:
                results = await tmdb.search_movie(title.split("(")[0].strip())
            if not results:
                return None

        best = None
        for r in results:
            r_year = r.get("year", 0)
            if year and r_year and abs(r_year - year) <= 2:
                best = r
                break
            if not best:
                best = r

        if not best:
            return None

        tid = best.get("tmdb_id")
        if not tid:
            return None

        details = await tmdb.get_movie_details(tid)
        if not details:
            details = best

        trailer_url = await tmdb.get_videos(tid, "movie")
        if trailer_url:
            details["trailer_url"] = trailer_url

        return details
    finally:
        await tmdb.close()


def auto_categorize(
    genres: Optional[list[str]] = None,
    vote_average: Optional[float] = None,
    popularity: Optional[float] = None,
    year: Optional[int] = None,
) -> list[str]:
    categories: list[str] = []

    if vote_average and vote_average >= 8.0:
        categories.append("Top Rated")
    elif vote_average and vote_average >= 7.0:
        categories.append("Top Rated")

    if popularity and popularity >= 30.0:
        categories.append("Trending Now")

    if year and year >= 2025:
        categories.append("New Releases")
    elif year and year >= 2023:
        categories.append("New Releases")

    if genres:
        if "Animation" in genres:
            categories.append("Animation")
        if "Documentary" in genres:
            categories.append("Documentary")
        if "Horror" in genres:
            categories.append("Horror")
        if "Romance" in genres or "Romance" in genres:
            categories.append("Romance")
        if "Comedy" in genres:
            categories.append("Comedy")

    if not categories:
        categories.append("Popular")

    return categories[:MAX_CATEGORIES]


async def check_duplicate(
    db: AsyncSession,
    title: str,
    year: Optional[int] = None,
    tmdb_id: Optional[int] = None,
) -> Optional[str]:
    if tmdb_id:
        user_repo = UserRepository(db)
        existing = await user_repo.check_imported(tmdb_id)
        if existing and existing.title_id:
            return existing.title_id

    repo = CatalogRepository()
    normalized = title.lower().strip()
    page = 1
    while True:
        items, _ = await repo.list_titles({}, page=page, page_size=100)
        if not items:
            break
        for t in items:
            t_title = (t.get("title") or "").lower().strip()
            if t_title == normalized:
                return t["id"]
            t_year = t.get("year")
            if t_year:
                try:
                    t_year = int(t_year)
                except (TypeError, ValueError):
                    t_year = None
            if normalized in t_title or t_title in normalized:
                if year and t_year and abs(year - t_year) <= 2:
                    return t["id"]
                if not year:
                    return t["id"]
        if len(items) < 100:
            break
        page += 1
    return None


def auto_classify(
    genres: Optional[list[str]] = None,
    runtime: Optional[int] = None,
    vote_average: Optional[float] = None,
    popularity: Optional[float] = None,
    year: Optional[int] = None,
) -> dict:
    moods = classify_moods(
        genres=genres,
        runtime=runtime,
        vote_average=vote_average,
        popularity=popularity,
    )
    categories = auto_categorize(
        genres=genres,
        vote_average=vote_average,
        popularity=popularity,
        year=year,
    )
    result: dict[str, list[str]] = {}
    if moods:
        result["mood_tags"] = moods
    if categories:
        result["categories"] = categories
    return result
