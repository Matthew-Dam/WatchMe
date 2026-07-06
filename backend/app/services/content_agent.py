"""
CONTENT AGENT — MASTER CURATION PROMPT
========================================
Mission: Continuously fill the catalog with the BEST watchable content for GenZ+ audiences.

CURATION RULES (hard constraints):
1. WATCHABILITY FIRST: always prefer titles with actual video URLs (IA MP4 > YouTube embed > TMDB-only)
2. QUALITY FLOOR: minimum 720p for IA sources, skip anything labeled 512kb or lower
3. NO DUPLICATES: check tmdb_id AND title+year before every import
4. AUTO-CLASSIFY: every title must get mood_tags + categories from the classifier
5. TRAILERS: every TMDB-sourced title must have a trailer_url fetched
6. DEDUP ACROSS SOURCES: if a movie exists from IA, skip its TMDB import (and vice versa)

GENRE PRIORITY (what users watch most):
- Tier 1 (must-have): Animation, Action, Comedy, Horror, Thriller
- Tier 2 (high demand): Romance, Sci-Fi, Drama, Fantasy, Adventure
- Tier 3 (filler): Documentary, Music, War, Western, History

CONTENT MIX (target ratios):
- 40% Watchable (IA MP4/YouTube) — actual playable content
- 40% TMDB-sourced (metadata + trailer) — browsable catalog
- 20% Upcoming/trending — what's hot right now

QUALITY SIGNALS (for curation scoring):
- TMDB vote_average >= 6.0 → good
- TMDB vote_average >= 7.5 → excellent 
- TMDB popularity >= 20 → trending
- IA downloads >= 10000 → popular on IA
- Year >= 2020 → modern/relevant
- Animation genre → always include

SOURCE PRIORITY:
1. Internet Archive MP4 (720p+ direct playable link)
2. YouTube embed (Creative Commons / official free movies)
3. TMDB metadata-only (discovery / coming-soon / browsing)
"""
import asyncio
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete as sa_delete
from app.database.supabase import supabase
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.user_repo import UserRepository
from app.services.tmdb_service import TMDBService
from app.services.internet_archive_service import InternetArchiveService
from app.services.youtube_service import YouTubeService
from app.services.auto_classifier import enrich_with_tmdb, auto_classify, check_duplicate
from app.models.postgres_models import ImportLog, Comment, CommentLike

logger = logging.getLogger("content_agent")

ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"

IA_CURATED_COLLECTIONS: dict[str, list[dict[str, str]]] = {
    "classic-horror": [
        {"id": "Nosferatu1922", "title": "Nosferatu"},
        {"id": "TheCabinetofDrCaligari", "title": "The Cabinet of Dr. Caligari"},
        {"id": "ThePhantomoftheOpera1925", "title": "The Phantom of the Opera"},
        {"id": "TheHunchbackofNotreDame1923", "title": "The Hunchback of Notre Dame"},
        {"id": "DrJekyllandMrHyde1920", "title": "Dr. Jekyll and Mr. Hyde"},
        {"id": "TheGolem1920", "title": "The Golem"},
        {"id": "WhiteZombie1932", "title": "White Zombie"},
        {"id": "TheInvisibleRay1936", "title": "The Invisible Ray"},
        {"id": "TheBat1926", "title": "The Bat"},
        {"id": "TheLostWorld1925", "title": "The Lost World"},
    ],
    "classic-animation": [
        {"id": "GulliversTravels1939", "title": "Gulliver's Travels"},
        {"id": "TheAdventuresofPrinceAchmed", "title": "The Adventures of Prince Achmed"},
        {"id": "Gertie_the_Dinosaur", "title": "Gertie the Dinosaur"},
        {"id": "SteamboatWillie_2010", "title": "Steamboat Willie"},
        {"id": "TheSkeletonDance", "title": "The Skeleton Dance"},
        {"id": "FlowersandTrees_2010", "title": "Flowers and Trees"},
        {"id": "TheThreeLittlePigs1933", "title": "The Three Little Pigs"},
        {"id": "Dumbo1941", "title": "Dumbo"},
        {"id": "Bambi1942", "title": "Bambi"},
    ],
    "film-noir": [
        {"id": "DoubleIndemnity_1944", "title": "Double Indemnity"},
        {"id": "TheMalteseFalcon1941", "title": "The Maltese Falcon"},
        {"id": "TheBigSleep_1946", "title": "The Big Sleep"},
        {"id": "Notorious_1946", "title": "Notorious"},
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
        {"id": "Manos_the_Hands_of_Fate", "title": "Manos: The Hands of Fate"},
        {"id": "Attack_of_the_Giant_Leeches", "title": "Attack of the Giant Leeches"},
        {"id": "TheWerewolf1956", "title": "The Werewolf"},
        {"id": "TheAstoundingSheMonster1957", "title": "The Astounding She-Monster"},
        {"id": "TheBrainThatWouldntDie1962", "title": "The Brain That Wouldn't Die"},
        {"id": "TheHorrorofPartyBeach1964", "title": "The Horror of Party Beach"},
        {"id": "Dementia13_2011", "title": "Dementia 13"},
    ],
    "genz-essentials": [
        {"id": "TheNightmareBeforeChristmas", "title": "The Nightmare Before Christmas"},
        {"id": "TheRockyHorrorPictureShow", "title": "The Rocky Horror Picture Show"},
        {"id": "Eraserhead1977", "title": "Eraserhead"},
        {"id": "EvilDead2_2010", "title": "Evil Dead II"},
        {"id": "ArmyofDarkness", "title": "Army of Darkness"},
        {"id": "ReeferMadness1936", "title": "Reefer Madness"},
        {"id": "Clue1985", "title": "Clue"},
    ],
    "scifi-classics": [
        {"id": "TheDaytheEarthStoodStill1951", "title": "The Day the Earth Stood Still"},
        {"id": "InvasionoftheBodySnatchers1956", "title": "Invasion of the Body Snatchers"},
        {"id": "Them1954", "title": "Them!"},
        {"id": "TheThingfromAnotherWorld1951", "title": "The Thing from Another World"},
        {"id": "ForbiddenPlanet1956_201301", "title": "Forbidden Planet"},
        {"id": "TheWaroftheWorlds1953", "title": "The War of the Worlds"},
        {"id": "WhenWorldsCollide1951", "title": "When Worlds Collide"},
        {"id": "CreaturefromtheBlackLagoon1954", "title": "Creature from the Black Lagoon"},
        {"id": "TheFly1958", "title": "The Fly"},
        {"id": "TheIncredibleShrinkingMan1957", "title": "The Incredible Shrinking Man"},
    ],
    "action-adventure": [
        {"id": "TheMarkofZorro1920", "title": "The Mark of Zorro"},
        {"id": "ThePrisonerofZenda1922", "title": "The Prisoner of Zenda"},
        {"id": "RobinHood1922", "title": "Robin Hood"},
        {"id": "TheAdventuresofDonJuan", "title": "The Adventures of Don Juan"},
        {"id": "CaptainBlood1935", "title": "Captain Blood"},
        {"id": "TheSeaHawk1940", "title": "The Sea Hawk"},
        {"id": "TheAdventuresofRobinHood1938", "title": "The Adventures of Robin Hood"},
    ],
}


class ContentAgent:
    """
    CONTENT AGENT — MASTER CURATION PROMPT
    ----------------------------------------
    Mission: Continuously fill the catalog with the BEST watchable content.

    PRIORITIES:
    1. WATCHABILITY: IA MP4 > YouTube embed > TMDB-only (metadata)
    2. QUALITY: 720p+ only for IA, skip low-bitrate
    3. NO DUPLICATES: check tmdb_id AND title+year before import
    4. AUTO-CLASSIFY: every title gets moods + categories
    5. TRAILERS: every TMDB title gets a trailer_url
    6. DEDUP ACROSS SOURCES: don't import same movie twice

    GENRE PRIORITY: Animation, Action, Comedy, Horror, Thriller, Romance, Sci-Fi, Drama

    TARGET MIX: 40% watchable (IA/YouTube) + 40% TMDB catalog + 20% upcoming/trending
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CatalogRepository()
        self.user_repo = UserRepository(db)
        self.stats = {"imported": 0, "skipped": 0, "failed": 0, "trailers": 0, "watchable": 0}

    async def clear_all(self) -> dict:
        cleared = await supabase.delete_many("titles", {"is_published": "eq.true"}, use_service_role=True)
        for model in (CommentLike, Comment, ImportLog):
            await self.db.execute(sa_delete(model))
        await self.db.commit()
        return {"deleted_titles": cleared, "deleted_imports": True}

    async def _ia_import_one(self, identifier: str, title_name: str) -> bool:
        ia = InternetArchiveService()
        try:
            details = await ia.get_details(identifier)
            if not details or not details.get("download_url"):
                self.stats["failed"] += 1
                logger.info(f"[SKIP] {title_name}: no video URL from IA")
                return False

            dup = await check_duplicate(self.db, title_name, details.get("year"))
            if dup:
                self.stats["skipped"] += 1
                return False

            tmdb_data = await enrich_with_tmdb(title_name, details.get("year"), details.get("description"))

            data = {
                "title": title_name,
                "description": tmdb_data.get("description", details.get("description", "")) if tmdb_data else details.get("description", ""),
                "year": tmdb_data.get("year", details.get("year") or 0) if tmdb_data else (details.get("year") or 0),
                "hls_url": {"default": details["download_url"]},
                "poster_url": tmdb_data.get("poster_url", details.get("thumb_url")) if tmdb_data else details.get("thumb_url"),
                "backdrop_url": tmdb_data.get("backdrop_url") if tmdb_data else None,
                "content_type": "movie",
                "is_published": True,
            }

            if tmdb_data:
                data["genres"] = tmdb_data.get("genres", ["Public Domain"])
                data["tmdb_id"] = tmdb_data.get("tmdb_id")
                trailer = tmdb_data.get("trailer_url")
                if trailer:
                    data["trailer_url"] = trailer
                    self.stats["trailers"] += 1
                runtime = tmdb_data.get("duration")
                ai = auto_classify(genres=data["genres"], runtime=runtime, vote_average=tmdb_data.get("vote_average"), popularity=tmdb_data.get("popularity"), year=data["year"])
            else:
                data["genres"] = ["Public Domain"]
                ai = auto_classify(genres=["Public Domain"], year=data["year"])
            data.update(ai)

            title_id = await self.repo.create_title(data)
            await self.user_repo.log_import(ADMIN_USER_ID, title_name, data.get("tmdb_id"), "ia", title_id)
            self.stats["imported"] += 1
            self.stats["watchable"] += 1
            logger.info(f"[IMPORT] {title_name} (IA, watchable)")
            return True
        except Exception as e:
            logger.warning(f"[FAIL] {title_name}: {e}")
            self.stats["failed"] += 1
            return False
        finally:
            await ia.close()

    async def _tmdb_import_one(self, tmdb_id: int, media_type: str) -> bool:
        tmdb = TMDBService()
        try:
            data = await tmdb.get_movie_details(tmdb_id) if media_type == "movie" else await tmdb.get_tv_details(tmdb_id)
            if not data:
                self.stats["failed"] += 1
                return False

            title = data.get("title", "")
            year = data.get("year")

            dup = await check_duplicate(self.db, title, year, tmdb_id)
            if dup:
                self.stats["skipped"] += 1
                return False

            trailer_url = await tmdb.get_videos(tmdb_id, media_type)
            if trailer_url:
                data["trailer_url"] = trailer_url
                self.stats["trailers"] += 1

            had_watchable = False
            ia = InternetArchiveService()
            try:
                ia_result = await ia.search(title, page=1, rows=5)
                for item in ia_result.get("items", []):
                    if item.get("title", "").lower().startswith(title.lower()[:20]):
                        details = await ia.get_details(item["identifier"])
                        if details and details.get("download_url"):
                            data["hls_url"] = {"default": details["download_url"]}
                            had_watchable = True
                            self.stats["watchable"] += 1
                            logger.info(f"[WATCHABLE] {title} — found on IA")
                            break
            except Exception:
                pass
            finally:
                await ia.close()

            if not had_watchable:
                yt = YouTubeService()
                try:
                    yt_url = await yt.search_free_movie(title, year)
                    if yt_url:
                        data["hls_url"] = {"youtube": yt_url}
                        had_watchable = True
                        self.stats["watchable"] += 1
                        logger.info(f"[WATCHABLE] {title} — found on YouTube")
                except Exception:
                    pass
                finally:
                    await yt.close()

            ai = auto_classify(genres=data.get("genres"), runtime=data.get("duration"), vote_average=data.get("vote_average"), popularity=data.get("popularity"), year=year)
            data.update(ai)

            title_id = await self.repo.create_title(data)
            await self.user_repo.log_import(ADMIN_USER_ID, title, tmdb_id, media_type, title_id)
            self.stats["imported"] += 1
            logger.info(f"[IMPORT] {title} (TMDB, watchable={had_watchable})")
            return True
        except Exception as e:
            logger.warning(f"[FAIL] TMDB #{tmdb_id}: {e}")
            self.stats["failed"] += 1
            return False
        finally:
            await tmdb.close()

    async def import_ia_curated(self) -> dict:
        for slug, items in IA_CURATED_COLLECTIONS.items():
            logger.info(f"[IA COLLECTION] Importing {slug} ({len(items)} titles)")
            for item in items:
                await self._ia_import_one(item["id"], item["title"])
        return dict(self.stats)

    async def import_ia_top(self, limit: int = 40) -> dict:
        logger.info(f"[IA TOP] Fetching top {limit} feature films")
        ia = InternetArchiveService()
        try:
            result = await ia.search("feature film", page=1, rows=limit)
            for item in result.get("items", []):
                await self._ia_import_one(item["identifier"], item["title"])
        finally:
            await ia.close()
        return dict(self.stats)

    async def import_tmdb_trending(self, limit: int = 30) -> dict:
        logger.info(f"[TMDB TRENDING] Fetching weekly trending (top {limit})")
        tmdb = TMDBService()
        try:
            results = await tmdb.get_trending("movie", "week")
            for item in results[:limit]:
                tid = item.get("tmdb_id")
                if tid:
                    await self._tmdb_import_one(tid, "movie")
        finally:
            await tmdb.close()
        return dict(self.stats)

    async def import_tmdb_popular(self, limit: int = 60) -> dict:
        logger.info(f"[TMDB POPULAR] Fetching popular (top {limit})")
        tmdb = TMDBService()
        try:
            for page in (1, 2, 3):
                results = await tmdb.get_popular_movies(page)
                remaining = limit - (page - 1) * 20
                if remaining <= 0:
                    break
                for item in results[:remaining]:
                    tid = item.get("tmdb_id")
                    if tid:
                        await self._tmdb_import_one(tid, "movie")
        finally:
            await tmdb.close()
        return dict(self.stats)

    async def import_tmdb_top_rated(self, limit: int = 50) -> dict:
        logger.info(f"[TMDB TOP RATED] Fetching top rated (top {limit})")
        tmdb = TMDBService()
        try:
            for page in (1, 2):
                results = await tmdb.get_top_rated("movie", page)
                remaining = limit - (page - 1) * 20
                if remaining <= 0:
                    break
                for item in results[:remaining]:
                    tid = item.get("tmdb_id")
                    if tid:
                        await self._tmdb_import_one(tid, "movie")
        finally:
            await tmdb.close()
        return dict(self.stats)

    async def import_tmdb_animation(self, limit: int = 60) -> dict:
        logger.info(f"[TMDB ANIMATION] Fetching animated films (top {limit})")
        tmdb = TMDBService()
        try:
            for page in (1, 3):
                results = await tmdb.get_animation_movies(page)
                remaining = limit - (page - 1) * 20
                if remaining <= 0:
                    break
                for item in results[:remaining]:
                    tid = item.get("tmdb_id")
                    if tid:
                        await self._tmdb_import_one(tid, "movie")
        finally:
            await tmdb.close()
        return dict(self.stats)

    async def import_tmdb_upcoming(self, limit: int = 40) -> dict:
        logger.info(f"[TMDB UPCOMING] Fetching upcoming releases (top {limit})")
        tmdb = TMDBService()
        try:
            results = await tmdb.get_upcoming(1)
            imported = 0
            for item in results[:limit]:
                tid = item.get("tmdb_id")
                if not tid:
                    continue
                existing = await self.user_repo.check_imported(tid)
                if existing:
                    continue
                data = await tmdb.get_movie_details(tid)
                if not data:
                    continue
                data["is_published"] = True
                trailer_url = await tmdb.get_videos(tid, "movie")
                if trailer_url:
                    data["trailer_url"] = trailer_url
                    self.stats["trailers"] += 1
                ai = auto_classify(genres=data.get("genres"), runtime=data.get("duration"), vote_average=data.get("vote_average"), popularity=data.get("popularity"), year=data.get("year"))
                data.update(ai)
                title_id = await self.repo.create_title(data)
                await self.user_repo.log_import(ADMIN_USER_ID, data.get("title", ""), tid, "movie", title_id)
                imported += 1
            self.stats["imported"] += imported
        finally:
            await tmdb.close()
        return dict(self.stats)

    async def import_youtube_free_movies(self, limit: int = 30) -> dict:
        logger.info(f"[YOUTUBE] Fetching free Creative Commons movies (top {limit})")
        yt = YouTubeService()
        try:
            results = await yt.search_free_movies_batch("free movie full length creative commons", limit)
            imported = 0
            for r in results:
                title = r["title"]
                dup = await check_duplicate(self.db, title)
                if dup:
                    self.stats["skipped"] += 1
                    continue
                data = {
                    "title": title,
                    "description": r.get("description", ""),
                    "year": 0,
                    "hls_url": {"youtube": r["url"]},
                    "poster_url": r.get("thumbnail"),
                    "content_type": "movie",
                    "is_published": True,
                    "genres": ["Free"],
                }
                tmdb_data = await enrich_with_tmdb(title)
                if tmdb_data:
                    data.update({
                        "description": tmdb_data.get("description", r.get("description", "")),
                        "year": tmdb_data.get("year", 0),
                        "genres": tmdb_data.get("genres", ["Free"]),
                        "tmdb_id": tmdb_data.get("tmdb_id"),
                        "poster_url": tmdb_data.get("poster_url", r.get("thumbnail")),
                        "backdrop_url": tmdb_data.get("backdrop_url"),
                    })
                    trailer = tmdb_data.get("trailer_url")
                    if trailer:
                        data["trailer_url"] = trailer
                ai = auto_classify(genres=data.get("genres"), year=data.get("year"))
                data.update(ai)
                title_id = await self.repo.create_title(data)
                await self.user_repo.log_import(ADMIN_USER_ID, title, data.get("tmdb_id"), "youtube", title_id)
                imported += 1
            self.stats["imported"] += imported
            self.stats["watchable"] += imported
        finally:
            await yt.close()
        return dict(self.stats)

    async def backfill_trailers(self) -> int:
        logger.info("[BACKFILL] Fetching missing trailers")
        imports = await self.user_repo.get_all_successful_imports()
        title_ids = [i.title_id for i in imports if i.title_id]
        titles = await self.repo.get_titles_by_ids(title_ids) if title_ids else []
        tmdb = TMDBService()
        updated = 0
        try:
            for t in titles:
                if t.get("trailer_url"):
                    continue
                tid = t.get("tmdb_id")
                if not tid:
                    continue
                try:
                    url = await tmdb.get_videos(tid, "movie")
                    if url:
                        await self.repo.update_title(t["id"], {"trailer_url": url})
                        updated += 1
                except Exception:
                    pass
        finally:
            await tmdb.close()
        self.stats["trailers"] += updated
        return updated

    async def run_full_pipeline(self) -> dict:
        logger.info("=" * 60)
        logger.info("CONTENT AGENT: FULL PIPELINE STARTED")
        logger.info("=" * 60)

        steps = [
            ("[1/9] IA Curated Collections", self.import_ia_curated),
            ("[2/9] IA Top Feature Films", lambda: self.import_ia_top(30)),
            ("[3/9] TMDB Trending (weekly)", lambda: self.import_tmdb_trending(30)),
            ("[4/9] TMDB Popular", lambda: self.import_tmdb_popular(60)),
            ("[5/9] TMDB Top Rated", lambda: self.import_tmdb_top_rated(50)),
            ("[6/9] TMDB Animation", lambda: self.import_tmdb_animation(50)),
            ("[7/9] YouTube Free Movies", lambda: self.import_youtube_free_movies(20)),
            ("[8/9] Upcoming Releases", lambda: self.import_tmdb_upcoming(30)),
            ("[9/9] Backfill Trailers", lambda: self.backfill_trailers()),
        ]

        for name, fn in steps:
            logger.info(f"--- {name} ---")
            try:
                await fn()
            except Exception as e:
                logger.error(f"[ABORT] {name}: {e}")

        logger.info("=" * 60)
        logger.info(f"CONTENT AGENT DONE: {self.stats}")
        logger.info(f"  Imported: {self.stats['imported']}")
        logger.info(f"  Watchable: {self.stats['watchable']}")
        logger.info(f"  Skipped (dupes): {self.stats['skipped']}")
        logger.info(f"  Failed: {self.stats['failed']}")
        logger.info(f"  Trailers: {self.stats['trailers']}")
        logger.info("=" * 60)
        return dict(self.stats)
