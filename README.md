# 🦊 Anime Cave V1 — Desktop Anime Streaming

> **Working system > fancy features** — Stable V1 with hybrid playback

Desktop-first anime streaming app (React Vite + Node Express + Electron) with AniList data, hybrid playback (YouTube embed / Crunchyroll redirect / Local .mp4), offline downloads only for owned content, dark VLC-style player.

### 🧱 Architecture
- **Frontend:** React 18 + Vite + React Router — `frontend/`
- **Backend:** Node.js + Express — `backend/` (proxies all AniList requests, no direct URLs exposed)
- **Desktop:** Electron — `electron/` (standalone window + local file access)
- **Data:** AniList GraphQL API

### 🧩 Features V1
1. **Discovery:** Trending + Search (AniList) + grid (cover + title + score)
2. **Detail:** Title, cover/banner, description, studios, trailer, versions (Sub / English Dub / Tamil Dub)
3. **Episodes:** Per-version list, source mapped to `youtube` | `crunchyroll` | `local` (with qualities 480p/720p)
4. **Playback:** YouTube embed, Crunchyroll open-in-browser, Local custom dark player (Play/Pause, Seek, Fullscreen, Range streaming)
5. **Download:** Only for approved hosts (owned content) — blocked for YouTube/Crunchyroll. Stored in `downloads/`, served with Range. Library at `/downloads`
6. **Subtitles:** `.vtt` / `.srt` EN + TA via `/api/subtitles/:file`
7. **Security:** Helmet, CORS, rate-limit, path traversal block, approved-host check

### ⚠️ Constraints
- External = streaming only. Offline = owned/legal only.

### 🚀 Quick Start
```bash
# backend
cd backend
npm install
npm run dev    # http://localhost:4000

# frontend (new terminal)
cd frontend
npm install
npm run dev    # http://localhost:5173 (proxies /api to 4000)

# electron (after both running)
# portable node at C:\nodejs-portable required if no system node
cd frontend
npx electron ../electron/main.js
# or build: npm run build && electron ../electron/main.js
```

### 📁 Structure
```
backend/src/{index.js,routes/{anime,downloads},services/{anilist,episodeCatalog},middleware/security,utils/cache}
frontend/src/{App.jsx,main.jsx,api/client,components/{Header,AnimeCard,AnimeGrid,EpisodeList,VideoPlayer},pages/{Home,Detail,Watch,Downloads},styles}
electron/{main.js,preload.js}
downloads/  local_content/{videos,subtitles}
```

### 🔒 API
- `GET /api/health` `GET /api/anime/trending` `GET /api/anime/search?query=` `GET /api/anime/:id` `GET /api/anime/:id/episodes`
- `GET /api/downloads/library` `GET /api/downloads/stream/:file` `POST /api/downloads/request` `DELETE /api/downloads/:file`
- `GET /api/subtitles/:file` `GET /api/versions`

### 🧪 Success Checklist
- [x] Loads without errors
- [x] Anime list + search
- [x] Detail + versions
- [x] YouTube embed / Crunchyroll redirect
- [x] Local mp4 playback
- [x] Downloaded offline playback

Branch: `backend-v1` (dev) — `main` stays clean for stable.
Future: ARISE voice assistant, wake word, AI recommendations.
