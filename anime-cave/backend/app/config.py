"""App config – maps to SAMPLE_CONFIG.json + env overrides."""
import os
import json
from pathlib import Path
from typing import Optional

DEFAULT_CONFIG = {
    "network": {
        "max_connections_per_host": 4,
        "concurrency": 3,
        "split": 8,
        "min_split_size": "1M",
        "external_downloader": "aria2c",
        "external_downloader_args": "-x 4 -s 8 -k 1M --max-connection-per-server=4",
        "retry_attempts": 3,
        "retry_backoff_ms": 1000,
        "cache_dir": "./cache",
        "max_cache_size_mb": 2048,
        "per_host_limit": 4,
        "segment_size": "1M",
        "retry_count": 3,
        "backoff_ms": 1000,
        "bandwidth_limit": "0"
    },
    "player": {
        "default_player": "browser",
        "fallback_players": ["vlc", "mpv"],
        "hls": {
            "maxBufferLength": 30,
            "maxMaxBufferLength": 60,
            "enableWorker": True
        }
    },
    "app": {
        "host": "127.0.0.1",
        "port": 8000,
        "cors_origin": "http://127.0.0.1:5173",
        "log_level": "info"
    }
}

def load_config(config_path: Optional[str] = None) -> dict:
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))  # deep copy
    # Try to load SAMPLE_CONFIG.json if present
    candidates = []
    if config_path:
        candidates.append(Path(config_path))
    candidates.extend([
        Path(__file__).parent.parent.parent / "docs" / "SAMPLE_CONFIG.json",
        Path(__file__).parent.parent / "SAMPLE_CONFIG.json",
        Path("SAMPLE_CONFIG.json"),
        Path("docs/SAMPLE_CONFIG.json"),
    ])
    for p in candidates:
        if p.exists():
            try:
                with open(p) as f:
                    loaded = json.load(f)
                    # deep merge
                    for k, v in loaded.items():
                        if isinstance(v, dict) and k in cfg:
                            cfg[k].update(v)
                        else:
                            cfg[k] = v
                break
            except Exception:
                continue
    # Env overrides
    cfg["network"]["external_downloader"] = os.getenv("EXTERNAL_DOWNLOADER", cfg["network"]["external_downloader"])
    cfg["network"]["concurrency"] = int(os.getenv("CONCURRENCY", str(cfg["network"]["concurrency"])))
    cfg["network"]["per_host_limit"] = int(os.getenv("PER_HOST_LIMIT", str(cfg["network"].get("per_host_limit", 4))))
    cfg["network"]["retry_count"] = int(os.getenv("RETRY_COUNT", str(cfg["network"].get("retry_count", 3))))
    cfg["network"]["bandwidth_limit"] = os.getenv("BANDWIDTH_LIMIT", str(cfg["network"].get("bandwidth_limit", "0")))
    cfg["app"]["host"] = os.getenv("HOST", cfg["app"]["host"])
    cfg["app"]["port"] = int(os.getenv("PORT", str(cfg["app"]["port"])))
    cfg["player"]["default_player"] = os.getenv("DEFAULT_PLAYER", cfg["player"]["default_player"])
    return cfg

config = load_config()
