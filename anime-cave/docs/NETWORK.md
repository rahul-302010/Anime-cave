# NETWORK

> Best practices for playback & downloads in Anime Cave. HLS/DASH, fragment concurrency, aria2c tips, caching, retries.

## Purpose
Make transfers fast and polite — saturate local bandwidth without getting banned, and play instantly even on fragmented streams.

## Playback (HLS/DASH)
- Prefer `hls.js` in browser for HLS; native for HLS in Safari. DASH via `dash.js` only if needed.
- Start playback before full download: stream fragments directly; yt-dlp `--concurrent-fragments 4` for HLS.
- Keep `hls.js` config: `maxBufferLength 30`, `maxMaxBufferLength 60`, `enableWorker true`.
- Fallback chain: direct HLS URL → yt-dlp resolved URL → error toast with retry.

## Downloads & aria2c
**Why aria2c:** faster than default yt-dlp downloader for HTTP; supports split + per-host limits.
```bash
yt-dlp --external-downloader aria2c --external-downloader-args "-x 4 -s 8 -k 1M --max-connection-per-server=4" <url>
```
- `max_connections_per_host=4` (alias `per_host_limit`) — polite default, raise to 8 only on slow hosts
- `concurrency` (global parallel jobs) = 2–3; per-host limit prevents triggering WAF.
- `split 8`, `min-split-size 1M` (alias `segment_size`) for files >5MB; disable split for small thumbs.
- `external_downloader`: `aria2c` or `native` (fallback when aria2c missing)
- `retry_count` (alias `retry_attempts`) = 3 with exponential `backoff_ms` (1000, 2000, 4000)
- `bandwidth_limit`: `0` unlimited, or e.g. `"500K"` / `"2M"` passed as aria2c `--max-overall-download-limit`
- Timeout 15s, retry 3× with exponential backoff (1s, 2s, 4s).

## Network Knobs (SAMPLE_CONFIG.json)
| Knob | Default | Purpose |
|------|---------|---------|
| `external_downloader` | `aria2c` | `aria2c` or `native` |
| `concurrency` | `3` | Global parallel download jobs (1–8) |
| `per_host_limit` | `4` | Per-host connection limit (alias `max_connections_per_host`) |
| `segment_size` | `1M` | Split chunk size (alias `min_split_size`) |
| `split` | `8` | Number of splits per file |
| `retry_count` | `3` | Retry attempts (alias `retry_attempts`) |
| `backoff_ms` | `1000` | Initial backoff ms, doubles each retry |
| `bandwidth_limit` | `0` | Overall bandwidth cap, `0` unlimited |
| `max_cache_size_mb` | `2048` | LRU eviction threshold |
| `cache_dir` | `./cache` | Fragment/cache directory |

Persisted in `SAMPLE_CONFIG.json` and env-overridable (`CONCURRENCY`, `PER_HOST_LIMIT`, `RETRY_COUNT`, `BANDWIDTH_LIMIT`, `EXTERNAL_DOWNLOADER`).

## Caching
- `CACHE_DIR` stores fragments + thumbs. LRU eviction at `max_cache_size_mb` (default 2048).
- Search results cached 5m in-memory; thumbs cached on disk 7d.
- Validate `ETag`/`Last-Modified` before re-fetch.

## Retries & Backoff
| Error | Action |
|-------|--------|
| 429 / 403 | Backoff 30s, reduce per-host to 2, retry 2× then surface |
| Timeout | Retry 3× linear backoff |
| Fragment fail | Retry fragment 2×, then fail job with partial file kept |
| aria2c missing | Fallback to native yt-dlp downloader + warn in logs |

## Config Snippet
See `SAMPLE_CONFIG.json`:
```json
{
  "external_downloader": "aria2c",
  "concurrency": 3,
  "per_host_limit": 4,
  "segment_size": "1M",
  "retry_count": 3,
  "backoff_ms": 1000,
  "bandwidth_limit": "0"
}
```
Download manager honors knobs: worker pool size = `concurrency`, aria2c flags built from `per_host_limit`/`split`/`segment_size`/`bandwidth_limit`, retry loop uses `retry_count`/`backoff_ms`. Validated by `tests/test_download_manager.py` smoke test.

## Checklist
- [x] Default concurrency is polite (<=4 per host)
- [x] Fallback when aria2c unavailable
- [x] HLS starts without full download
- [x] Cache eviction tested
- [x] All knobs persisted and documented
