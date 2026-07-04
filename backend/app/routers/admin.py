from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps.auth_deps import require_admin
from app.deps.db_deps import get_db_session
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.user_repo import UserRepository
from app.services.tmdb_service import TMDBService
from app.services.internet_archive_service import InternetArchiveService
from app.services.auto_classifier import enrich_with_tmdb, auto_classify, check_duplicate
from app.services.content_agent import ContentAgent

router = APIRouter(prefix="/admin", tags=["Admin"])


TMDB_GENRE_IDS: dict[str, int] = {
    "Action": 28, "Adventure": 12, "Animation": 16, "Comedy": 35,
    "Crime": 80, "Documentary": 99, "Drama": 18, "Family": 10751,
    "Fantasy": 14, "History": 36, "Horror": 27, "Music": 10402,
    "Mystery": 9648, "Romance": 10749, "Science Fiction": 878,
    "Thriller": 53, "War": 10752, "Western": 37,
}

IA_CURATED_COLLECTIONS: dict[str, list[dict[str, str]]] = {
    "classic-horror": [
        {"id": "Nosferatu1922", "title": "Nosferatu"},
        {"id": "TheCabinetofDrCaligari", "title": "The Cabinet of Dr. Caligari"},
        {"id": "ThePhantomoftheOpera1925", "title": "The Phantom of the Opera"},
        {"id": "TheHunchbackofNotreDame1923", "title": "The Hunchback of Notre Dame"},
        {"id": "DrJekyllandMrHyde1920", "title": "Dr. Jekyll and Mr. Hyde"},
        {"id": "TheGolem1920", "title": "The Golem"},
        {"id": "TheCatandtheCanary1927", "title": "The Cat and the Canary"},
        {"id": "LondonAfterMidnight", "title": "London After Midnight"},
        {"id": "TheBat1926", "title": "The Bat"},
        {"id": "TheLostWorld1925", "title": "The Lost World"},
        {"id": "TheInvisibleRay1936", "title": "The Invisible Ray"},
        {"id": "WhiteZombie1932", "title": "White Zombie"},
    ],
    "classic-animation": [
        {"id": "GulliversTravels1939", "title": "Gulliver's Travels"},
        {"id": "Dumbo1941", "title": "Dumbo"},
        {"id": "Bambi1942", "title": "Bambi"},
        {"id": "TheAdventuresofPrinceAchmed", "title": "The Adventures of Prince Achmed"},
        {"id": "Gertie_the_Dinosaur", "title": "Gertie the Dinosaur"},
        {"id": "SteamboatWillie_2010", "title": "Steamboat Willie"},
    ],
    "film-noir": [
        {"id": "DoubleIndemnity_1944", "title": "Double Indemnity"},
        {"id": "TheMalteseFalcon1941", "title": "The Maltese Falcon"},
        {"id": "TheBigSleep_1946", "title": "The Big Sleep"},
        {"id": "Notorious_1946", "title": "Notorious"},
        {"id": "TheStranger1946", "title": "The Stranger"},
        {"id": "TheLadyfromShanghai", "title": "The Lady from Shanghai"},
        {"id": "Gilda_1946", "title": "Gilda"},
        {"id": "ThePostmanAlwaysRingsTwice1946", "title": "The Postman Always Rings Twice"},
        {"id": "ScarletStreet", "title": "Scarlet Street"},
        {"id": "TheKillers_1946", "title": "The Killers"},
    ],
    "silent-classics": [
        {"id": "CityLights1931_201301", "title": "City Lights"},
        {"id": "TheGoldRush1925", "title": "The Gold Rush"},
        {"id": "Sunrise1927", "title": "Sunrise: A Song of Two Humans"},
        {"id": "Metropolis1927_201001", "title": "Metropolis"},
        {"id": "BattleshipPotemkin1925", "title": "Battleship Potemkin"},
        {"id": "TheGeneral1926_201001", "title": "The General"},
        {"id": "SafetyLast1923", "title": "Safety Last!"},
        {"id": "TheKid1921", "title": "The Kid"},
        {"id": "SherlockJr", "title": "Sherlock Jr."},
        {"id": "Intolerance1916", "title": "Intolerance"},
        {"id": "TheThiefofBagdad1924", "title": "The Thief of Bagdad"},
    ],
    "public-domain-classics": [
        {"id": "ItsAWonderfulLife1946", "title": "It's a Wonderful Life"},
        {"id": "NightoftheLivingDead1968", "title": "Night of the Living Dead"},
        {"id": "TheLittleShopofHorrors1960", "title": "The Little Shop of Horrors"},
        {"id": "CarnivalofSouls1962", "title": "Carnival of Souls"},
        {"id": "TheLastManonEarth1964", "title": "The Last Man on Earth"},
        {"id": "Plan9fromOuterSpace1959", "title": "Plan 9 from Outer Space"},
        {"id": "Dementia13_2011", "title": "Dementia 13"},
        {"id": "Manos_the_Hands_of_Fate", "title": "Manos: The Hands of Fate"},
        {"id": "TheHorrorofPartyBeach1964", "title": "The Horror of Party Beach"},
        {"id": "TheBrainThatWouldntDie1962", "title": "The Brain That Wouldn't Die"},
        {"id": "Attack_of_the_Giant_Leeches", "title": "Attack of the Giant Leeches"},
        {"id": "TheWerewolf1956", "title": "The Werewolf"},
    ],
    "genz-essentials": [
        {"id": "TheNightmareBeforeChristmas", "title": "The Nightmare Before Christmas"},
        {"id": "TheRockyHorrorPictureShow", "title": "The Rocky Horror Picture Show"},
        {"id": "Eraserhead1977", "title": "Eraserhead"},
        {"id": "TheCrow1994", "title": "The Crow"},
        {"id": "Clue1985", "title": "Clue"},
        {"id": "EvilDead2_2010", "title": "Evil Dead II"},
        {"id": "ArmyofDarkness", "title": "Army of Darkness"},
        {"id": "ReeferMadness1936", "title": "Reefer Madness"},
    ],
}


async def _tmdb_import_one(tmdb_id: int, media_type: str, admin: dict, db: AsyncSession, tmdb: TMDBService, repo: CatalogRepository, user_repo: UserRepository) -> dict:
    existing = await user_repo.check_imported(tmdb_id)
    if existing:
        return {"id": existing.title_id, "title": existing.title_name, "skipped": True}

    if media_type == "tv":
        data = await tmdb.get_tv_details(tmdb_id)
    else:
        data = await tmdb.get_movie_details(tmdb_id)
    if not data:
        raise HTTPException(status_code=404, detail="Title not found on TMDB")

    trailer_url = await tmdb.get_videos(tmdb_id, media_type)
    if trailer_url:
        data["trailer_url"] = trailer_url

    ai = auto_classify(
        genres=data.get("genres"),
        runtime=data.get("duration"),
        vote_average=data.get("vote_average"),
        popularity=data.get("popularity"),
        year=data.get("year"),
    )
    data.update(ai)

    title_id = await repo.create_title(data)

    user_id = str(admin["id"])
    await user_repo.log_import(user_id, data.get("title", data.get("name", "")), tmdb_id, media_type, title_id)
    return {"id": title_id, "title": data.get("title", data.get("name", "")), "trailer_url": trailer_url, **ai}


@router.get("/tmdb/search")
async def tmdb_search(
    query: str = Query(...),
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        if media_type == "tv":
            results = await tmdb.search_tv(query)
        else:
            results = await tmdb.search_movie(query)
        return {"items": results, "total": len(results)}
    finally:
        await tmdb.close()


@router.get("/tmdb/popular")
async def tmdb_popular(
    media_type: str = Query("movie"),
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        if media_type == "tv":
            results = await tmdb.get_popular_tv(page)
        else:
            results = await tmdb.get_popular_movies(page)
        return {"items": results, "total": len(results), "page": page}
    finally:
        await tmdb.close()


@router.get("/tmdb/trending")
async def tmdb_trending(
    media_type: str = Query("movie"),
    time_window: str = Query("week"),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        results = await tmdb.get_trending(media_type, time_window)
        return {"items": results, "total": len(results)}
    finally:
        await tmdb.close()


@router.get("/tmdb/top-rated")
async def tmdb_top_rated(
    media_type: str = Query("movie"),
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        results = await tmdb.get_top_rated(media_type, page)
        return {"items": results, "total": len(results), "page": page}
    finally:
        await tmdb.close()


@router.get("/tmdb/now-playing")
async def tmdb_now_playing(
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        results = await tmdb.get_now_playing()
        return {"items": results, "total": len(results)}
    finally:
        await tmdb.close()


@router.get("/tmdb/animation")
async def tmdb_animation(
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        results = await tmdb.get_animation_movies(page)
        return {"items": results, "total": len(results), "page": page}
    finally:
        await tmdb.close()


@router.get("/tmdb/by-genre")
async def tmdb_by_genre(
    genre: str = Query(...),
    media_type: str = Query("movie"),
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
):
    genre_id = TMDB_GENRE_IDS.get(genre)
    if not genre_id:
        raise HTTPException(status_code=400, detail=f"Unknown genre: {genre}")
    tmdb = TMDBService()
    try:
        results = await tmdb.discover_by_genre([genre_id], media_type, page)
        return {"items": results, "total": len(results), "page": page, "genre": genre}
    finally:
        await tmdb.close()


@router.get("/imports")
async def list_imports(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    user_id = str(admin["id"])
    user_repo = UserRepository(db)
    imports = await user_repo.get_import_history(user_id)
    return {
        "items": [
            {
                "id": i.id,
                "title_name": i.title_name,
                "tmdb_id": i.tmdb_id,
                "media_type": i.media_type,
                "status": i.status,
                "error_message": i.error_message,
                "imported_at": i.imported_at.isoformat() if i.imported_at else None,
            }
            for i in imports
        ],
        "total": len(imports),
    }


@router.post("/tmdb/import")
async def tmdb_import(
    tmdb_id: int,
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    tmdb = TMDBService()
    repo = CatalogRepository()
    user_repo = UserRepository(db)
    try:
        return await _tmdb_import_one(tmdb_id, media_type, admin, db, tmdb, repo, user_repo)
    except HTTPException:
        raise
    except Exception as e:
        user_id = str(admin["id"])
        await user_repo.log_import(user_id, f"TMDB #{tmdb_id}", tmdb_id, media_type, None, "failed", str(e))
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")
    finally:
        await tmdb.close()


@router.post("/tmdb/bulk-import")
async def tmdb_bulk_import(
    source: str = Query(...),
    media_type: str = Query("movie"),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    tmdb = TMDBService()
    repo = CatalogRepository()
    user_repo = UserRepository(db)

    fetch_map = {
        "popular": lambda: tmdb.get_popular_movies(page) if media_type == "movie" else tmdb.get_popular_tv(page),
        "trending": lambda: tmdb.get_trending(media_type, "week"),
        "top_rated": lambda: tmdb.get_top_rated(media_type, page),
        "now_playing": lambda: tmdb.get_now_playing(),
        "animation": lambda: tmdb.get_animation_movies(page),
    }

    fetcher = fetch_map.get(source)
    if not fetcher:
        raise HTTPException(status_code=400, detail=f"Unknown source: {source}. Options: popular, trending, top_rated, now_playing, animation")

    try:
        results = await fetcher()
        imported = 0
        skipped = 0
        failed = 0
        for item in results[:limit]:
            tid = item.get("tmdb_id")
            if not tid:
                continue
            try:
                result = await _tmdb_import_one(tid, media_type, admin, db, tmdb, repo, user_repo)
                if result.get("skipped"):
                    skipped += 1
                else:
                    imported += 1
            except HTTPException:
                skipped += 1
            except Exception:
                failed += 1
        return {"imported": imported, "skipped": skipped, "failed": failed, "source": source, "limit": limit}
    finally:
        await tmdb.close()


@router.post("/tmdb/fetch-trailer")
async def fetch_trailer(
    tmdb_id: int,
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    tmdb = TMDBService()
    try:
        trailer_url = await tmdb.get_videos(tmdb_id, media_type)
        if not trailer_url:
            return {"trailer_url": None, "found": False}
        repo = CatalogRepository()
        user_repo = UserRepository(db)
        found_title = await user_repo.check_imported(tmdb_id)
        if found_title:
            await repo.update_title(found_title.title_id, {"trailer_url": trailer_url})
            return {"trailer_url": trailer_url, "found": True, "title_id": found_title.title_id}
        return {"trailer_url": trailer_url, "found": False, "note": "No matching imported title found"}
    finally:
        await tmdb.close()


@router.get("/ia/search")
async def ia_search(
    query: str = Query(...),
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
):
    ia = InternetArchiveService()
    try:
        return await ia.search(query, page=page)
    finally:
        await ia.close()


@router.get("/ia/collections")
async def ia_list_collections(admin: dict = Depends(require_admin)):
    return {
        "collections": [
            {"slug": slug, "name": _collection_name(slug), "count": len(items)}
            for slug, items in IA_CURATED_COLLECTIONS.items()
        ]
    }


@router.get("/ia/collection/{slug}")
async def ia_get_collection(
    slug: str,
    admin: dict = Depends(require_admin),
):
    items = IA_CURATED_COLLECTIONS.get(slug)
    if not items:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {slug}")
    return {"slug": slug, "items": items}


@router.post("/ia/import")
async def ia_import(
    identifier: str = Query(...),
    title_name: Optional[str] = Query(None),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    ia = InternetArchiveService()
    try:
        details = await ia.get_details(identifier)
        if not details or not details.get("download_url"):
            raise HTTPException(status_code=404, detail="No downloadable video found for this identifier")

        title = title_name or details["title"]
        year = details.get("year")
        if isinstance(year, str):
            try:
                year = int(year[:4])
            except (ValueError, TypeError):
                year = None
        year = year or 0

        duplicate_id = await check_duplicate(db, title, year)
        if duplicate_id:
            raise HTTPException(status_code=409, detail=f'"{title}" already exists in the catalog')

        tmdb_data = await enrich_with_tmdb(title, year, details.get("description"))

        data: dict = {
            "title": title,
            "description": tmdb_data.get("description", details.get("description", "")) if tmdb_data else details.get("description", ""),
            "year": tmdb_data.get("year", year) if tmdb_data else year,
            "hls_url": {"default": details["download_url"]},
            "poster_url": tmdb_data.get("poster_url", details.get("thumb_url")) if tmdb_data else details.get("thumb_url"),
            "backdrop_url": tmdb_data.get("backdrop_url") if tmdb_data else None,
            "cast_list": tmdb_data.get("cast_list", []) if tmdb_data else [],
            "crew": tmdb_data.get("crew", {}) if tmdb_data else {},
            "content_type": "movie",
            "is_published": True,
        }

        if tmdb_data:
            data["genres"] = tmdb_data.get("genres", ["Public Domain"])
            data["tmdb_id"] = tmdb_data.get("tmdb_id")
            trailer_url = tmdb_data.get("trailer_url")
            if trailer_url:
                data["trailer_url"] = trailer_url
            ai = auto_classify(
                genres=data.get("genres"),
                runtime=tmdb_data.get("duration"),
                vote_average=tmdb_data.get("vote_average"),
                popularity=tmdb_data.get("popularity"),
                year=data.get("year"),
            )
        else:
            data["genres"] = ["Public Domain"]
            ai = auto_classify(genres=["Public Domain"], year=data.get("year"))
        data.update(ai)

        repo = CatalogRepository()
        title_id = await repo.create_title(data)

        user_repo = UserRepository(db)
        user_id = str(admin["id"])
        await user_repo.log_import(user_id, title, data.get("tmdb_id"), "ia", title_id)

        return {"id": title_id, "title": title, "download_url": details["download_url"], **ai}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")
    finally:
        await ia.close()


@router.post("/ia/bulk-import-collection")
async def ia_bulk_import_collection(
    slug: str = Query(...),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    items = IA_CURATED_COLLECTIONS.get(slug)
    if not items:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {slug}")

    ia = InternetArchiveService()
    repo = CatalogRepository()
    user_repo = UserRepository(db)
    user_id = str(admin["id"])

    imported = 0
    skipped = 0
    failed = 0
    try:
        for item in items:
            try:
                details = await ia.get_details(item["id"])
                if not details or not details.get("download_url"):
                    failed += 1
                    continue

                title = item["title"]
                duplicate_id = await check_duplicate(db, title, details.get("year"))
                if duplicate_id:
                    skipped += 1
                    continue

                tmdb_data = await enrich_with_tmdb(title, details.get("year"), details.get("description"))

                data: dict = {
                    "title": title,
                    "description": tmdb_data.get("description", details.get("description", "")) if tmdb_data else details.get("description", ""),
                    "year": tmdb_data.get("year", details.get("year") or 0) if tmdb_data else (details.get("year") or 0),
                    "hls_url": {"default": details["download_url"]},
                    "poster_url": tmdb_data.get("poster_url", details.get("thumb_url")) if tmdb_data else details.get("thumb_url"),
                    "backdrop_url": tmdb_data.get("backdrop_url") if tmdb_data else None,
                    "cast_list": tmdb_data.get("cast_list", []) if tmdb_data else [],
                    "crew": tmdb_data.get("crew", {}) if tmdb_data else {},
                    "content_type": "movie",
                    "is_published": True,
                }

                if tmdb_data:
                    data["genres"] = tmdb_data.get("genres", ["Public Domain"])
                    data["tmdb_id"] = tmdb_data.get("tmdb_id")
                    trailer_url = tmdb_data.get("trailer_url")
                    if trailer_url:
                        data["trailer_url"] = trailer_url
                    ai = auto_classify(
                        genres=data.get("genres"),
                        runtime=tmdb_data.get("duration"),
                        vote_average=tmdb_data.get("vote_average"),
                        popularity=tmdb_data.get("popularity"),
                        year=data.get("year"),
                    )
                else:
                    data["genres"] = ["Public Domain"]
                    ai = auto_classify(genres=["Public Domain"], year=data.get("year"))
                data.update(ai)

                title_id = await repo.create_title(data)
                await user_repo.log_import(user_id, title, data.get("tmdb_id"), "ia", title_id)
                imported += 1
            except Exception:
                failed += 1
        return {"imported": imported, "skipped": skipped, "failed": failed, "collection": slug}
    finally:
        await ia.close()


@router.post("/ia/bulk-import-top")
async def ia_bulk_import_top(
    limit: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    ia = InternetArchiveService()
    repo = CatalogRepository()
    user_repo = UserRepository(db)
    user_id = str(admin["id"])

    try:
        result = await ia.search("feature film", page=1, rows=limit)
        imported = 0
        skipped = 0
        failed = 0
        for item in result.get("items", []):
            try:
                identifier = item["identifier"]
                title = item["title"]
                year = item.get("year")

                duplicate_id = await check_duplicate(db, title, year)
                if duplicate_id:
                    skipped += 1
                    continue

                details = await ia.get_details(identifier)
                if not details or not details.get("download_url"):
                    skipped += 1
                    continue

                tmdb_data = await enrich_with_tmdb(title, year, details.get("description") or item.get("description"))

                data: dict = {
                    "title": title,
                    "description": tmdb_data.get("description", item.get("description", "")) if tmdb_data else item.get("description", ""),
                    "year": tmdb_data.get("year", year or 0) if tmdb_data else (year or 0),
                    "hls_url": {"default": details["download_url"]},
                    "poster_url": tmdb_data.get("poster_url", item.get("thumb_url")) if tmdb_data else item.get("thumb_url"),
                    "backdrop_url": tmdb_data.get("backdrop_url") if tmdb_data else None,
                    "cast_list": tmdb_data.get("cast_list", []) if tmdb_data else [],
                    "crew": tmdb_data.get("crew", {}) if tmdb_data else {},
                    "content_type": "movie",
                    "is_published": True,
                }

                if tmdb_data:
                    data["genres"] = tmdb_data.get("genres", ["Public Domain"])
                    data["tmdb_id"] = tmdb_data.get("tmdb_id")
                    trailer_url = tmdb_data.get("trailer_url")
                    if trailer_url:
                        data["trailer_url"] = trailer_url
                    ai = auto_classify(
                        genres=data.get("genres"),
                        runtime=tmdb_data.get("duration"),
                        vote_average=tmdb_data.get("vote_average"),
                        popularity=tmdb_data.get("popularity"),
                        year=data.get("year"),
                    )
                else:
                    data["genres"] = ["Public Domain"]
                    ai = auto_classify(genres=["Public Domain"], year=data.get("year"))
                data.update(ai)

                title_id = await repo.create_title(data)
                await user_repo.log_import(user_id, title, data.get("tmdb_id"), "ia", title_id)
                imported += 1
            except Exception:
                failed += 1
        return {"imported": imported, "skipped": skipped, "failed": failed}
    finally:
        await ia.close()


@router.post("/tmdb/backfill-trailers")
async def backfill_trailers(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    user_repo = UserRepository(db)
    imports = await user_repo.get_all_successful_imports()
    if not imports:
        return {"updated": 0, "total": 0, "failed": 0, "skipped": 0, "message": "No imported titles found"}

    repo = CatalogRepository()
    title_ids = [i.title_id for i in imports if i.title_id]
    titles = await repo.get_titles_by_ids(title_ids) if title_ids else []
    title_map = {t["id"]: t for t in titles}

    import_map = {i.title_id: i for i in imports if i.title_id}
    to_update = []
    for t in titles:
        if not t.get("trailer_url"):
            imp = import_map.get(t["id"])
            if imp:
                to_update.append(imp)

    if not to_update:
        return {"updated": 0, "total": len(imports), "failed": 0, "skipped": len(imports), "message": "All titles already have trailers"}

    tmdb = TMDBService()
    updated = 0
    failed = 0
    try:
        for imp in to_update:
            try:
                trailer_url = await tmdb.get_videos(imp.tmdb_id, imp.media_type or "movie")
                if trailer_url:
                    await repo.update_title(imp.title_id, {"trailer_url": trailer_url})
                    updated += 1
            except Exception:
                failed += 1
    finally:
        await tmdb.close()

    return {
        "updated": updated,
        "total": len(imports),
        "failed": failed,
        "skipped": len(imports) - len(to_update) + (len(to_update) - updated - failed),
    }


@router.post("/backfill-moods")
async def backfill_moods(
    admin: dict = Depends(require_admin),
):
    repo = CatalogRepository()
    items, total = await repo.list_titles({"is_published": "eq.true"}, page=1, page_size=500)
    updated = 0
    for t in items:
        if t.get("mood_tags") and len(t["mood_tags"]) > 0:
            continue
        genres = t.get("genres", [])
        year = t.get("year") or None
        try:
            year = int(year)
        except (TypeError, ValueError):
            year = None
        ai = auto_classify(
            genres=genres,
            runtime=t.get("duration"),
            year=year,
        )
        if ai.get("mood_tags") or ai.get("categories"):
            await repo.update_title(t["id"], ai)
            updated += 1
    return {"total": total, "updated": updated, "skipped": total - updated}


@router.post("/clear-all")
async def clear_all_titles(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    agent = ContentAgent(db)
    return await agent.clear_all()


@router.post("/run-pipeline")
async def run_pipeline(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    agent = ContentAgent(db)
    return await agent.run_full_pipeline()


def _collection_name(slug: str) -> str:
    names = {
        "classic-horror": "Classic Horror",
        "classic-animation": "Classic Animation",
        "film-noir": "Film Noir",
        "silent-classics": "Silent Classics",
        "public-domain-classics": "Public Domain Classics",
        "genz-essentials": "Gen Z Essentials",
    }
    return names.get(slug, slug.replace("-", " ").title())
