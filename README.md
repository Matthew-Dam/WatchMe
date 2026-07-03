# WatchMe — Streaming Platform

A Netflix-like streaming platform built as a modular monolith (FastAPI + React).

## Tech Stack

**Backend:** FastAPI, PostgreSQL, MongoDB, Redis, Meilisearch, Celery
**Frontend:** React + Vite + TailwindCSS + Zustand + hls.js
**Media:** FFmpeg HLS adaptive streaming, S3-compatible storage (MinIO)
**Design:** Dark-mode cyberpunk aesthetic (#0A0A0F, #00F0FF, #FF2D95, #C6FF3D)

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, MongoDB, Redis, Meilisearch, and MinIO.

### 2. Start backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Frontend: http://localhost:5173
Backend API: http://localhost:8000/api
API Docs: http://localhost:8000/docs

## Project Structure

```
WatchMe/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app entry
│       ├── config.py            # Settings
│       ├── database/            # MongoDB, PostgreSQL, Redis
│       ├── models/              # SQLAlchemy + MongoDB models
│       ├── schemas/             # Pydantic schemas
│       ├── routers/             # API endpoints
│       ├── services/            # Business logic
│       ├── repositories/        # Data access layer
│       ├── websocket/           # Chat + watch party WS
│       ├── tasks/               # Celery background jobs
│       ├── middleware/           # Rate limiting, error handling
│       └── deps/                # FastAPI dependencies
├── frontend/
│   └── src/
│       ├── components/          # UI, layout, player, chat, comments
│       ├── pages/               # Route pages
│       ├── stores/              # Zustand state stores
│       ├── hooks/               # Custom React hooks
│       ├── services/            # API client functions
│       └── types/               # TypeScript interfaces
├── docker-compose.yml           # Infrastructure services
└── .env                         # Environment variables
```

## Features

### Standard
- Multi-profile accounts with kid mode
- Email/password auth + OAuth ready
- Movie/show catalog with genre/country/category taxonomy
- Adaptive bitrate HLS streaming (480p/720p/1080p)
- Search with Meilisearch (title, genre, cast, mood)
- Continue watching / resume position
- Watchlist
- Ratings (1-10) with distribution display

### Novel
- **Timestamped spoiler-shielded comments** — comments attach to video timestamps; spoiler-tagged comments auto-hide until viewer passes that timestamp
- **Live chat rooms** per movie/show via WebSocket
- **Watch parties** — synced playback with play/pause/seek broadcast
- **Mood/vibe-based discovery** — search by mood tags alongside genre
- **Abandon-point analytics** — shows viewer retention data ("62% stop at 40min")
- **Indie creator upload** — marketplace for independent filmmakers
- **Split rating system** — numeric score + crowdsourced reasoning tags
