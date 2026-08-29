"""FastAPI app – Anime Cave backend."""
from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time
import asyncio
import json

from .config import config
from .adapter_manager import adapter_manager
from . import download_manager as dm
from . import player as player_bridge
from . import database as db

app = FastAPI(title="Anime Cave API", version="0.1.0")

# CORS locked to 127.0.0.1
cors_origin = config.get("app", {}).get("cors_origin", "http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: start workers
@app.on_event("startup")
def on_startup():
    try:
        dm.start_workers()
    except Exception:
        pass

@app.on_event("shutdown")
def on_shutdown():
    try:
        dm.stop_workers()
    except Exception:
        pass

@app.get("/health")
def health():
    return {"status": "ok", "ts": time.time(), "adapters": adapter_manager.list_adapters()}

@app.get("/api/search")
def search(q: str = Query(..., min_length=1), lang: Optional[str] = None, source: Optional[str] = None):
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="q required")
    # lang validation
    if lang and lang not in ("en", "ta", "all"):
        raise HTTPException(status_code=400, detail="lang must be en|ta|all")
    lang_filter = None if lang == "all" else lang
    results = adapter_manager.search(q, lang_filter)
    # source filter
    if source:
        results = [r for r in results if r.get("source") == source]
    return {"query": q, "lang": lang, "count": len(results), "results": results}

@app.get("/api/resolve")
def resolve(id: str = Query(..., alias="id")):
    if not id:
        raise HTTPException(status_code=400, detail="id required")
    try:
        detail = adapter_manager.resolve(id)
        return detail
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

class DownloadRequest(BaseModel):
    anime_id: Optional[str] = None
    episode_id: str
    version: str = "720p"

@app.post("/api/download")
def download(req: DownloadRequest):
    if not req.episode_id:
        raise HTTPException(status_code=400, detail="episode_id required")
    try:
        job = dm.enqueue_job(req.anime_id, req.episode_id, req.version)
        return {"jobId": job["id"], "status": job["status"], "episode_id": req.episode_id, "version": req.version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{job_id}")
def get_download(job_id: str):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return job

@app.get("/api/download")
def list_downloads(status: Optional[str] = None):
    return {"jobs": db.list_jobs(status)}

@app.get("/api/player/play")
def player_play(id: Optional[str] = None, episode_id: Optional[str] = None, version: str = "720p", player: Optional[str] = None):
    target = episode_id or id
    if not target:
        raise HTTPException(status_code=400, detail="id or episode_id required")
    try:
        res = player_bridge.resolve_play_url(anime_id=id, episode_id=episode_id, version=version)
        # Optionally launch external player if requested
        if player and player != "browser":
            launched = player_bridge.launch_player(res["playUrl"], player)
            return {**res, **launched}
        return res
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/player/play")
def player_play_post(body: dict):
    # Accept JSON body {id, episode_id, version, player}
    id_ = body.get("id") or body.get("anime_id")
    ep = body.get("episode_id")
    ver = body.get("version", "720p")
    pl = body.get("player")
    if not (id_ or ep):
        raise HTTPException(status_code=400, detail="id or episode_id required")
    try:
        res = player_bridge.resolve_play_url(anime_id=id_, episode_id=ep, version=ver)
        if pl and pl != "browser":
            launched = player_bridge.launch_player(res["playUrl"], pl)
            return {**res, **launched}
        return res
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# WebSocket for progress
# Note: In production, use manager with rooms; here simple broadcast
_connections: List[WebSocket] = []

@app.websocket("/ws/progress")
async def ws_progress(websocket: WebSocket):
    await websocket.accept()
    _connections.append(websocket)
    # Register callback to push to this ws
    loop = asyncio.get_event_loop()
    def cb(payload):
        # Schedule send to all connections
        for ws in list(_connections):
            try:
                # Use create_task via loop
                asyncio.run_coroutine_threadsafe(ws.send_text(json.dumps(payload)), loop)
            except Exception:
                pass
    dm.register_progress_callback(cb)
    try:
        while True:
            # Keep alive, echo ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in _connections:
            _connections.remove(websocket)

@app.get("/api/network/config")
def network_config():
    return config.get("network", {})

@app.get("/api/network/status")
def network_status():
    return dm.get_queue_stats()
