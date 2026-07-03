# WatchMe — Streaming Platform Blueprint

## 1. Development Workflow (Phased)

**Phase 1 — MVP core**
- Auth (email/password + OAuth), user profiles, multi-profile per account (like Netflix)
- Movie catalog CRUD (admin ingestion), genre/country/category taxonomy
- Video playback (adaptive streaming, not raw file serving)
- Basic search + filter

**Phase 2 — Social layer**
- Ratings (audience score)
- Comments (threaded, timestamp-aware)
- Watchlist / "Continue Watching"

**Phase 3 — Real-time & discovery**
- Live chat rooms per movie/show
- Watch parties (synced playback)
- Recommendation engine (collaborative + content-based)

**Phase 4 — Differentiators & scale**
- The novel features below
- Move from modular monolith → microservices if load demands it
- CDN + multi-region delivery

Build it as a **modular monolith first** (FastAPI with clean module boundaries). Splitting into microservices before you have real traffic just adds ops overhead you don't need yet.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                │
│   video.js / hls.js player · Zustand · TailwindCSS       │
└───────────────┬───────────────────────────┬─────────────┘
                │ REST/GraphQL                │ WebSocket
┌───────────────▼───────────────┐  ┌─────────▼─────────────┐
│      FastAPI (modular)         │  │  WebSocket Gateway     │
│  - auth                        │  │  - live chat            │
│  - catalog                     │  │  - watch-party sync      │
│  - comments/ratings            │  │  - live reactions        │
│  - recommendation              │  └─────────┬─────────────┘
└───────────────┬───────────────┘             │
                │                              │
     ┌──────────┼──────────────┬───────────────┘
     ▼          ▼              ▼
 ┌───────┐ ┌──────────┐ ┌─────────────┐
 │MongoDB│ │PostgreSQL│ │   Redis      │
 │catalog│ │users/tx  │ │ sessions,    │
 │comments│ │payments │ │ rate-limits, │
 │chat log│ │ratings  │ │ pub/sub for  │
 └───────┘ └──────────┘ │ chat/party   │
                         └─────────────┘

 ┌────────────────────────────────────────────┐
 │  Media pipeline (async, event-driven)        │
 │  Upload → FFmpeg transcode → HLS/DASH        │
 │  segments → S3-compatible storage → CDN      │
 │  (Cloudflare / Bunny.net cheaper than AWS    │
 │   CloudFront for indie-scale)                │
 └────────────────────────────────────────────┘

 ElasticSearch/Meilisearch — fast genre/title/actor search
 Kafka or Redis Streams — event bus (view events, ratings → feed the recommender)
```

**Key architectural decisions:**
- **Never serve raw video files.** Transcode to HLS (HTTP Live Streaming) with multiple bitrate renditions — this is what actually makes it feel like Netflix (adaptive quality based on bandwidth).
- **MongoDB** for catalog metadata, comments, chat — flexible schema, matches your existing stack.
- **PostgreSQL** for anything transactional — users, subscriptions/payments, ratings (you want relational integrity here).
- **Redis** for session state, WebSocket pub/sub (so chat scales across multiple server instances), and caching hot catalog queries.
- **Legal note:** you'll need actual licensing or original/indie content — sourcing pirated streams is a legal non-starter for a real product.

---

## 3. Standard Features (table stakes — must match Netflix/Hulu/Disney+)

- Multi-profile accounts, kids mode with content restrictions
- Adaptive bitrate streaming, offline downloads (PWA + service worker caching)
- Continue watching / resume position
- Personalized home rows ("Because you watched X")
- Genre/category/country browsing, search with filters
- Trailers, cast/crew info
- Multi-device sync (start on phone, resume on TV)
- Subtitles/closed captions, multi-audio tracks

## 4. Novel Features (largely unexplored — your competitive edge)

1. **Timestamped, spoiler-shielded comments** — Comments attach to a specific timestamp in the movie (like YouTube), but are auto-hidden until the viewer's own watch progress passes that timestamp. Nobody does this well today — Amazon's X-Ray is trivia-only, not community discussion.

2. **Community subtitle & dub marketplace** — Crowdsourced, verified translations/dubs for underserved languages (this is where your Twi/Ghanaian-language interest could be a genuine differentiator — most major platforms badly underserve African-language content and dubbing).

3. **"Abandon point" analytics, shown to viewers** — Surface aggregate data like "62% of viewers stop watching around the 40-minute mark" as an opt-in transparency feature. Nobody currently exposes this to users (only to studios internally).

4. **Mood-based discovery, not just genre** — Let users search "something slow-burn and hopeful" via a small NLP layer over crowdsourced "vibe tags," instead of rigid genre trees.

5. **Indie/local creator marketplace** — A YouTube-meets-Netflix upload path for independent and regional filmmakers with a revenue-share model — lets you bootstrap a content library without needing major studio licensing deals on day one.

6. **Watch clubs** — Persistent, recurring discussion groups (like a book club) tied to a title or director, not just one-off watch parties.

7. **Split critic/audience trust score with reasoning tags** — Instead of a single number, show *why* people rated it that way (pacing, acting, ending) via crowdsourced tag voting.

---

## 5. The Ultimate Prompt (copy this to your AI coding assistant)

```
You are a senior full-stack architect and product engineer. Design and scaffold
"WatchMe" — a movie/series streaming platform competing directly with Netflix,
Disney+, and Amazon Prime Video, built by a solo engineer for an MVP-first,
scale-later rollout.

## Tech stack (mandatory)
- Backend: FastAPI (Python), modular monolith structure (routers/services/repositories
  separated cleanly so it can be split into microservices later)
- Frontend: React + Vite + TailwindCSS + Zustand for state
- Video playback: hls.js for adaptive bitrate streaming
- Databases: MongoDB (catalog, comments, chat history) + PostgreSQL (users, auth,
  subscriptions, ratings) + Redis (sessions, caching, WebSocket pub/sub)
- Real-time: WebSocket gateway for live chat and synced watch parties
- Search: Meilisearch for fast title/genre/actor search
- Media pipeline: FFmpeg transcoding to HLS multi-bitrate renditions, stored on
  S3-compatible object storage, served via CDN

## Design system (must be followed exactly across every screen)
- Theme: dark-mode-first, neon-accented cyberpunk aesthetic
- Background: near-black (#0A0A0F)
- Primary accent: electric cyan (#00F0FF)
- Secondary accent: neon magenta (#FF2D95)
- Success/rating highlight: neon lime (#C6FF3D)
- Typography: bold geometric sans-serif for headings, clean sans-serif for body
- UI motifs: subtle glow/shadow on hover states, glassmorphism panels for
  overlays (comments, chat), smooth micro-animations on row scroll
[If Matthew has different brand colors, replace the hex codes above before running this prompt.]

## Core deliverables
1. System architecture diagram and folder structure for both frontend and backend
2. Database schema for: users, profiles, titles (movies/shows), episodes, genres,
   countries, categories, comments (timestamp-linked), ratings, watch history,
   chat messages, watch parties
3. REST API spec (OpenAPI) covering auth, catalog browsing/search, comments,
   ratings, watchlist, continue-watching
4. WebSocket protocol spec for: live chat per title, synced watch-party playback
   (play/pause/seek broadcast with drift correction), live reactions
5. Video ingestion pipeline: upload → FFmpeg transcode → HLS segments → CDN,
   as an async background job (Celery or FastAPI BackgroundTasks + queue)
6. Recommendation engine v1: simple collaborative filtering (user-item ratings
   matrix) + content-based fallback (genre/actor overlap) for cold-start users
7. Frontend: home page with personalized rows, title detail page, video player
   page with timestamped spoiler-shielded comments panel, live chat sidebar,
   search/filter page, profile management

## Differentiator features to implement after MVP (design the schema now so
they're not bolted on later)
- Timestamped comments that stay hidden until the viewer's playback progress
  passes that timestamp (spoiler shield)
- Mood/vibe-based search tags (crowdsourced, NLP-matched) alongside genre
- Abandon-point analytics surfaced to viewers ("X% of viewers stop around Y minutes")
- Community subtitle/dub contribution system with verification/voting
- Indie creator upload + revenue-share marketplace
- Persistent "watch clubs" tied to a title, not just one-off watch parties
- Split rating system: numeric score + crowdsourced reasoning tags (pacing,
  acting, ending, etc.)

## Constraints
- Assume no major studio licensing on day one — content library starts with
  indie/creator-uploaded and licensed public-domain/independent films
- Build for horizontal scalability from the start (stateless API servers,
  session state in Redis, not in-memory)
- All video must be transcoded to adaptive HLS — never serve raw uploaded files
- Mobile-responsive from the first frontend commit, not retrofitted later

## Output format
Start with the system architecture and DB schema. Then scaffold the backend
module structure with empty but correctly-typed function signatures. Then
scaffold the frontend route structure and component tree. Wait for my
go-ahead before writing full implementation code for any single module.
```

---

A few honest notes: the biggest real bottleneck for something like this isn't the code, it's content licensing and video egress costs. If you build the full MVP feature set but start with a small indie/creator content library, you avoid the studio-deal problem entirely while still proving out the product. Happy to help scaffold the actual FastAPI module structure or the MongoDB schemas next if you want to start building rather than just planning.
