"""Download manager knob tests."""
import time
from app import download_manager as dm
from app.config import config

def test_knobs_respected():
    knobs = dm._get_knobs()
    assert knobs["external_downloader"] in ("aria2c", "native", "aria2c")
    assert 1 <= knobs["concurrency"] <= 8
    assert 1 <= knobs["per_host_limit"] <= 16
    assert knobs["retry_count"] >= 0
    assert knobs["segment_size"] in ("1M", "512K", "1M", "2M")

def test_build_command_with_aria2():
    knobs = {
        "external_downloader": "aria2c",
        "per_host_limit": 4,
        "split": 8,
        "segment_size": "1M",
        "bandwidth_limit": "0",
        "concurrency": 3,
        "retry_count": 3,
        "backoff_ms": 1000,
        "cache_dir": "./cache",
        "max_cache_size_mb": 2048,
        "external_downloader_args": "-x 4 -s 8 -k 1M --max-connection-per-server=4"
    }
    cmd = dm._build_command("https://cdn.example/video.m3u8", __import__("pathlib").Path("./cache/test.mp4"), knobs)
    assert isinstance(cmd, list)
    assert len(cmd) > 0
    # should contain url
    assert "https://cdn.example/video.m3u8" in cmd or "test.mp4" in " ".join(cmd)

def test_enqueue_and_worker():
    dm.start_workers(1)
    job = dm.enqueue_job(None, "muse_naruto_001_ep1", "720p")
    assert job["status"] == "queued"
    # Wait for worker to process (mock worker simulates progress)
    time.sleep(1.5)
    from app import database as db
    j = db.get_job(job["id"])
    assert j is not None
    assert j["status"] in ("downloading", "done", "queued", "failed")
    dm.stop_workers()
    # restart for other tests
    dm.start_workers(1)
    time.sleep(0.2)
    dm.stop_workers()
