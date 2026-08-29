"""API smoke tests for backend endpoints."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_search_naruto():
    r = client.get("/api/search", params={"q": "naruto"})
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert data["count"] >= 1
    # schema check
    for res in data["results"]:
        assert "id" in res and "title" in res and "source" in res

def test_search_lang_filter():
    r = client.get("/api/search", params={"q": "naruto", "lang": "en"})
    assert r.status_code == 200
    for res in r.json()["results"]:
        assert res["lang"] == "en"

def test_search_empty_q_fails():
    r = client.get("/api/search", params={"q": ""})
    # FastAPI will 422 due to min_length
    assert r.status_code in (400, 422)

def test_resolve():
    r = client.get("/api/resolve", params={"id": "muse_naruto_001"})
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "muse_naruto_001"
    assert "episodes" in data

def test_resolve_404():
    r = client.get("/api/resolve", params={"id": "nonexistent_999"})
    assert r.status_code == 404

def test_download_enqueue():
    r = client.post("/api/download", json={"episode_id": "muse_naruto_001_ep1", "version": "720p"})
    assert r.status_code == 200
    assert "jobId" in r.json()
    job_id = r.json()["jobId"]
    # fetch job
    r2 = client.get(f"/api/download/{job_id}")
    assert r2.status_code == 200
    assert r2.json()["episode_id"] == "muse_naruto_001_ep1"

def test_player_play():
    r = client.get("/api/player/play", params={"id": "muse_naruto_001", "version": "720p"})
    assert r.status_code == 200
    assert "playUrl" in r.json()

def test_player_play_episode():
    r = client.get("/api/player/play", params={"episode_id": "muse_naruto_001_ep1", "version": "1080p"})
    assert r.status_code == 200
    assert "playUrl" in r.json()

def test_player_play_missing():
    r = client.get("/api/player/play")
    assert r.status_code in (400, 422)

def test_network_config():
    r = client.get("/api/network/config")
    assert r.status_code == 200
    assert "external_downloader" in r.json()

def test_network_status():
    r = client.get("/api/network/status")
    assert r.status_code == 200
    assert "queued" in r.json()
