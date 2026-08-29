# CHANGELOG

> Version history for Anime Cave docs and app.

## [0.1.0] — 2026-08-29
### Added
- Initial full `docs/` set (20 files) per one-shot prompt: AGENTS, README, ARCHITECTURE, IMPLEMENTATION, DEV_SETUP, DESIGN, GENERAL_DESIGN, ADVANCED_DESIGN_TASTE, UI_STYLEGUIDE, MOTION_AND_INTERACTIONS, PALETTE_AND_TOKENS, NETWORK, UX, LINKS, REFERENCE_LINKS, RELEASE, QA_REPORT, README_DOCS_INDEX, SAMPLE_CONFIG.json, CHANGELOG.
- Dark neon design system (violet `#7C3AED` / cyan `#00E5CC` / base `#0A0A12`) with shared tokens.
- Adapter contract (`search/resolve/download`), download manager with aria2c, player bridge (browser/vlc/mpv).
- Update/rollback + DB backup policy (5 backups, `backups/` dir).
- Sample config with network + player + app defaults bound to `127.0.0.1`.

### Notes
- No adapters/endpoints implemented yet — docs only. Next: AdapterDevAgent + BackendAgent runs.
- No breaking changes.

## [0.1.0] — 2026-08-29 — docs & initial pipeline run
### Added
- `backend/app/adapters/muse_india.py` with search/resolve/download, mocked tests.
- FastAPI endpoints `/api/search`, `/api/resolve`, `/api/download`, `/api/player/play`, WebSocket `/ws/progress`, adapter manager fanout, download queue with worker pool, VLC/mpv bridge.
- Frontend React components `SearchBar` (autocomplete + EN/TA toggle), `Filters` (facets + presets), `PlayerButton` (calls `/api/player/play`), `ThreeHero` (Three.js stub) + API client + Vite proxy.
- Network knobs `external_downloader`, `concurrency`, `per_host_limit`, `segment_size`, `retry_count`, `backoff_ms`, `bandwidth_limit` persisted to `SAMPLE_CONFIG.json` and honored by download manager (smoke-tested).
- Docs completed via DocsAgent: `docs/AGENTS.md`, `docs/ADAPTERS.md` added; `NETWORK.md` expanded; `SAMPLE_CONFIG.json` updated.
- CI results and QA report generated; `artifacts/anime-cave-docs.zip` packaged.

### Fixed
- Ensured `docs/` contains all 20 required files per `README_DOCS_INDEX.md` (added missing `AGENTS.md`).
- Verified no `0.0.0.0` binds; all services on `127.0.0.1`.

## Checklist
- [x] Initial entry dated and versioned
- [x] Added section covers all deliverables
- [x] v0.1.0 docs & initial pipeline run entry added
