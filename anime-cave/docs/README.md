# Anime Cave — README

> Local-first anime aggregator (English + Tamil, Muse India sources). UI-first, dark neon aesthetic with Three.js flair. Replaces CLI workflows with a searchable, playable interface.

Anime Cave aggregates search, resolve, download, and playback into one local desktop app. Backend (FastAPI + adapter layer + yt-dlp + aria2c) sits behind a React + Vite + Three.js frontend. No auth by default; all services bind to `127.0.0.1`.

## Quick Links
- Docs index: [`docs/README_DOCS_INDEX.md`](README_DOCS_INDEX.md)
- Architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Dev setup: [`DEV_SETUP.md`](DEV_SETUP.md)
- Design system: [`DESIGN.md`](DESIGN.md) · [`PALETTE_AND_TOKENS.md`](PALETTE_AND_TOKENS.md) · [`UI_STYLEGUIDE.md`](UI_STYLEGUIDE.md)
- Network/playback: [`NETWORK.md`](NETWORK.md)
- Release: [`RELEASE.md`](RELEASE.md) · Changelog: [`CHANGELOG.md`](CHANGELOG.md)

## Repo Layout
```
anime-cave/
+-- backend/           # FastAPI, adapters, download manager, player bridge
+-- frontend/          # React + Vite + Three.js
+-- docs/              # This folder — all project documentation
+-- artifacts/         # Built zips (anime-cave-docs.zip)
+-- ci/results/        # Test artifacts
```

## 60-Second Start
```bash
# backend
cd anime-cave/backend && python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# frontend (second terminal)
cd anime-cave/frontend && npm install && npm run dev  # -> http://127.0.0.1:5173
```
Copy `.env.example` ? `.env` if present. See [`DEV_SETUP.md`](DEV_SETUP.md) for env vars and troubleshooting.

## Key Features
- Unified search across adapters (English + Tamil)
- Resolve ? versions/episodes ? queue download or instant play via VLC/mpv
- aria2c fragment concurrency, retry/backoff, cache
- Preset filters + version-control panel for dubs/subs

## Agents
Automated development uses agents defined in [`AGENTS.md`](AGENTS.md) (Orchestrator, AdapterDev, Backend, Frontend, Network, QA, Docs, Release).

## Checklist
- [ ] Docs index reachable
- [ ] Dev setup verified on fresh clone
- [ ] Backend/frontend start without external exposure
