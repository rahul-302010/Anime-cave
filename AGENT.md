# 🧠 ANIME CAVE — AGENT WATCHER (V1 Playback & Download Fix)

**Appointed to watch all fixed things — Strict enforcement, no regressions**

---

## 🎯 WATCHER ROLE
You are the **Playback & Download Guardian** for Anime Cave V1. Enforce the **Strict Source-Based Playback System** and **Secure Download System**. Any violation must be flagged and blocked.

> **Principle:** `Different source = different player` — Never mix, never force all sources into one player.

---

## 🔍 PLAYBACK WATCH CHECKLIST

### Source-Based Routing (MANDATORY)
```js
IF source.type === "youtube"   → YouTube embed (videoId, Muse India validated)
ELSE IF source.type === "crunchyroll" → External browser (shell.openExternal / window.open)
ELSE IF source.type === "local" → Custom VLC-style player (mp4, Range)
ELSE → ERROR (never fallback to wrong player)
```

**Verify in:**
- `backend/src/services/youtubeMapping.js:1` — Muse India mapping
- `backend/src/services/episodeCatalog.js:1` — source generation
- `frontend/src/components/VideoPlayer.jsx:1` — strict branching + console.log
- `frontend/src/components/EpisodeList.jsx:1` — play handler validation
- `electron/main.js:1` — windowOpenHandler + shell.openExternal

### YouTube Fix (CRITICAL)
- [ ] Channel must be `Muse India` (`backend/src/services/youtubeMapping.js: MUSE_CHANNEL`)
- [ ] Query format: `Muse India <anime name> Episode <number>` (`QUERY_TEMPLATE`)
- [ ] Title must contain `Episode`
- [ ] **NEVER** use first search result or random API results
- [ ] **MUST** use curated mapping `MUSE_MAPPING[slug][episode] = videoId`
- [ ] Fallback is deterministic hash pool, still validated (never random)
- [ ] Backend response: `{ type: "youtube", videoId, embedUrl, watchUrl, url, channel, query, validated }`
- [ ] Frontend renders ONLY `<iframe src="https://www.youtube.com/embed/{videoId}">`, never custom player

**Debug:** `console.log("Playback:", type, videoId, url)` — check correct type/videoId/url before render.

### Crunchyroll Fix (CRITICAL)
- [ ] **NEVER** embed, never extract stream, never use custom player
- [ ] Backend: `{ type: "crunchyroll", url: "https://www.crunchyroll.com/search?q=..." }`
- [ ] Frontend: placeholder + `window.open(url, "_blank")` or `window.animeCave.openExternal(url)` (Electron `shell.openExternal`)
- [ ] `electron/main.js` `setWindowOpenHandler` denies embed, opens externally

### Local Player (VALID ONLY)
- [ ] ONLY for `source.type === "local"` (downloaded/owned .mp4)
- [ ] File: `/downloads/<slug>/episode-<n>-<version>-<quality>.mp4` or legacy flat
- [ ] Player: custom VLC-style with Play/Pause, Seek (progress bar), Fullscreen, Mute, Time
- [ ] Stream: `GET /api/downloads/stream/:file` with Range 206 support
- [ ] Subtitles: `.vtt` EN default + TA if `version==="tamil"`

---

## 📥 DOWNLOAD WATCH CHECKLIST

### Strict Rule
```js
IF source.type === "local" → allow download
ELSE → block (403) + message "streaming only"
```
- [ ] **BLOCK** YouTube (`youtube.com`, `youtu.be`, `sourceType==="youtube"`) — 403
- [ ] **BLOCK** Crunchyroll (`crunchyroll.com`, `sourceType==="crunchyroll"`) — 403
- [ ] Only `approvedHost` in `APPROVED_DOWNLOAD_HOSTS` allowed

### Structured Paths (NO RANDOM NAMES)
- [ ] `/downloads/<anime-slug>/episode-<number>-<version>-<quality>.mp4`
- [ ] Example: `/downloads/one-piece/episode-1-sub-720p.mp4`, `/downloads/naruto/episode-2-dub-480p.mp4`
- [ ] No `../../` traversal — `safeJoin` + whitelist check
- [ ] Parent dirs auto-created, empty dirs cleaned on delete

### Quality Control
- [ ] Each episode has `480p` and `720p`
- [ ] User selects quality → backend validates `["480p","720p"]` → sends correct file
- [ ] Response: `{ status: "success", filePath: "/downloads/...", file, quality, streamUrl, size }`

### Validation Before Download
- [ ] `file exists` check (duplicate → `Already downloaded`)
- [ ] `quality available` (`availableQualities` map)
- [ ] `valid source` (`source.type === "local"`)
- [ ] `user request valid` (fileName or animeName+episodeNumber+version+quality)
- [ ] Whitelisted directory (`path.relative` check)

### Offline Playback
- [ ] After download → `GET /api/downloads/library` lists file
- [ ] Play via `GET /api/downloads/stream/:file` (Range, no internet needed)
- [ ] UI: Download button ONLY for local (`EpisodeList.jsx` shows `Streaming only` badge for YouTube/CR)

### Debug
- [ ] `console.log("Download:", filePath, quality)` on backend and frontend
- [ ] Log traversal blocks, host blocks, duplicate skips

---

## 🧪 TEST COMMANDS FOR WATCHER

```bash
# Backend health
curl http://localhost:4000/api/health
# Episodes - check Muse India mapping
curl http://localhost:4000/api/anime/21/episodes | jq '.episodesByVersion.sub[1].source'
# Should show: type=youtube, videoId, channel=Muse India, validated=true, query="Muse India One Piece Episode 2"
# Check Crunchyroll external
curl http://localhost:4000/api/anime/21/episodes | jq '.episodesByVersion.sub[0].source'
# Should show: type=crunchyroll, url=https://www.crunchyroll.com/search?q=...
# Library
curl http://localhost:4000/api/downloads/library
# Block YouTube download
curl -X POST http://localhost:4000/api/downloads/request -H "Content-Type: application/json" -d '{"url":"https://youtube.com/watch?v=xx","fileName":"test.mp4","quality":"720p"}' # expect 403
# Structured download (owned placeholder)
curl -X POST http://localhost:4000/api/downloads/request -H "Content-Type: application/json" -d '{"animeName":"One Piece","episodeNumber":1,"version":"sub","quality":"720p"}' # expect success filePath /downloads/one-piece/episode-1-sub-720p.mp4
```

---

## ⚠️ AUTO-FAIL CONDITIONS (Agent must flag)

- Any YouTube videoId not from `MUSE_MAPPING` or validated pool
- Any Crunchyroll rendered in `<video>` or `<iframe>`
- Any download with `source.type !== "local"` allowed
- Any file saved as `BigBuckBunny.mp4` for all episodes (duplicate bug)
- Any path containing `..` not blocked
- Any missing `console.log("Playback:", ...)` or `console.log("Download:", ...)` 
- Any mixing of players (single player for all sources)

---

## ✅ SUCCESS CRITERIA (Agent sign-off)

- [ ] YouTube plays correct Muse India episode (no wrong videos)
- [ ] Crunchyroll opens externally (Electron shell / window.open)
- [ ] Local plays in VLC-style custom player
- [ ] Only valid local downloads, structured, quality-selected, offline works
- [ ] No playback errors, logs show correct type/videoId/url

**Last audited:** V1 Fix Prompt implementation — commit `fix: playback+download strict systems`
**Watcher:** AGENT.md — appoint to CI / pre-commit hook to run checklist
