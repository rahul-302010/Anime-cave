"""Player bridge – VLC/mpv/browser HLS handoff."""
import os
import shutil
import subprocess
from typing import Optional, Dict
from .config import config
from .adapter_manager import adapter_manager

def resolve_play_url(anime_id: Optional[str] = None, episode_id: Optional[str] = None, version: str = "720p") -> Dict:
    """Resolve to playable URL via adapter."""
    target = episode_id or anime_id
    if not target:
        raise ValueError("anime_id or episode_id required")
    # Try adapter download handle (which returns URL)
    try:
        if episode_id:
            handle = adapter_manager.download(episode_id, version)
            return {"playUrl": handle.url, "player": "browser", "headers": handle.headers, "quality": handle.quality}
        else:
            # Resolve anime then pick first episode's version
            detail = adapter_manager.resolve(anime_id)
            # detail is dict
            eps = detail.get("episodes", [])
            if eps:
                ep = eps[0]
                versions = ep.get("versions", [])
                # Find matching quality
                chosen = None
                for v in versions:
                    if version in v.get("quality", "") or version in v.get("url", ""):
                        chosen = v
                        break
                if not chosen and versions:
                    chosen = versions[0]
                if chosen and chosen.get("url"):
                    return {"playUrl": chosen["url"], "player": "browser", "quality": chosen.get("quality")}
                # fallback to adapter download
                handle = adapter_manager.download(ep["id"], version)
                return {"playUrl": handle.url, "player": "browser", "quality": handle.quality}
            # fallback to direct
            return {"playUrl": f"https://example.com/{anime_id}_{version}.m3u8", "player": "browser"}
    except Exception as e:
        raise RuntimeError(f"resolve play failed: {e}") from e

def launch_player(url: str, player: Optional[str] = None) -> Dict:
    """Launch external player (VLC/mpv) or return browser URL."""
    cfg_player = player or config.get("player", {}).get("default_player", "browser")
    if cfg_player == "browser":
        return {"player": "browser", "playUrl": url, "launched": False}
    # Try VLC
    if cfg_player == "vlc":
        vlc_path = shutil.which("vlc")
        if vlc_path:
            try:
                subprocess.Popen([vlc_path, "--play-and-exit", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return {"player": "vlc", "playUrl": url, "launched": True}
            except Exception as e:
                return {"player": "vlc", "playUrl": url, "launched": False, "error": str(e)}
        else:
            # fallback to browser
            return {"player": "browser", "playUrl": url, "launched": False, "fallback": "vlc not found"}
    if cfg_player == "mpv":
        mpv_path = shutil.which("mpv")
        if mpv_path:
            try:
                subprocess.Popen([mpv_path, url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return {"player": "mpv", "playUrl": url, "launched": True}
            except Exception as e:
                return {"player": "mpv", "playUrl": url, "launched": False, "error": str(e)}
        else:
            return {"player": "browser", "playUrl": url, "launched": False, "fallback": "mpv not found"}
    return {"player": "browser", "playUrl": url, "launched": False}
