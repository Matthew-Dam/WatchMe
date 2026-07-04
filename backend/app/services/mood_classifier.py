GENRE_MOOD_MAP: dict[str, list[str]] = {
    "Action": ["Action-Packed", "Edge of Seat"],
    "Adventure": ["Action-Packed", "Feel Good"],
    "Animation": ["Feel Good", "Funny", "Heartwarming"],
    "Comedy": ["Funny", "Feel Good"],
    "Crime": ["Dark", "Suspenseful"],
    "Documentary": ["Thought-Provoking"],
    "Drama": ["Thought-Provoking", "Heartwarming"],
    "Family": ["Feel Good", "Heartwarming"],
    "Fantasy": ["Mind-Bending", "Action-Packed"],
    "History": ["Thought-Provoking"],
    "Horror": ["Dark", "Suspenseful", "Late Night"],
    "Music": ["Feel Good", "Chill & Relax"],
    "Musical": ["Feel Good", "Heartwarming"],
    "Mystery": ["Suspenseful", "Thought-Provoking"],
    "Romance": ["Heartwarming", "Feel Good", "Chill & Relax"],
    "Science Fiction": ["Mind-Bending", "Thought-Provoking"],
    "Thriller": ["Suspenseful", "Edge of Seat", "Dark"],
    "War": ["Dark", "Thought-Provoking"],
    "Western": ["Action-Packed", "Slow-Burn"],
}

RUNTIME_MOOD_MAP: list[tuple[int, str]] = [
    (150, "Slow-Burn"),
    (60, "Binge Worthy"),
]

VOTE_MOOD_MAP: list[tuple[float, str]] = [
    (8.0, "Binge Worthy"),
]

POPULARITY_MOOD_MAP: list[tuple[float, str]] = [
    (50.0, "Binge Worthy"),
    (20.0, "Action-Packed"),
]


def classify_moods(
    genres: list[str] | None = None,
    runtime: int | None = None,
    vote_average: float | None = None,
    popularity: float | None = None,
) -> list[str]:
    moods: set[str] = set()

    if genres:
        for genre in genres:
            matched = GENRE_MOOD_MAP.get(genre, [])
            moods.update(matched)

    if runtime and runtime > 0:
        for threshold, mood in RUNTIME_MOOD_MAP:
            if runtime >= threshold:
                moods.add(mood)

    if vote_average and vote_average > 0:
        for threshold, mood in VOTE_MOOD_MAP:
            if vote_average >= threshold:
                moods.add(mood)

    if popularity and popularity > 0:
        for threshold, mood in POPULARITY_MOOD_MAP:
            if popularity >= threshold:
                moods.add(mood)

    if not moods:
        moods.add("Chill & Relax")

    return list(moods)[:4]
