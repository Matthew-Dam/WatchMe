-- WatchMe Supabase Schema Migration
-- Run this in Supabase SQL Editor

-- ===== PROFILES =====
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  is_kid_mode boolean default false,
  pin_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_profiles_user_id on profiles(user_id);

-- ===== CATALOG TAXONOMY =====
create table if not exists genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists mood_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  emoji text,
  description text,
  created_at timestamptz default now()
);

-- ===== TITLES (Movies & TV Shows) =====
create table if not exists titles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  year integer,
  duration integer,
  content_type text not null default 'movie' check (content_type in ('movie', 'tv')),
  genres text[] default '{}',
  countries text[] default '{}',
  categories text[] default '{}',
  mood_tags text[] default '{}',
  cast_list text[] default '{}',
  crew jsonb default '{}',
  poster_url text,
  backdrop_url text,
  trailer_url text,
  hls_url jsonb default '{}',
  abandon_point jsonb default '{"percentage": 0, "timestamp": 0}',
  rating_distribution jsonb default '{}',
  average_rating float default 0,
  total_ratings int default 0,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_titles_published on titles(is_published);
create index idx_titles_content_type on titles(content_type);
create index idx_titles_genres on titles using gin(genres);
create index idx_titles_countries on titles using gin(countries);
create index idx_titles_mood_tags on titles using gin(mood_tags);
create index idx_titles_categories on titles using gin(categories);
create index idx_titles_average_rating on titles(average_rating desc);
create index idx_titles_created_at on titles(created_at desc);

-- ===== EPISODES =====
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  season_number int not null,
  episode_number int not null,
  title text not null,
  description text,
  duration int,
  hls_url jsonb default '{}',
  still_url text,
  air_date date,
  created_at timestamptz default now()
);
create index idx_episodes_title on episodes(title_id);

-- ===== COMMENTS (Timestamped + Spoiler Shield) =====
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  profile_name text not null,
  text text not null,
  timestamp_seconds float default 0,
  parent_id uuid references comments(id) on delete cascade,
  spoiler_tag boolean default false,
  likes int default 0,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  edited_at timestamptz
);
create index idx_comments_title on comments(title_id);
create index idx_comments_timestamp on comments(timestamp_seconds);

-- ===== RATINGS =====
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 10),
  review text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(title_id, profile_id)
);
create index idx_ratings_title on ratings(title_id);
create index idx_ratings_profile on ratings(profile_id);

-- ===== REASONING TAGS (Split Rating System) =====
create table if not exists reasoning_tags (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  tag text not null,
  vote_count int default 0,
  created_at timestamptz default now()
);
create index idx_reasoning_title on reasoning_tags(title_id);

create table if not exists reasoning_votes (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references reasoning_tags(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz default now(),
  unique(tag_id, profile_id)
);

-- ===== WATCH HISTORY =====
create table if not exists watch_history (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  progress float default 0,
  duration int default 0,
  completed boolean default false,
  watched_at timestamptz default now()
);
create index idx_watch_history_profile on watch_history(profile_id);
create index idx_watch_history_title on watch_history(title_id);

-- ===== WATCHLIST =====
create table if not exists watchlist_items (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  added_at timestamptz default now(),
  unique(title_id, profile_id)
);
create index idx_watchlist_profile on watchlist_items(profile_id);

-- ===== CHAT MESSAGES =====
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  profile_name text not null,
  text text not null,
  is_system boolean default false,
  timestamp_seconds float default 0,
  created_at timestamptz default now()
);
create index idx_chat_title on chat_messages(title_id);

-- ===== WATCH PARTIES =====
create table if not exists watch_parties (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id) on delete cascade,
  host_profile_id uuid not null references profiles(id) on delete cascade,
  status text default 'waiting' check (status in ('waiting', 'playing', 'paused', 'ended')),
  playback_position float default 0,
  is_public boolean default true,
  max_participants int default 10,
  created_at timestamptz default now()
);

create table if not exists watch_party_participants (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references watch_parties(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(party_id, profile_id)
);

-- ===== Enable Row Level Security =====
alter table profiles enable row level security;
alter table titles enable row level security;
alter table episodes enable row level security;
alter table genres enable row level security;
alter table categories enable row level security;
alter table countries enable row level security;
alter table mood_tags enable row level security;
alter table comments enable row level security;
alter table ratings enable row level security;
alter table reasoning_tags enable row level security;
alter table reasoning_votes enable row level security;
alter table watch_history enable row level security;
alter table watchlist_items enable row level security;
alter table chat_messages enable row level security;
alter table watch_parties enable row level security;
alter table watch_party_participants enable row level security;

-- ===== RLS Policies =====
-- Profiles: users can CRUD their own profiles
create policy "profiles_self" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Titles: public read for published, admin write
create policy "titles_read" on titles
  for select using (is_published = true);
create policy "titles_admin" on titles
  for all using (auth.jwt()->>'email' like '%@watchme.com') with check (auth.jwt()->>'email' like '%@watchme.com');

-- Taxonomies: public read
create policy "genres_read" on genres for select using (true);
create policy "categories_read" on categories for select using (true);
create policy "countries_read" on countries for select using (true);
create policy "mood_tags_read" on mood_tags for select using (true);

-- Comments: authenticated users can CRUD
create policy "comments_select" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.role() = 'authenticated');
create policy "comments_update" on comments for update using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "comments_delete" on comments for delete using (auth.uid() = (select user_id from profiles where id = profile_id));

-- Ratings: authenticated users can CRUD their own
create policy "ratings_select" on ratings for select using (true);
create policy "ratings_insert" on ratings for insert with check (auth.role() = 'authenticated');
create policy "ratings_update" on ratings for update using (auth.uid() = (select user_id from profiles where id = profile_id));

-- Watchlist: profile-based access
create policy "watchlist_self" on watchlist_items
  for all using (auth.uid() = (select user_id from profiles where id = profile_id))
  with check (auth.uid() = (select user_id from profiles where id = profile_id));

-- Watch history: profile-based access
create policy "watch_history_self" on watch_history
  for all using (auth.uid() = (select user_id from profiles where id = profile_id))
  with check (auth.uid() = (select user_id from profiles where id = profile_id));

-- Chat: authenticated users can read/insert
create policy "chat_select" on chat_messages for select using (true);
create policy "chat_insert" on chat_messages for insert with check (auth.role() = 'authenticated');

-- Watch parties: authenticated users can CRUD
create policy "parties_select" on watch_parties for select using (true);
create policy "parties_insert" on watch_parties for insert with check (auth.role() = 'authenticated');
create policy "parties_update" on watch_parties for update using (auth.role() = 'authenticated');
create policy "parties_delete" on watch_parties for delete using (auth.role() = 'authenticated');

-- ===== Functions & Triggers =====
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles for each row execute function update_updated_at();

create trigger update_titles_updated_at
  before update on titles for each row execute function update_updated_at();

create trigger update_ratings_updated_at
  before update on ratings for each row execute function update_updated_at();

-- Function to update title rating when rating changes
create or replace function update_title_rating()
returns trigger as $$
begin
  update titles set
    average_rating = (select coalesce(avg(rating), 0) from ratings where title_id = new.title_id),
    total_ratings = (select count(*) from ratings where title_id = new.title_id),
    rating_distribution = (
      select jsonb_object_agg(rating::text, cnt)
      from (
        select rating, count(*) as cnt
        from ratings
        where title_id = new.title_id
        group by rating
        order by rating
      ) sub
    )
  where id = new.title_id;
  return new;
end;
$$ language plpgsql;

create trigger after_rating_insert
  after insert or update on ratings for each row execute function update_title_rating();
