from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from datetime import datetime


class EpisodeSchema(BaseModel):
    id: str
    title: str
    overview: Optional[str] = None
    episode_number: int = 0
    season_number: int = 0
    still_path: Optional[str] = None
    air_date: Optional[str] = None
    runtime: Optional[int] = None
    vote_average: float = 0

    @model_validator(mode='before')
    @classmethod
    def transform(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data['overview'] = data.get('overview') or data.get('description')
            data['still_path'] = data.get('still_path') or data.get('still_url')
            data['runtime'] = data.get('runtime') or data.get('duration')
        return data


class GenreItem(BaseModel):
    id: str = ""
    tmdb_id: int = 0
    name: str


class TitleSchema(BaseModel):
    id: str
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    logo_path: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    status: Optional[str] = None
    tagline: Optional[str] = None
    vote_average: float = 0.0
    vote_count: int = 0
    popularity: float = 0.0
    media_type: str = "movie"
    genres: list[GenreItem] = []
    countries: list[str] = []
    categories: list[str] = []
    mood_tags: list[str] = []
    cast_list: list[str] = []
    crew: dict = {}
    trailer_url: Optional[str] = None
    hls_url: dict = {}
    abandon_point: dict = {}
    rating_distribution: dict = {}
    is_published: bool = False
    in_watchlist: bool = False
    watch_progress: Optional[float] = None
    user_rating: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @model_validator(mode='before')
    @classmethod
    def transform(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data['overview'] = data.get('overview') or data.get('description')
            data['poster_path'] = data.get('poster_path') or data.get('poster_url')
            data['backdrop_path'] = data.get('backdrop_path') or data.get('backdrop_url')
            data['runtime'] = data.get('runtime') or data.get('duration')
            data['vote_average'] = data.get('vote_average') or data.get('average_rating', 0.0)
            data['vote_count'] = data.get('vote_count') or data.get('total_ratings', 0)
            data['media_type'] = data.get('media_type') or data.get('content_type', 'movie')
            data['cast_list'] = data.get('cast_list') or data.get('cast', [])
            year = data.get('year')
            if year and not data.get('release_date'):
                data['release_date'] = f"{year}-01-01"
            genres_raw = data.get('genres', [])
            if genres_raw and isinstance(genres_raw[0], str):
                data['genres'] = [GenreItem(name=g) for g in genres_raw]
            elif genres_raw and isinstance(genres_raw[0], dict):
                pass
            else:
                data['genres'] = []
        return data


class TitleDetailSchema(TitleSchema):
    episodes: list[EpisodeSchema] = []
    seasons: list = []

    @model_validator(mode='before')
    @classmethod
    def transform_detail(cls, data: Any) -> Any:
        data = TitleSchema.transform(data)
        if isinstance(data, dict):
            episodes_raw = data.get('episodes', []) or []
            episodes_out = []
            for ep in episodes_raw:
                if isinstance(ep, dict):
                    episodes_out.append(EpisodeSchema.transform(ep) or ep)
            data['episodes'] = episodes_out
        return data


class TitleListSchema(BaseModel):
    items: list[TitleSchema]
    total: int
    page: int
    page_size: int


class GenreSchema(BaseModel):
    id: str
    tmdb_id: int = 0
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None


class CategorySchema(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None


class CountrySchema(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None


class MoodTagSchema(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    emoji: Optional[str] = None
    description: Optional[str] = None


class SearchParams(BaseModel):
    q: str = ""
    genre: Optional[str] = None
    mood: Optional[str] = None
    content_type: Optional[str] = None
    year: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class SearchResponse(BaseModel):
    items: list[TitleSchema]
    total: int
    page: int
    page_size: int
    query: str


class FeaturedRow(BaseModel):
    name: str
    titles: list[TitleSchema]


class TitleCreate(BaseModel):
    title: str
    description: str
    year: int
    duration: int
    genres: list[str] = []
    countries: list[str] = []
    categories: list[str] = []
    cast: list[str] = []
    crew: dict = {}
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    hls_url: dict = {}
    mood_tags: list[str] = []
    content_type: str = "movie"
    is_published: bool = False


class TitleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    year: Optional[int] = None
    duration: Optional[int] = None
    genres: Optional[list[str]] = None
    countries: Optional[list[str]] = None
    categories: Optional[list[str]] = None
    cast: Optional[list[str]] = None
    crew: Optional[dict] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    hls_url: Optional[dict] = None
    mood_tags: Optional[list[str]] = None
    is_published: Optional[bool] = None
