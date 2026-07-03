#!/usr/bin/env python3
"""Seed the WatchMe database with sample content."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.mongodb import mongodb
from app.database.postgres import postgres
from app.database.redis import redis_client
from datetime import datetime, timezone

SAMPLE_GENRES = [
    {"name": "Action", "slug": "action", "description": "High-energy sequences, fights, and stunts"},
    {"name": "Comedy", "slug": "comedy", "description": "Humorous stories intended to provoke laughter"},
    {"name": "Drama", "slug": "drama", "description": "Serious narrative emphasizing character development"},
    {"name": "Sci-Fi", "slug": "sci-fi", "description": "Speculative fiction exploring futuristic concepts"},
    {"name": "Horror", "slug": "horror", "description": "Designed to frighten and thrill"},
    {"name": "Thriller", "slug": "thriller", "description": "Suspenseful stories with tension and excitement"},
    {"name": "Romance", "slug": "romance", "description": "Focus on romantic relationships"},
    {"name": "Documentary", "slug": "documentary", "description": "Non-fictional factual storytelling"},
    {"name": "Animation", "slug": "animation", "description": "Illustrated art in motion"},
    {"name": "Mystery", "slug": "mystery", "description": "Puzzle-like narratives revealing hidden truths"},
]

SAMPLE_CATEGORIES = [
    {"name": "Popular", "slug": "popular", "description": "Trending and widely watched"},
    {"name": "New Releases", "slug": "new-releases", "description": "Recently added content"},
    {"name": "Award Winners", "slug": "award-winners", "description": "Critically acclaimed films"},
    {"name": "Indie", "slug": "indie", "description": "Independent film productions"},
    {"name": "Classics", "slug": "classics", "description": "Timeless films that defined cinema"},
]

SAMPLE_COUNTRIES = [
    {"name": "USA", "slug": "usa", "description": "United States of America"},
    {"name": "UK", "slug": "uk", "description": "United Kingdom"},
    {"name": "India", "slug": "india", "description": "India"},
    {"name": "France", "slug": "france", "description": "France"},
    {"name": "Japan", "slug": "japan", "description": "Japan"},
    {"name": "South Korea", "slug": "south-korea", "description": "South Korea"},
    {"name": "Nigeria", "slug": "nigeria", "description": "Nigeria"},
    {"name": "Ghana", "slug": "ghana", "description": "Ghana"},
]

SAMPLE_MOODS = [
    {"name": "Suspenseful", "slug": "suspenseful", "description": "Edge-of-your-seat tension"},
    {"name": "Heartwarming", "slug": "heartwarming", "description": "Warm and uplifting feelings"},
    {"name": "Dark", "slug": "dark", "description": "Somber and serious tone"},
    {"name": "Funny", "slug": "funny", "description": "Light-hearted and humorous"},
    {"name": "Thought-Provoking", "slug": "thought-provoking", "description": "Makes you think deeply"},
    {"name": "Action-Packed", "slug": "action-packed", "description": "Non-stop excitement"},
    {"name": "Slow-Burn", "slug": "slow-burn", "description": "Gradual, patient storytelling"},
    {"name": "Hopeful", "slug": "hopeful", "description": "Optimistic and inspiring"},
]

SAMPLE_TITLES = [
    {
        "title": "Neon Samurai",
        "description": "In a cyberpunk Tokyo, a disgraced samurai must protect a young girl who holds the key to stopping a corporate war. A visually stunning blend of feudal Japan and futuristic technology.",
        "year": 2024,
        "duration": 148,
        "genres": ["Action", "Sci-Fi", "Drama"],
        "countries": ["Japan", "USA"],
        "categories": ["Popular", "New Releases"],
        "cast": ["Ken Watanabe", "Zendaya", "Oscar Isaac"],
        "crew": {"director": "Denis Villeneuve", "writer": "Eric Roth"},
        "poster_url": "https://picsum.photos/seed/neon/400/600",
        "backdrop_url": "https://picsum.photos/seed/neon-bg/1280/720",
        "mood_tags": ["Action-Packed", "Dark", "Thought-Provoking"],
        "content_type": "movie",
        "average_rating": 8.7,
        "total_ratings": 12450,
        "rating_distribution": {"1": 2, "2": 1, "3": 5, "4": 12, "5": 18, "6": 45, "7": 230, "8": 890, "9": 2450, "10": 8797},
        "is_published": True,
    },
    {
        "title": "Laugh Factory",
        "description": "A struggling comedian gets one shot at the big time when a viral video changes his life overnight. But fame comes at a cost in this hilarious and heartfelt comedy.",
        "year": 2025,
        "duration": 112,
        "genres": ["Comedy", "Drama"],
        "countries": ["USA"],
        "categories": ["Popular"],
        "cast": ["John Mulaney", "Quinta Brunson", "Keegan-Michael Key"],
        "crew": {"director": "Taika Waititi", "writer": "Quinta Brunson"},
        "poster_url": "https://picsum.photos/seed/laugh/400/600",
        "backdrop_url": "https://picsum.photos/seed/laugh-bg/1280/720",
        "mood_tags": ["Funny", "Heartwarming", "Hopeful"],
        "content_type": "movie",
        "average_rating": 7.9,
        "total_ratings": 8930,
        "rating_distribution": {"1": 5, "2": 8, "3": 15, "4": 28, "5": 60, "6": 180, "7": 520, "8": 2100, "9": 3400, "10": 2614},
        "is_published": True,
    },
    {
        "title": "The Abyss Watcher",
        "description": "A marine biologist discovers an ancient creature in the deepest ocean trench. What follows is a breathtaking journey that challenges everything we know about life on Earth.",
        "year": 2024,
        "duration": 156,
        "genres": ["Sci-Fi", "Thriller", "Drama"],
        "countries": ["USA", "UK"],
        "categories": ["New Releases", "Award Winners"],
        "cast": ["Florence Pugh", "Cillian Murphy", "Rebecca Ferguson"],
        "crew": {"director": "Christopher Nolan", "writer": "Christopher Nolan"},
        "poster_url": "https://picsum.photos/seed/abyss/400/600",
        "backdrop_url": "https://picsum.photos/seed/abyss-bg/1280/720",
        "mood_tags": ["Suspenseful", "Thought-Provoking", "Dark"],
        "content_type": "movie",
        "average_rating": 9.1,
        "total_ratings": 18200,
        "rating_distribution": {"1": 1, "2": 2, "3": 4, "4": 8, "5": 15, "6": 30, "7": 95, "8": 450, "9": 3200, "10": 14395},
        "is_published": True,
    },
    {
        "title": "Midnight in Accra",
        "description": "A heartwarming romance set against the vibrant nightlife of Accra, Ghana. Two strangers meet at a street food stall and discover that love speaks a universal language.",
        "year": 2025,
        "duration": 118,
        "genres": ["Romance", "Comedy", "Drama"],
        "countries": ["Ghana", "Nigeria"],
        "categories": ["Popular", "New Releases", "Indie"],
        "cast": ["Abraham Attah", "Nana Akua", "John Dumelo"],
        "crew": {"director": "Shirley Frimpong-Manso", "writer": "Nana Kofi Acquah"},
        "poster_url": "https://picsum.photos/seed/accra/400/600",
        "backdrop_url": "https://picsum.photos/seed/accra-bg/1280/720",
        "mood_tags": ["Heartwarming", "Funny", "Hopeful"],
        "content_type": "movie",
        "average_rating": 8.2,
        "total_ratings": 3450,
        "rating_distribution": {"1": 1, "2": 3, "3": 5, "4": 10, "5": 22, "6": 55, "7": 180, "8": 650, "9": 1200, "10": 1324},
        "is_published": True,
    },
    {
        "title": "Echoes of Tomorrow",
        "description": "A time-bending thriller where a physicist receives messages from her future self warning of a catastrophic event. Racing against time, she must decipher the clues before it's too late.",
        "year": 2024,
        "duration": 135,
        "genres": ["Sci-Fi", "Thriller", "Mystery"],
        "countries": ["USA", "UK"],
        "categories": ["Popular", "Award Winners"],
        "cast": ["Saoirse Ronan", "Dev Patel", "Tilda Swinton"],
        "crew": {"director": "Greta Gerwig", "writer": "Charlie Kaufman"},
        "poster_url": "https://picsum.photos/seed/echoes/400/600",
        "backdrop_url": "https://picsum.photos/seed/echoes-bg/1280/720",
        "mood_tags": ["Suspenseful", "Thought-Provoking", "Slow-Burn"],
        "content_type": "movie",
        "average_rating": 8.5,
        "total_ratings": 9870,
        "rating_distribution": {"1": 2, "2": 4, "3": 8, "4": 15, "5": 35, "6": 80, "7": 320, "8": 1450, "9": 3450, "10": 4506},
        "is_published": True,
    },
    {
        "title": "Savage Kingdom",
        "description": "A ground-breaking nature documentary that follows lion prides, elephant herds, and wild dog packs in an epic struggle for survival across the African savanna.",
        "year": 2023,
        "duration": 94,
        "genres": ["Documentary"],
        "countries": ["UK", "USA"],
        "categories": ["Award Winners", "Classics"],
        "cast": ["David Attenborough"],
        "crew": {"director": "James Honeyborne", "producer": "BBC Natural History"},
        "poster_url": "https://picsum.photos/seed/savage/400/600",
        "backdrop_url": "https://picsum.photos/seed/savage-bg/1280/720",
        "mood_tags": ["Thought-Provoking", "Slow-Burn"],
        "content_type": "movie",
        "average_rating": 9.3,
        "total_ratings": 22100,
        "rating_distribution": {"1": 1, "2": 1, "3": 2, "4": 3, "5": 8, "6": 12, "7": 45, "8": 230, "9": 2100, "10": 19698},
        "is_published": True,
    },
    {
        "title": "The Last Laugh",
        "description": "An aging stand-up comedian embarks on a cross-country road trip with his estranged grandson. A poignant exploration of legacy, forgiveness, and finding joy in life's final act.",
        "year": 2025,
        "duration": 106,
        "genres": ["Comedy", "Drama"],
        "countries": ["USA", "UK"],
        "categories": ["Indie", "New Releases"],
        "cast": ["Anthony Hopkins", "Jenna Ortega", "Steve Martin"],
        "crew": {"director": "Alexander Payne", "writer": "Mike White"},
        "poster_url": "https://picsum.photos/seed/lastlaugh/400/600",
        "backdrop_url": "https://picsum.photos/seed/lastlaugh-bg/1280/720",
        "mood_tags": ["Funny", "Heartwarming", "Hopeful"],
        "content_type": "movie",
        "average_rating": 8.0,
        "total_ratings": 5670,
        "rating_distribution": {"1": 3, "2": 5, "3": 10, "4": 20, "5": 45, "6": 100, "7": 350, "8": 980, "9": 2100, "10": 2057},
        "is_published": True,
    },
    {
        "title": "Shadow Protocol",
        "description": "An elite spy is framed for treason and must go off-grid to uncover a vast conspiracy reaching the highest levels of government. Non-stop action from start to finish.",
        "year": 2024,
        "duration": 131,
        "genres": ["Action", "Thriller"],
        "countries": ["USA", "France"],
        "categories": ["Popular"],
        "cast": ["John Boyega", "Ana de Armas", "Idris Elba"],
        "crew": {"director": "Chad Stahelski", "writer": "Derek Kolstad"},
        "poster_url": "https://picsum.photos/seed/shadow/400/600",
        "backdrop_url": "https://picsum.photos/seed/shadow-bg/1280/720",
        "mood_tags": ["Action-Packed", "Suspenseful", "Dark"],
        "content_type": "movie",
        "average_rating": 7.6,
        "total_ratings": 15400,
        "rating_distribution": {"1": 15, "2": 25, "3": 45, "4": 80, "5": 150, "6": 400, "7": 1200, "8": 3800, "9": 5200, "10": 4485},
        "is_published": True,
    },
    {
        "title": "Spirit Realm",
        "description": "A breathtaking animated adventure about a young girl who discovers she can travel between the human world and a mystical spirit realm. A visual masterpiece for all ages.",
        "year": 2025,
        "duration": 102,
        "genres": ["Animation", "Drama", "Fantasy"],
        "countries": ["Japan", "USA"],
        "categories": ["New Releases", "Popular", "Award Winners"],
        "cast": ["Voices: Awkwafina", "Gaten Matarazzo", "Sandra Oh"],
        "crew": {"director": "Hayao Miyazaki", "studio": "Studio Ghibli"},
        "poster_url": "https://picsum.photos/seed/spirit/400/600",
        "backdrop_url": "https://picsum.photos/seed/spirit-bg/1280/720",
        "mood_tags": ["Heartwarming", "Hopeful", "Thought-Provoking"],
        "content_type": "movie",
        "average_rating": 9.0,
        "total_ratings": 16800,
        "rating_distribution": {"1": 1, "2": 2, "3": 3, "4": 5, "5": 10, "6": 25, "7": 80, "8": 340, "9": 2800, "10": 13534},
        "is_published": True,
    },
    {
        "title": "Burning Streets",
        "description": "A raw and unflinching drama set in the streets of Lagos, following three friends whose lives are changed forever during a political uprising.",
        "year": 2024,
        "duration": 127,
        "genres": ["Drama", "Thriller"],
        "countries": ["Nigeria", "Ghana"],
        "categories": ["Indie", "Award Winners"],
        "cast": ["Rita Dominic", "OC Ukeje", "Adesua Etomi"],
        "crew": {"director": "Kunle Afolayan", "writer": "Tunde Babalola"},
        "poster_url": "https://picsum.photos/seed/burning/400/600",
        "backdrop_url": "https://picsum.photos/seed/burning-bg/1280/720",
        "mood_tags": ["Dark", "Thought-Provoking", "Suspenseful"],
        "content_type": "movie",
        "average_rating": 8.3,
        "total_ratings": 4200,
        "rating_distribution": {"1": 2, "2": 3, "3": 6, "4": 12, "5": 25, "6": 50, "7": 140, "8": 520, "9": 1400, "10": 2042},
        "is_published": True,
    },
    {
        "title": "Dark Horizons",
        "description": "When a mysterious signal arrives from deep space, a team of astronauts embarks on humanity's most ambitious mission. But what they find challenges the very nature of reality.",
        "year": 2025,
        "duration": 162,
        "genres": ["Sci-Fi", "Thriller", "Mystery"],
        "countries": ["USA", "UK"],
        "categories": ["New Releases", "Popular"],
        "cast": ["Lupita Nyong'o", "Oscar Isaac", "Cate Blanchett"],
        "crew": {"director": "Alfonso Cuarón", "writer": "Alex Garland"},
        "poster_url": "https://picsum.photos/seed/horizons/400/600",
        "backdrop_url": "https://picsum.photos/seed/horizons-bg/1280/720",
        "mood_tags": ["Suspenseful", "Dark", "Thought-Provoking"],
        "content_type": "movie",
        "average_rating": 8.8,
        "total_ratings": 11200,
        "rating_distribution": {"1": 1, "2": 3, "3": 5, "4": 10, "5": 20, "6": 55, "7": 180, "8": 780, "9": 3200, "10": 6946},
        "is_published": True,
    },
    {
        "title": "Kente Stories",
        "description": "A vibrant anthology series weaving together folktales from across Ghana, brought to life through stunning animation and traditional music. Each episode explores a different moral lesson.",
        "year": 2025,
        "duration": 45,
        "genres": ["Animation", "Drama"],
        "countries": ["Ghana"],
        "categories": ["New Releases", "Indie"],
        "cast": [],
        "crew": {"director": "Beryl Koomson", "studio": "African Animation Studios"},
        "poster_url": "https://picsum.photos/seed/kente/400/600",
        "backdrop_url": "https://picsum.photos/seed/kente-bg/1280/720",
        "mood_tags": ["Heartwarming", "Hopeful", "Thought-Provoking"],
        "content_type": "tv",
        "average_rating": 8.9,
        "total_ratings": 2800,
        "rating_distribution": {"1": 0, "2": 1, "3": 2, "4": 4, "5": 8, "6": 20, "7": 60, "8": 280, "9": 900, "10": 1525},
        "is_published": True,
    },
]

SAMPLE_EPISODES = []


async def seed():
    print("Connecting to MongoDB...")
    await mongodb.connect()

    db = mongodb.db
    collections = ["titles", "episodes", "genres", "categories", "countries", "mood_tags"]

    for coll_name in collections:
        count = await db[coll_name].count_documents({})
        print(f"  {coll_name}: {count} existing documents")
        if count > 0:
            ans = input(f"  {coll_name} already has data. Clear and re-seed? (y/N): ")
            if ans.lower() == "y":
                await db[coll_name].delete_many({})
                print(f"    Cleared {coll_name}")

    print("\nSeeding genres...")
    for g in SAMPLE_GENRES:
        existing = await db.genres.find_one({"slug": g["slug"]})
        if not existing:
            await db.genres.insert_one(g)
            print(f"  Added genre: {g['name']}")

    print("\nSeeding categories...")
    for c in SAMPLE_CATEGORIES:
        existing = await db.categories.find_one({"slug": c["slug"]})
        if not existing:
            await db.categories.insert_one(c)
            print(f"  Added category: {c['name']}")

    print("\nSeeding countries...")
    for c in SAMPLE_COUNTRIES:
        existing = await db.countries.find_one({"slug": c["slug"]})
        if not existing:
            await db.countries.insert_one(c)
            print(f"  Added country: {c['name']}")

    print("\nSeeding mood tags...")
    for m in SAMPLE_MOODS:
        existing = await db.mood_tags.find_one({"slug": m["slug"]})
        if not existing:
            await db.mood_tags.insert_one(m)
            print(f"  Added mood: {m['name']}")

    print("\nSeeding titles...")
    for t in SAMPLE_TITLES:
        existing = await db.titles.find_one({"title": t["title"]})
        if not existing:
            t["created_at"] = datetime.now(timezone.utc)
            t["updated_at"] = datetime.now(timezone.utc)
            await db.titles.insert_one(t)
            print(f"  Added title: {t['title']}")
        else:
            print(f"  Skipped (exists): {t['title']}")

    print("\nSeeding episodes...")
    if SAMPLE_EPISODES:
        title_doc = await db.titles.find_one({"title": "Kente Stories"})
        if title_doc:
            title_id = str(title_doc["_id"])
            for ep in SAMPLE_EPISODES:
                existing = await db.episodes.find_one({"title_id": title_id, "season_number": ep["season_number"], "episode_number": ep["episode_number"]})
                if not existing:
                    ep["title_id"] = title_id
                    ep["created_at"] = datetime.now(timezone.utc)
                    await db.episodes.insert_one(ep)
                    print(f"  Added episode: S{ep['season_number']}E{ep['episode_number']} - {ep['title']}")

    print("\nCreating text index on titles...")
    try:
        await db.titles.create_index([("title", "text"), ("description", "text")])
        print("  Text index created")
    except Exception as e:
        print(f"  Index note: {e}")

    await mongodb.close()
    print("\nSeeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
