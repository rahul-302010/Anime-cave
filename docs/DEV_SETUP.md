# DEV_SETUP

> Quick dev checklist, runtime env variables, and common troubleshooting for Anime Cave. Get from clone to running in <5 minutes.

## Quick Checklist
- [ ] Clone repo; ensure `anime-cave/` root exists
- [ ] Backend: `python >=3.11`, `yt-dlp`, `aria2c`, `vlc` or `mpv` optional
- [ ] Frontend: `node >=18`
- [ ] Copy env: `copy .env.example .env` (Windows) or `cp .env.example .env`
- [ ] Backend: `pip install -r backend/requirements.txt` ? `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
- [ ] Frontend: `cd frontend && npm install && npm run dev` ? `http://127.0.0.1:5173`
- [ ] Verify: `GET http://127.0.0.1:8000/api/search?q=naruto` returns JSON

## Runtime Env Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | Bind host (do not use 0.0.0.0) |
| `PORT` | `8000` | API port |
| `CORS_ORIGIN` | `http://127.0.0.1:5173` | Frontend origin |
| `CACHE_DIR` | `./cache` | Fragment/cache dir |
| `DB_PATH` | `./anime_cave.db` | SQLite path |
| `ARIA2C_PATH` | `aria2c` | Binary path |
| `YTDLP_PATH` | `yt-dlp` | Binary path |
| `DEFAULT_PLAYER` | `browser` | `browser`/`vlc`/`mpv` |
| `LOG_LEVEL` | `info` | `debug`/`info`/`warn` |

Put secrets (if any) in `.env`; commit only `.env.example` with placeholders.

## Common Tasks
```bash
pytest backend/tests -v
npm run build        # frontend production check
yt-dlp --version && aria2c --version
```

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| `aria2c not found` | Install via `choco install aria2` (Win) or `brew install aria2`; set `ARIA2C_PATH` |
| `yt-dlp 403` | Update `yt-dlp -U`; check per-host limits; lower concurrency |
| CORS error | Ensure `CORS_ORIGIN` matches Vite port; restart backend |
| VLC not launching | Set `DEFAULT_PLAYER=browser` or install VLC and set path |
| Port 8000 in use | `netstat -ano | findstr :8000` ? kill PID or change `PORT` |
| Tamil search empty | Verify adapter `supports_lang` includes `ta`; check transliteration |

## Checklist
- [ ] `.env.example` documents all vars
- [ ] No 0.0.0.0 in default config
- [ ] Troubleshooting covers aria2/yt-dlp/player
