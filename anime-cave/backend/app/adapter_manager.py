"""Adapter Manager – registry + fanout with timeout."""
from __future__ import annotations
from typing import List, Optional, Dict
import concurrent.futures
from .adapters.base import Result, AnimeDetail, DownloadHandle, AdapterError
from .adapters.muse_india import MuseIndiaAdapter


class AdapterManager:
    def __init__(self):
        self.adapters: Dict[str, object] = {}
        self.register(MuseIndiaAdapter())

    def register(self, adapter):
        self.adapters[adapter.name] = adapter

    def list_adapters(self):
        return list(self.adapters.keys())

    def search(self, query: str, lang: Optional[str] = None, timeout: float = 2.0) -> List[dict]:
        """Fanout search across adapters with 2s timeout, merge and deduplicate."""
        results: List[Result] = []
        # Use ThreadPool for fanout
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(self.adapters) or 1) as executor:
            futures = {executor.submit(adapter.search, query, lang): name for name, adapter in self.adapters.items()}
            for future in concurrent.futures.as_completed(futures, timeout=timeout+1):
                try:
                    # per-future timeout
                    data = future.result(timeout=timeout)
                    if isinstance(data, list):
                        results.extend(data)
                except concurrent.futures.TimeoutError:
                    continue
                except AdapterError:
                    continue
                except Exception:
                    continue
        # Deduplicate by id, keep highest score
        seen = {}
        for r in results:
            if r.id not in seen or (r.score or 0) > (seen[r.id].score or 0):
                seen[r.id] = r
        # Sort by score desc then title
        merged = sorted(seen.values(), key=lambda x: (-(x.score or 0), x.title))
        return [r.to_dict() for r in merged]

    def resolve(self, anime_id: str) -> dict:
        """Resolve via appropriate adapter (prefix match or try all)."""
        # Try prefix: muse_ -> muse_india
        if anime_id.startswith("muse_") and "muse_india" in self.adapters:
            return self.adapters["muse_india"].resolve(anime_id).to_dict()
        # Try each adapter
        last_err = None
        for adapter in self.adapters.values():
            try:
                return adapter.resolve(anime_id).to_dict()
            except AdapterError as e:
                last_err = e
                continue
            except Exception as e:
                last_err = e
                continue
        raise AdapterError(str(last_err) if last_err else f"resolve failed for {anime_id}")

    def download(self, episode_id: str, version: str = "720p") -> DownloadHandle:
        """Delegate download to appropriate adapter."""
        # Heuristic: musen prefix
        if episode_id.startswith("muse_") and "muse_india" in self.adapters:
            return self.adapters["muse_india"].download(episode_id, version)
        # Try each
        last_err = None
        for adapter in self.adapters.values():
            try:
                return adapter.download(episode_id, version)
            except AdapterError as e:
                last_err = e
                continue
        raise AdapterError(str(last_err) if last_err else f"download failed for {episode_id}")

# singleton
adapter_manager = AdapterManager()
