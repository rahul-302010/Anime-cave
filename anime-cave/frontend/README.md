# Anime Cave Frontend

React + Vite + Three.js — dark neon UI for local-first anime search & play.

## Quick start
```bash
npm install
npm run dev  # -> http://127.0.0.1:5173 (proxies /api to 127.0.0.1:8000)
npm run build && npm run preview
```

## Components
- **SearchBar** (`src/components/SearchBar.tsx`) – autocomplete + EN/TA toggle, debounce 250ms, cmd/ctrl+K focus, dropdown + grid sync.
- **Filters** (`src/components/Filters.tsx`) – facet chips (Lang/Source/Year/Score), presets in localStorage, Clear all.
- **PlayerButton** (`src/components/PlayerButton.tsx`) – calls `/api/player/play`, opens HLS URL, queues download via `/api/download`, loading spinner.
- **ThreeHero** (`src/components/ThreeHero.tsx`) – lazy Three.js points/mist behind header, parallax lerp 0.06, pauses off-screen/hidden, respects prefers-reduced-motion.

## API client
`src/api/client.ts` – typed wrappers for `/api/search`, `/api/resolve`, `/api/download`, `/api/player/play`, `/api/network/*`, and `ws://…/ws/progress`.

## Dev proxy
`vite.config.ts` proxies `/api` and `/ws` to `http://127.0.0.1:8000` so frontend and backend stay on 127.0.0.1 without CORS issues.

## Tokens
Tokens from `docs/PALETTE_AND_TOKENS.md` are inlined (no CSS framework): bg #0A0A12, surface #12121F, violet #7C3AED, cyan #00E5CC, radius 12px, etc. See `DESIGN.md`.

## Accessibility
- Focus ring cyan 2px, hit targets >=44px, keyboard nav for filters, reduced-motion disables Three.js.
