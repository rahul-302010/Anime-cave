# ARCHITECTURE

> System components, dataflow, adapter contract, and performance notes for Anime Cave. Purpose: give devs a single mental model for how search ? resolve ? download/play fits together.

## Components
| Layer | Tech | Responsibility |
|-------|------|----------------|
| Frontend | React + Vite + Three.js | SearchBar, Filters, PlayerButton, ThreeHero; calls `/api/*` |
| API | FastAPI (127.0.0.1:8000) | `/api/search`, `/api/resolve`, `/api/download`, `/api/player/play` |
| Adapter Manager | Python | Registry + routing to source adapters |
| Adapters | `backend/app/adapters/*.py` | Per-source `search/resolve/download` implementation |
| Download Manager | aria2c + queue worker | Concurrency, per-host limits, retry/backoff, cache |
| Player Bridge | VLC/mpv HTTP/IPC | HLS/DASH handoff, local playback control |
| Storage | SQLite + filesystem | Metadata, queue state, fragment cache |

## Dataflow (text diagram)
```
[User: SearchBar] ? GET /api/search?q=&lang=&filters ? AdapterManager.fanout(search)
    ? adapters return normalized Results[] ? ranked/merged ? Frontend Cards

[User: Resolve] ? GET /api/resolve?id= ? adapter.resolve() ? Episode/Version list
    ? GET /api/player/play?id=&version ? returns hlsUrl or triggers player
    ? POST /api/download {id, version} ? queue ? aria2c ? filesystem

[Download Worker] ? poll queue ? aria2c (external_downloader) ? cache ? notify UI
```

## Adapter Contract
Every adapter implements:
```python
class Adapter:
    name: str
    def search(self, query: str, lang: str | None) -> list[Result]: ...
    def resolve(self, anime_id: str) -> AnimeDetail: ...  # episodes, versions
    def download(self, episode_id: str, version: str) -> DownloadHandle: ...
```
- `Result`: `{id, title, lang, thumbnail, source, year, score}`
- `AnimeDetail`: `{id, title, episodes[], versions[]}` where version = `{dub, sub, quality}`
- Must not expose secrets; mock network in tests; raise `AdapterError` on failure.

## API Surface
- `GET /api/search?q=&lang=en|ta&filters` ? `Result[]`
- `GET /api/resolve?id=` ? `AnimeDetail`
- `POST /api/download` ? `jobId` + queue status
- `GET /api/player/play?id=&version=` ? `{playUrl, player}` or 302 to hls

## Performance Notes
- Adapter fanout with 2s timeout + partial results; cache search 5m in-memory.
- aria2c: `max_connections_per_host=4`, `split=8`, `min-split-size=1M`; fragment concurrency for HLS/DASH via yt-dlp `concurrent_fragment_downloads=4`.
- Frontend: debounce search 250ms, virtualized card grid, lazy ThreeHero (dynamic import).
- Bind all to `127.0.0.1`; no auth by default; CORS locked to dev origin.
- SQLite WAL mode; download queue persisted; crash recovery re-queues pending.

## Checklist
- [ ] Adapter contract documented and enforced
- [ ] Dataflow matches implemented endpoints
- [ ] Perf knobs mapped to SAMPLE_CONFIG.json
- [ ] No 0.0.0.0 binds in dev config
