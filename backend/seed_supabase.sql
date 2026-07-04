-- WatchMe Seed Data
-- Run this AFTER the schema migration in the SQL Editor

-- ===== GENRES =====
insert into genres (name, slug, description) values
  ('Action', 'action', 'Fast-paced, high-energy sequences'),
  ('Comedy', 'comedy', 'Humorous content designed to entertain'),
  ('Drama', 'drama', 'Character-driven emotional storytelling'),
  ('Sci-Fi', 'sci-fi', 'Futuristic, scientific, and speculative themes'),
  ('Horror', 'horror', 'Designed to frighten and unsettle'),
  ('Romance', 'romance', 'Focus on romantic relationships'),
  ('Thriller', 'thriller', 'Suspenseful and tense narratives'),
  ('Animation', 'animation', 'Illustrated or computer-generated imagery'),
  ('Documentary', 'documentary', 'Non-fictional informative content'),
  ('Fantasy', 'fantasy', 'Magical and supernatural elements')
on conflict (name) do nothing;

-- ===== CATEGORIES =====
insert into categories (name, slug, description) values
  ('Trending Now', 'trending-now', 'Currently popular titles'),
  ('New Releases', 'new-releases', 'Recently added content'),
  ('Top Rated', 'top-rated', 'Highest-rated titles'),
  ('Most Watched', 'most-watched', 'Frequently viewed content'),
  ('Editor''s Pick', 'editors-pick', 'Curated selections by our editors')
on conflict (name) do nothing;

-- ===== COUNTRIES =====
insert into countries (name, slug, description) values
  ('United States', 'united-states', 'American cinema and TV'),
  ('United Kingdom', 'united-kingdom', 'British cinema and TV'),
  ('South Korea', 'south-korea', 'Korean cinema and K-Dramas'),
  ('Japan', 'japan', 'Japanese cinema and anime'),
  ('India', 'india', 'Bollywood and Indian cinema'),
  ('France', 'france', 'French cinema'),
  ('Germany', 'germany', 'German cinema'),
  ('Australia', 'australia', 'Australian cinema')
on conflict (name) do nothing;

-- ===== MOOD TAGS =====
insert into mood_tags (name, slug, emoji, description) values
  ('Action-Packed', 'action-packed', '💥', 'Non-stop excitement and high energy'),
  ('Suspenseful', 'suspenseful', '😰', 'Edge-of-your-seat tension'),
  ('Heartwarming', 'heartwarming', '❤️', 'Warm and uplifting feelings'),
  ('Dark', 'dark', '🌑', 'Somber and serious tone'),
  ('Funny', 'funny', '😂', 'Light-hearted and humorous'),
  ('Thought-Provoking', 'thought-provoking', '🤔', 'Makes you think deeply'),
  ('Slow-Burn', 'slow-burn', '🔥', 'Gradual, patient storytelling'),
  ('Hopeful', 'hopeful', '🌟', 'Optimistic and inspiring'),
  ('Feel Good', 'feel-good', '😊', 'Uplifting and positive content'),
  ('Chill & Relax', 'chill-relax', '🧘', 'Easy-going and calming'),
  ('Mind-Bending', 'mind-bending', '🤯', 'Complex and thought-provoking'),
  ('Late Night', 'late-night', '🌙', 'Best watched late at night')
on conflict (name) do nothing;

-- ===== TITLES =====
insert into titles (title, description, year, duration, content_type, genres, countries, categories, mood_tags, poster_url, average_rating, total_ratings, is_published) values
  (
    'The Quantum Paradox',
    'A physicist discovers a way to communicate with parallel universes, but each message threatens to collapse reality itself.',
    2024, 148, 'movie',
    '{Sci-Fi,Thriller}', '{United States,United Kingdom}',
    '{Trending Now,Top Rated}', '{Mind-Bending,Edge of Seat}',
    'https://image.tmdb.org/t/p/w500/8G4UJk1MmSeM0pJhq8aQ6F2L6iA.jpg',
    8.5, 1240, true
  ),
  (
    'Neon Streets',
    'In a cyberpunk metropolis, a street artist becomes the unlikely hero of a revolution against corporate tyranny.',
    2024, 136, 'movie',
    '{Action,Sci-Fi}', '{Japan,United States}',
    '{New Releases,Most Watched}', '{Dark & Gritty,Binge Worthy}',
    'https://image.tmdb.org/t/p/w500/6K0gU0Rjq3kGJqZyhNlX2PJcYVg.jpg',
    7.8, 890, true
  ),
  (
    'Love in Lisbon',
    'Two strangers meet at a cafe in Lisbon and embark on a week-long adventure that changes their lives forever.',
    2024, 118, 'movie',
    '{Romance,Comedy}', '{France}',
    '{Editor''s Pick}', '{Feel Good,Heartwarming}',
    'https://image.tmdb.org/t/p/w500/4F7l3KjZq5pQVm0vRqkWnXLM2nY.jpg',
    7.2, 650, true
  ),
  (
    'The Last Forest',
    'A documentary exploring the vanishing ancient forests of the Amazon and the indigenous tribes fighting to protect them.',
    2023, 95, 'movie',
    '{Documentary}', '{United States,Brazil}',
    '{Top Rated,Editor''s Pick}', '{Heartwarming}',
    'https://image.tmdb.org/t/p/w500/7Yp4g9l2Xs5vM0rNnQdHjG3fKbE.jpg',
    9.1, 2100, true
  ),
  (
    'Shadow Protocol',
    'A former spy is pulled back into action when a ghost from her past threatens global security.',
    2024, 142, 'movie',
    '{Action,Thriller}', '{United States,United Kingdom}',
    '{Trending Now,Most Watched}', '{Edge of Seat,Dark & Gritty}',
    'https://image.tmdb.org/t/p/w500/3V5kLgJqX6pQm2wNnR8tFjYcBvZ.jpg',
    7.5, 1560, true
  ),
  (
    'Echoes of Tomorrow',
    'A time-traveling journalist must prevent a catastrophe while navigating the ethical dilemmas of changing history.',
    2024, 131, 'movie',
    '{Sci-Fi,Drama}', '{United States,Germany}',
    '{New Releases}', '{Mind-Bending}',
    'https://image.tmdb.org/t/p/w500/1a2b3c4d5e6f7g8h9i0j.jpg',
    8.0, 980, true
  ),
  (
    'The Haunting of Blackwood Manor',
    'A family moves into a centuries-old mansion and discovers an ancient evil lurking within.',
    2024, 109, 'movie',
    '{Horror,Thriller}', '{United Kingdom}',
    '{Trending Now}', '{Dark & Gritty,Edge of Seat}',
    'https://image.tmdb.org/t/p/w500/2b3c4d5e6f7g8h9i0j1k.jpg',
    6.8, 1340, true
  ),
  (
    'Cosmic Laughs',
    'An alien comedy troupe crash-lands on Earth and must learn human humor to repair their ship.',
    2024, 102, 'movie',
    '{Comedy,Sci-Fi}', '{United States}',
    '{New Releases}', '{Feel Good,Late Night}',
    'https://image.tmdb.org/t/p/w500/3c4d5e6f7g8h9i0j1k2l.jpg',
    7.0, 540, true
  ),
  (
    'Dragon''s Legacy',
    'In a mythical kingdom, a young orphan discovers she is the last dragon rider destined to save her world.',
    2024, 155, 'movie',
    '{Fantasy,Action}', '{Japan,United States}',
    '{Most Watched,Top Rated}', '{Binge Worthy,Heartwarming}',
    'https://image.tmdb.org/t/p/w500/4d5e6f7g8h9i0j1k2l3m.jpg',
    8.8, 3200, true
  ),
  (
    'Barcelona Nights',
    'A DJ and a flamenco dancer navigate love and ambition in the vibrant nightlife of Barcelona.',
    2024, 112, 'movie',
    '{Romance,Drama}', '{Spain}',
    '{Editor''s Pick}', '{Feel Good,Chill & Relax}',
    'https://image.tmdb.org/t/p/w500/5e6f7g8h9i0j1k2l3m4n.jpg',
    7.4, 720, true
  ),
  (
    'Code Black',
    'A medical thriller following an ER team during the most chaotic night of the year.',
    2024, 45, 'tv',
    '{Drama,Thriller}', '{United States}',
    '{Trending Now,Most Watched}', '{Edge of Seat}',
    'https://image.tmdb.org/t/p/w500/6f7g8h9i0j1k2l3m4n5o.jpg',
    8.2, 4500, true
  ),
  (
    'Samurai Soul',
    'An anthology series set in feudal Japan following the journeys of different ronin warriors.',
    2024, 50, 'tv',
    '{Action,Drama,Animation}', '{Japan}',
    '{New Releases,Top Rated}', '{Dark & Gritty,Mind-Bending}',
    'https://image.tmdb.org/t/p/w500/7g8h9i0j1k2l3m4n5o6p.jpg',
    9.0, 2800, true
  );
