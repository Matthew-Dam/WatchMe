#!/usr/bin/env python3
"""Seed Supabase with WatchMe sample content."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database.supabase import supabase

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
    {"name": "Suspenseful", "slug": "suspenseful", "description": "Edge-of-your-seat tension", "emoji": "😰"},
    {"name": "Heartwarming", "slug": "heartwarming", "description": "Warm and uplifting feelings", "emoji": "❤️"},
    {"name": "Dark", "slug": "dark", "description": "Somber and serious tone", "emoji": "🌑"},
    {"name": "Funny", "slug": "funny", "description": "Light-hearted and humorous", "emoji": "😂"},
    {"name": "Thought-Provoking", "slug": "thought-provoking", "description": "Makes you think deeply", "emoji": "🤔"},
    {"name": "Action-Packed", "slug": "action-packed", "description": "Non-stop excitement", "emoji": "💥"},
    {"name": "Slow-Burn", "slug": "slow-burn", "description": "Gradual, patient storytelling", "emoji": "🔥"},
    {"name": "Hopeful", "slug": "hopeful", "description": "Optimistic and inspiring", "emoji": "🌟"},
]

SAMPLE_TITLES = [
    {
        "title": "Neon Samurai",
        "description": "In a cyberpunk Tokyo, a disgraced samurai must protect a young girl who holds the key to stopping a corporate war. A visually stunning blend of feudal Japan and futuristic technology.",
        "year": 2024, "duration": 148,
        "genres": ["Action", "Sci-Fi", "Drama"],
        "countries": ["Japan", "USA"],
        "categories": ["Popular", "New Releases"],
        "cast_list": ["Ken Watanabe", "Zendaya", "Oscar Isaac"],
        "crew": {"director": "Denis Villeneuve", "writer": "Eric Roth"},
        "poster_url": "https://picsum.photos/seed/neon/400/600",
        "backdrop_url": "https://picsum.photos/seed/neon-bg/1280/720",
        "mood_tags": ["Action-Packed", "Dark", "Thought-Provoking"],
        "content_type": "movie", "is_published": True,
        "average_rating": 8.7, "total_ratings": 12450,
        "rating_distribution": {"1": 2, "2": 1, "3": 5, "4": 12, "5": 18, "6": 45, "7": 230, "8": 890, "9": 2450, "10": 8797},
    },
    {
        "title": "Laugh Factory",
        "description": "A struggling comedian gets one shot at the big time when a viral video changes his life overnight. But fame comes at a cost in this hilarious and heartfelt comedy.",
        "year": 2025, "duration": 112,
        "genres": ["Comedy", "Drama"],
        "countries": ["USA"],
        "categories": ["Popular"],
        "cast_list": ["John Mulaney", "Quinta Brunson", "Keegan-Michael Key"],
        "crew": {"director": "Taika Waititi", "writer": "Quinta Brunson"},
        "poster_url": "https://picsum.photos/seed/laugh/400/600",
        "backdrop_url": "https://picsum.photos/seed/laugh-bg/1280/720",
        "mood_tags": ["Funny", "Heartwarming", "Hopeful"],
        "content_type": "movie", "is_published": True,
        "average_rating": 7.9, "total_ratings": 8930,
        "rating_distribution": {"1": 5, "2": 8, "3": 15, "4": 28, "5": 60, "6": 180, "7": 520, "8": 2100, "9": 3400, "10": 2614},
    },
    {
        "title": "The Abyss Watcher",
        "description": "A marine biologist discovers an ancient creature in the deepest ocean trench. What follows is a breathtaking journey that challenges everything we know about life on Earth.",
        "year": 2024, "duration": 156,
        "genres": ["Sci-Fi", "Thriller", "Drama"],
        "countries": ["USA", "UK"],
        "categories": ["New Releases", "Award Winners"],
        "cast_list": ["Florence Pugh", "Cillian Murphy", "Rebecca Ferguson"],
        "crew": {"director": "Christopher Nolan", "writer": "Christopher Nolan"},
        "poster_url": "https://picsum.photos/seed/abyss/400/600",
        "backdrop_url": "https://picsum.photos/seed/abyss-bg/1280/720",
        "mood_tags": ["Suspenseful", "Thought-Provoking", "Dark"],
        "content_type": "movie", "is_published": True,
        "average_rating": 9.1, "total_ratings": 18200,
        "rating_distribution": {"1": 1, "2": 2, "3": 4, "4": 8, "5": 15, "6": 30, "7": 95, "8": 450, "9": 3200, "10": 14395},
    },
    {
        "title": "Midnight in Accra",
        "description": "A heartwarming romance set against the vibrant nightlife of Accra, Ghana. Two strangers meet at a street food stall and discover that love speaks a universal language.",
        "year": 2025, "duration": 118,
        "genres": ["Romance", "Comedy", "Drama"],
        "countries": ["Ghana", "Nigeria"],
        "categories": ["Popular", "New Releases", "Indie"],
        "cast_list": ["Abraham Attah", "Nana Akua", "John Dumelo"],
        "crew": {"director": "Shirley Frimpong-Manso", "writer": "Nana Kofi Acquah"},
        "poster_url": "https://picsum.photos/seed/accra/400/600",
        "backdrop_url": "https://picsum.photos/seed/accra-bg/1280/720",
        "mood_tags": ["Heartwarming", "Funny", "Hopeful"],
        "content_type": "movie", "is_published": True,
        "average_rating": 8.2, "total_ratings": 3450,
        "rating_distribution": {"1": 1, "2": 3, "3": 5, "4": 10, "5": 22, "6": 55, "7": 180, "8": 650, "9": 1200, "10": 1324},
    },
    {
        "title": "Echoes of Tomorrow",
        "description": "A time-bending thriller where a physicist receives messages from her future self warning of a catastrophic event. Racing against time, she must decipher the clues before it's too late.",
        "year": 2024, "duration": 135,
        "genres": ["Sci-Fi", "Thriller", "Mystery"],
        "countries": ["USA", "UK"],
        "categories": ["Popular", "Award Winners"],
        "cast_list": ["Saoirse Ronan", "Dev Patel", "Tilda Swinton"],
        "crew": {"director": "Greta Gerwig", "writer": "Charlie Kaufman"},
        "poster_url": "https://picsum.photos/seed/echoes/400/600",
        "backdrop_url": "https://picsum.photos/seed/echoes-bg/1280/720",
        "mood_tags": ["Suspenseful", "Thought-Provoking", "Slow-Burn"],
        "content_type": "movie", "is_published": True,
        "average_rating": 8.5, "total_ratings": 9870,
        "rating_distribution": {"1": 2, "2": 4, "3": 8, "4": 15, "5": 35, "6": 80, "7": 320, "8": 1450, "9": 3450, "10": 4506},
    },
    {
        "title": "Savage Kingdom",
        "description": "A ground-breaking nature documentary that follows lion prides, elephant herds, and wild dog packs in an epic struggle for survival across the African savanna.",
        "year": 2023, "duration": 94,
        "genres": ["Documentary"],
        "countries": ["UK", "USA"],
        "categories": ["Award Winners", "Classics"],
        "cast_list": ["David Attenborough"],
        "crew": {"director": "James Honeyborne", "producer": "BBC Natural History"},
        "poster_url": "https://picsum.photos/seed/savage/400/600",
        "backdrop_url": "https://picsum.photos/seed/savage-bg/1280/720",
        "mood_tags": ["Thought-Provoking", "Slow-Burn"],
        "content_type": "movie", "is_published": True,
        "average_rating": 9.3, "total_ratings": 22100,
        "rating_distribution": {"1": 1, "2": 1, "3": 2, "4": 3, "5": 8, "6": 12, "7": 45, "8": 230, "9": 2100, "10": 19698},
    },
    {
        "title": "The Last Laugh",
        "description": "An aging stand-up comedian embarks on a cross-country road trip with his estranged grandson. A poignant exploration of legacy, forgiveness, and finding joy in life's final act.",
        "year": 2025, "duration": 106,
        "genres": ["Comedy", "Drama"],
        "countries": ["USA", "UK"],
        "categories": ["Indie", "New Releases"],
        "cast_list": ["Anthony Hopkins", "Jenna Ortega", "Steve Martin"],
        "crew": {"director": "Alexander Payne", "writer": "Mike White"},
        "poster_url": "https://picsum.photos/seed/lastlaugh/400/600",
        "backdrop_url": "https://picsum.photos/seed/lastlaugh-bg/1280/720",
        "mood_tags": ["Funny", "Heartwarming", "Hopeful"],
        "content_type": "movie", "is_published": True,
        "average_rating": 8.0, "total_ratings": 5670,
        "rating_distribution": {"1": 3, "2": 5, "3": 10, "4": 20, "5": 45, "6": 100, "7": 350, "8": 980, "9": 2100, "10": 2057},
    },
    {
        "title": "Shadow Protocol",
        "description": "An elite spy is framed for treason and must go off-grid to uncover a vast conspiracy reaching the highest levels of government. Non-stop action from start to finish.",
        "year": 2024, "duration": 131,
        "genres": ["Action", "Thriller"],
        "countries": ["USA", "France"],
        "categories": ["Popular"],
        "cast_list": ["John Boyega", "Ana de Armas", "Idris Elba"],
        "crew": {"director": "Chad Stahelski", "writer": "Derek Kolstad"},
        "poster_url": "https://picsum.photos/seed/shadow/400/600",
        "backdrop_url": "https://picsum.photos/seed/shadow-bg/1280/720",
        "mood_tags": ["Action-Packed", "Suspenseful", "Dark"],
        "content_type": "movie", "is_published": True,
        "average_rating": 7.6, "total_ratings": 15400,
        "rating_distribution": {"1": 15, "2": 25, "3": 45, "4": 80, "5": 150, "6": 400, "7": 1200, "8": 3800, "9": 5200, "10": 4485},
    },
    {
        "title": "Spirit Realm",
        "description": "A breathtaking animated adventure about a young girl who discovers she can travel between the human world and a mystical spirit realm. A visual masterpiece for all ages.",
        "year": 2025, "duration": 102,
        "genres": ["Animation", "Drama", "Fantasy"],
        "countries": ["Japan", "USA"],
        "categories": ["New Releases", "Popular", "Award Winners"],
        "cast_list": ["Voices: Awkwafina", "Gaten Matarazzo", "Sandra Oh"],
        "crew": {"director": "Hayao Miyazaki", "studio": "Studio Ghibli"},
        "poster_url": "https://picsum.photos/seed/spirit/400/600",
        "backdrop_url": "https://picsum.photos/seed/spirit-bg/1280/720",
        "mood_tags": ["Heartwarming", "Hopeful", "Thought-Provoking"],
        "content_type": "movie", "is_published": True,
        "average_rating": 9.0, "total_ratings": 16800,
        "rating_distribution": {"1": 1, "2": 2, "3": 3, "4": 5, "5": 10, "6": 25, "7": 80, "8": 340, "9": 2800, "10": 13534},
    },
    {
        "title": "Burning Streets",
        "description": "A raw and unflinching drama set in the streets of Lagos, following three friends whose lives are changed forever during a political uprising.",
        "year": 2024, "duration": 127,
        "genres": ["Drama", "Thriller"],
        "countries": ["Nigeria", "Ghana"],
        "categories": ["Indie", "Award Winners"],
        "cast_list": ["Rita Dominic", "OC Ukeje", "Adesua Etomi"],
        "crew": {"director": "Kunle Afolayan", "writer": "Tunde Babalola"},
        "poster_url": "https://picsum.photos/seed/burning/400/600",
        "backdrop_url": "https://picsum.photos/seed/burning-bg/1280/720",
        "mood_tags": ["Dark", "Thought-Provoking", "Suspenseful"],
        "content_type": "movie", "is_published": True,
        "average_rating": 8.3, "total_ratings": 4200,
        "rating_distribution": {"1": 2, "2": 3, "3": 6, "4": 12, "5": 25, "6": 50, "7": 140, "8": 520, "9": 1400, "10": 2042},
    },
    {
        "title": "Dark Horizons",
        "description": "When a mysterious signal arrives from deep space, a team of astronauts embarks on humanity's most ambitious mission. But what they find challenges the very nature of reality.",
        "year": 2025, "duration": 162,
        "genres": ["Sci-Fi", "Thriller", "Mystery"],
        "countries": ["USA", "UK"],
        "categories": ["New Releases", "Popular"],
        "cast_list": ["Lupita Nyong'o", "Oscar Isaac", "Cate Blanchett"],
        "crew": {"director": "Alfonso Cuarón", "writer": "Alex Garland"},
        "poster_url": "https://picsum.photos/seed/horizons/400/600",
        "backdrop_url": "https://picsum.photos/seed/horizons-bg/1280/720",
        "mood_tags": ["Suspenseful", "Dark", "Thought-Provoking"],
        "content_type": "movie", "is_published": True,
        "average_rating": 8.8, "total_ratings": 11200,
        "rating_distribution": {"1": 1, "2": 3, "3": 5, "4": 10, "5": 20, "6": 55, "7": 180, "8": 780, "9": 3200, "10": 6946},
    },
    {
        "title": "Kente Stories",
        "description": "A vibrant anthology series weaving together folktales from across Ghana, brought to life through stunning animation and traditional music. Each episode explores a different moral lesson.",
        "year": 2025, "duration": 45,
        "genres": ["Animation", "Drama"],
        "countries": ["Ghana"],
        "categories": ["New Releases", "Indie"],
        "cast_list": [],
        "crew": {"director": "Beryl Koomson", "studio": "African Animation Studios"},
        "poster_url": "https://picsum.photos/seed/kente/400/600",
        "backdrop_url": "https://picsum.photos/seed/kente-bg/1280/720",
        "mood_tags": ["Heartwarming", "Hopeful", "Thought-Provoking"],
        "content_type": "tv", "is_published": True,
        "average_rating": 8.9, "total_ratings": 2800,
        "rating_distribution": {"1": 0, "2": 1, "3": 2, "4": 4, "5": 8, "6": 20, "7": 60, "8": 280, "9": 900, "10": 1525},
    },
]

SAMPLE_EPISODES = [
    {"season_number": 1, "episode_number": 1, "title": "The Spider's Web", "description": "Anansi the Spider weaves a web that traps the moon, bringing eternal night to the village. The children must embark on a quest to free the moon and restore balance.", "duration": 45, "still_url": "https://picsum.photos/seed/kente-e1/400/225", "air_date": "2025-01-15"},
    {"season_number": 1, "episode_number": 2, "title": "The Golden Drum", "description": "A young girl discovers a magical drum that can summon rain. But when a greedy chief steals it, she must find the courage to take it back.", "duration": 42, "still_url": "https://picsum.photos/seed/kente-e2/400/225", "air_date": "2025-01-22"},
    {"season_number": 1, "episode_number": 3, "title": "The River Spirit", "description": "When the village river runs dry, a boy ventures into the spirit world to bargain with the Mami Wata, the river spirit who guards the waters.", "duration": 48, "still_url": "https://picsum.photos/seed/kente-e3/400/225", "air_date": "2025-01-29"},
    {"season_number": 1, "episode_number": 4, "title": "The Talking Tree", "description": "An ancient baobab tree begins speaking prophecies. The village must decipher its riddles to prevent a looming disaster.", "duration": 44, "still_url": "https://picsum.photos/seed/kente-e4/400/225", "air_date": "2025-02-05"},
    {"season_number": 1, "episode_number": 5, "title": "The Firefly Queen", "description": "A shy girl discovers she is the reincarnation of the Firefly Queen, destined to lead the night creatures in a battle against the darkness.", "duration": 46, "still_url": "https://picsum.photos/seed/kente-e5/400/225", "air_date": "2025-02-12"},
    {"season_number": 2, "episode_number": 1, "title": "The Mask of Ancestors", "description": "A ceremonial mask goes missing from the village shrine. The children must travel through the spirit world to recover it before the ancestors grow angry.", "duration": 47, "still_url": "https://picsum.photos/seed/kente-e6/400/225", "air_date": "2025-06-01"},
]


async def seed():
    print("Connecting to Supabase...")
    await supabase.connect()

    tables = [
        ("genres", SAMPLE_GENRES, "slug"),
        ("categories", SAMPLE_CATEGORIES, "slug"),
        ("countries", SAMPLE_COUNTRIES, "slug"),
        ("mood_tags", SAMPLE_MOODS, "slug"),
    ]

    for table_name, items, id_field in tables:
        print(f"\nSeeding {table_name}...")
        existing = await supabase.select(table_name, columns="id," + id_field, use_service_role=True)
        existing_slugs = {r[id_field] for r in existing[0]} if existing[0] else set()

        for item in items:
            if item[id_field] in existing_slugs:
                print(f"  Skipped (exists): {item['name']}")
            else:
                await supabase.insert(table_name, item, use_service_role=True)
                print(f"  Added: {item['name']}")

    print("\nSeeding titles...")
    existing_titles, _ = await supabase.select("titles", columns="id,title", use_service_role=True)
    existing_title_names = {r["title"] for r in (existing_titles or [])}

    for t in SAMPLE_TITLES:
        if t["title"] in existing_title_names:
            print(f"  Skipped (exists): {t['title']}")
        else:
            result = await supabase.insert("titles", t, use_service_role=True)
            print(f"  Added title: {t['title']} (id: {result['id']})")

    print("\nSeeding episodes...")
    kente = await supabase.select("titles", columns="id", filters={"title": "eq.Kente Stories"}, use_service_role=True)
    if kente[0]:
        title_id = kente[0][0]["id"]
        existing_eps, _ = await supabase.select("episodes", columns="id,episode_number,season_number", use_service_role=True)
        existing_ep_keys = {(e["season_number"], e["episode_number"]) for e in (existing_eps or [])}

        for ep in SAMPLE_EPISODES:
            key = (ep["season_number"], ep["episode_number"])
            if key in existing_ep_keys:
                print(f"  Skipped (exists): S{ep['season_number']}E{ep['episode_number']} - {ep['title']}")
            else:
                ep["title_id"] = title_id
                await supabase.insert("episodes", ep, use_service_role=True)
                print(f"  Added: S{ep['season_number']}E{ep['episode_number']} - {ep['title']}")
    else:
        print("  Kente Stories not found, skipping episodes")

    await supabase.close()
    print("\nSeeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
