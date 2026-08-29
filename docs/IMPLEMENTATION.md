# IMPLEMENTATION

> Adapter checklist, download manager design, player bridge options, and testing/CI notes. How to build Anime Cave without guessing.

## Adapter Checklist
- [ ] Create `backend/app/adapters/<source>.py` implementing `search/resolve/download`
- [ ] Register in `adapter_manager.py` with `name` + `supports_lang`
- [ ] Normalize to `Result`/`AnimeDetail` schemas; handle Tamil transliteration
- [ ] `search`: fanout-safe, 2s timeout, empty-query guard, mockable HTTP client
- [ ] `resolve`: enumerate episodes + versions (dub/sub/quality), stable IDs
- [ ] `download`: return yt-dlp-compatible URL or direct file URL
- [ ] Unit tests mocking network (`tests/adapters/test_<source>.py`) — no live hits
- [ ] Docs snippet in `docs/ADAPTERS.md` (if exists) or PR description
- [ ] Add `lang` filter wiring to `/api/search`

## Download Manager Design
**Queue:** SQLite table `downloads(id, anime_id, episode_id, version, status, progress, path)` polled by worker thread.
**Flow:** `POST /api/download` ? insert `queued` ? worker picks `queued` ? calls adapter download ? delegates to aria2c/yt-dlp ? updates `downloading` ? `done`/`failed`.
**Config knobs (SAMPLE_CONFIG.json):**
- `max_connections_per_host` (1–16), `concurrency` (1–8), `split`, `min_split_size`
- `external_downloader: aria2c`, `external_downloader_args`
- `retry_attempts`, `retry_backoff_ms`, `cache_dir`, `max_cache_size_mb`
**aria2c integration:** `yt-dlp --external-downloader aria2c --external-downloader-args "-x 4 -s 8 -k 1M"` . Per-host limits prevent IP bans. Fragment concurrency for HLS: `--concurrent-fragments 4`.
**Cache:** fragment cache in `cache_dir`; LRU eviction at `max_cache_size_mb`. Persist queue across restarts.

## Player Bridge Options
| Player | Pros | Integration |
|--------|------|-------------|
| VLC | Ubiquitous, HTTP iface | `GET /api/player/play` ? `vlc --play-and-exit <url>` or RC interface |
| mpv | Lightweight, IPC | `mpv --input-ipc-server` JSON IPC |
| Browser (hls.js) | Zero external dep | Return HLS URL; frontend plays via `hls.js` |
Default: browser hls.js fallback; config `default_player: vlc|mpv|browser`.

## Testing & CI
- **Unit:** `pytest backend/tests -v` — adapters mocked, API client tests.
- **Smoke:** `frontend: npm run build && npm run preview` + `backend: uvicorn --host 127.0.0.1` health check.
- **CI:** `ci/results/*.json` — agents must record pass/fail. Branch `agent/<role>/<desc>` ? PR to `main`.
- Local gate: all tests pass before PR; docs checklist in `QA_REPORT.md`.

## Checklist
- [ ] Adapter follows interface + mocked tests
- [ ] Download queue persists + recovers
- [ ] Player bridge configurable via SAMPLE_CONFIG.json
- [ ] CI results written to ci/results/
