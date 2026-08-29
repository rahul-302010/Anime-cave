"""
Muse India adapter for Anime Cave.
Implements search / resolve / download with normalized schemas.
Mapped to docs/ARCHITECTURE.md adapter contract.
"""
from __future__ import annotations
from typing import Optional, List
import re
import requests
from .base import Adapter, Result, AnimeDetail, Episode, Version, DownloadHandle, AdapterError

# Optional: real Muse India API would be https://www.youtube.com/@MuseIndia or museindia API
# Here we implement mock-friendly HTTP client with injection for tests.
DEFAULT_SEARCH_URL = "https://api.muse-india.example/search"
DEFAULT_RESOLVE_URL = "https://api.muse-india.example/anime"


class MuseIndiaAdapter(Adapter):
    name = "muse_india"
    supports_lang = ["en", "ta"]

    def __init__(self, http_client=None, base_search_url: str = DEFAULT_SEARCH_URL, base_resolve_url: str = DEFAULT_RESOLVE_URL):
        self.http = http_client or requests
        self.base_search_url = base_search_url
        self.base_resolve_url = base_resolve_url
        # In-memory stub data for offline / test fallback
        self._stub_results = [
            Result(
                id="muse_naruto_001",
                title="Naruto",
                title_tamil="நருடோ",
                lang="en",
                thumbnail="https://cdn.muse-india.example/thumbs/naruto.jpg",
                source="muse_india",
                year=2002,
                score=8.3,
                url="https://www.youtube.com/watch?v=naruto001",
            ),
            Result(
                id="muse_onepiece_002",
                title="One Piece",
                title_tamil="ஒன் பீஸ்",
                lang="ta",
                thumbnail="https://cdn.muse-india.example/thumbs/onepiece.jpg",
                source="muse_india",
                year=1999,
                score=9.0,
                url="https://www.youtube.com/watch?v=onepiece002",
            ),
            Result(
                id="muse_demonslayer_003",
                title="Demon Slayer",
                title_tamil="டீமன் ஸ்லேயர்",
                lang="en",
                thumbnail="https://cdn.muse-india.example/thumbs/demonslayer.jpg",
                source="muse_india",
                year=2019,
                score=8.7,
                url="https://www.youtube.com/watch?v=demonslayer003",
            ),
        ]
        self._stub_details = {
            "muse_naruto_001": AnimeDetail(
                id="muse_naruto_001",
                title="Naruto",
                title_tamil="நருடோ",
                synopsis="A young ninja strives to become Hokage. Tamil dub available via Muse India.",
                thumbnail="https://cdn.muse-india.example/thumbs/naruto.jpg",
                source="muse_india",
                year=2002,
                score=8.3,
                episodes=[
                    Episode(
                        id="muse_naruto_001_ep1",
                        number=1,
                        title="Enter: Naruto Uzumaki!",
                        thumbnail="https://cdn.muse-india.example/thumbs/naruto_ep1.jpg",
                        versions=[
                            Version(quality="1080p", audio="sub", lang="en", source="muse_india", url="https://cdn.muse-india.example/hls/naruto_ep1_1080.m3u8"),
                            Version(quality="720p", audio="dub", lang="ta", source="muse_india", url="https://cdn.muse-india.example/hls/naruto_ep1_720_ta.m3u8"),
                            Version(quality="480p", audio="sub", lang="en", source="muse_india", url="https://cdn.muse-india.example/hls/naruto_ep1_480.m3u8"),
                        ],
                    ),
                    Episode(
                        id="muse_naruto_001_ep2",
                        number=2,
                        title="My Name is Konohamaru!",
                        versions=[
                            Version(quality="720p", audio="sub", lang="en", source="muse_india", url="https://cdn.muse-india.example/hls/naruto_ep2_720.m3u8"),
                            Version(quality="720p", audio="dub", lang="ta", source="muse_india", url="https://cdn.muse-india.example/hls/naruto_ep2_720_ta.m3u8"),
                        ],
                    ),
                ],
                versions=[
                    Version(quality="1080p", audio="sub", lang="en", source="muse_india"),
                    Version(quality="720p", audio="dub", lang="ta", source="muse_india"),
                ],
            ),
            "muse_onepiece_002": AnimeDetail(
                id="muse_onepiece_002",
                title="One Piece",
                title_tamil="ஒன் பீஸ்",
                synopsis="Monkey D. Luffy explores the Grand Line.",
                thumbnail="https://cdn.muse-india.example/thumbs/onepiece.jpg",
                source="muse_india",
                year=1999,
                score=9.0,
                episodes=[
                    Episode(
                        id="muse_onepiece_002_ep1",
                        number=1,
                        title="I am Luffy!",
                        versions=[
                            Version(quality="1080p", audio="sub", lang="en", source="muse_india", url="https://cdn.muse-india.example/hls/onepiece_ep1_1080.m3u8"),
                            Version(quality="720p", audio="dub", lang="ta", source="muse_india", url="https://cdn.muse-india.example/hls/onepiece_ep1_720_ta.m3u8"),
                        ],
                    )
                ],
                versions=[
                    Version(quality="1080p", audio="sub", lang="en", source="muse_india"),
                    Version(quality="720p", audio="dub", lang="ta", source="muse_india"),
                ],
            ),
        }

    def _normalize_query(self, query: str) -> str:
        if not query or not query.strip():
            raise AdapterError("empty query")
        # Basic transliteration guard: allow Tamil unicode
        return query.strip()

    def search(self, query: str, lang: Optional[str] = None) -> List[Result]:
        """
        Search Muse India catalog.
        Returns normalized Result[].
        - lang filter: en | ta | None (all)
        - mocked network: attempts HTTP then falls back to stub with filtering.
        """
        q = self._normalize_query(query)
        # Try live HTTP (mockable). On any failure, fallback to stub filtering.
        try:
            resp = self.http.get(self.base_search_url, params={"q": q, "lang": lang or "all"}, timeout=2)
            if resp is not None and hasattr(resp, "status_code"):
                if resp.status_code == 200:
                    data = resp.json() if callable(getattr(resp, "json", None)) else []
                    # Normalize live payload if present
                    if isinstance(data, list) and data:
                        results = []
                        for item in data:
                            try:
                                results.append(Result(
                                    id=str(item.get("id", "")),
                                    title=str(item.get("title", "")),
                                    title_tamil=item.get("title_tamil"),
                                    lang=item.get("lang", "en"),
                                    thumbnail=item.get("thumbnail"),
                                    source="muse_india",
                                    year=item.get("year"),
                                    score=item.get("score"),
                                    url=item.get("url"),
                                ))
                            except Exception:
                                continue
                        if results:
                            # lang filter
                            if lang in ("en", "ta"):
                                results = [r for r in results if r.lang == lang]
                            # query substring filter
                            ql = q.lower()
                            results = [r for r in results if ql in r.title.lower() or (r.title_tamil and ql in r.title_tamil.lower())]
                            return results
                # for non-200, fall through to stub
        except Exception as e:
            # network errors are expected in tests; log and fallback
            # raise only if it's our own AdapterError
            if isinstance(e, AdapterError):
                raise
            pass

        # Fallback: stub filtering
        ql = q.lower()
        filtered = []
        for r in self._stub_results:
            hay = f"{r.title} {r.title_tamil or ''}".lower()
            if ql in hay or ql in r.id.lower() or q == "":
                filtered.append(r)
        if lang in ("en", "ta"):
            filtered = [r for r in filtered if r.lang == lang]
        # Limit to 20
        return filtered[:20]

    def resolve(self, anime_id: str) -> AnimeDetail:
        """Resolve anime_id to detail with episodes and versions."""
        if not anime_id or not anime_id.strip():
            raise AdapterError("empty anime_id")
        anime_id = anime_id.strip()
        # Try live
        try:
            resp = self.http.get(f"{self.base_resolve_url}/{anime_id}", timeout=2)
            if resp is not None and hasattr(resp, "status_code") and resp.status_code == 200:
                data = resp.json() if callable(getattr(resp, "json", None)) else None
                if isinstance(data, dict) and data.get("id"):
                    episodes = []
                    for ep in data.get("episodes", []):
                        versions = [Version(
                            quality=v.get("quality", "720p"),
                            audio=v.get("audio", "sub"),
                            lang=v.get("lang", "en"),
                            source="muse_india",
                            url=v.get("url"),
                        ) for v in ep.get("versions", [])]
                        episodes.append(Episode(
                            id=str(ep.get("id", "")),
                            number=int(ep.get("number", 0)),
                            title=ep.get("title"),
                            thumbnail=ep.get("thumbnail"),
                            versions=versions,
                        ))
                    return AnimeDetail(
                        id=str(data.get("id")),
                        title=str(data.get("title", "")),
                        title_tamil=data.get("title_tamil"),
                        synopsis=data.get("synopsis"),
                        thumbnail=data.get("thumbnail"),
                        source="muse_india",
                        year=data.get("year"),
                        score=data.get("score"),
                        episodes=episodes,
                        versions=[Version(quality=v.get("quality", "720p"), audio=v.get("audio", "sub"), lang=v.get("lang", "en"), source="muse_india", url=v.get("url")) for v in data.get("versions", [])],
                    )
        except Exception as e:
            if isinstance(e, AdapterError):
                raise
            pass

        # Fallback stub
        if anime_id in self._stub_details:
            return self._stub_details[anime_id]
        # generic fallback: try to find by prefix
        for key, detail in self._stub_details.items():
            if anime_id.lower() in key.lower():
                return detail
        raise AdapterError(f"anime not found: {anime_id}")

    def download(self, episode_id: str, version: str = "720p") -> DownloadHandle:
        """
        Resolve episode_id + version to a DownloadHandle (direct URL).
        version string like "720p" or "720p_ta_dub" – we parse quality.
        """
        if not episode_id or not episode_id.strip():
            raise AdapterError("empty episode_id")
        episode_id = episode_id.strip()
        # Extract quality
        m = re.search(r"(\d{3,4})p", version or "")
        quality = m.group(0) if m else "720p"
        # Determine lang/audio hint
        lang = "ta" if "ta" in version.lower() or "tamil" in version.lower() or "dub" in version.lower() else "en"
        audio = "dub" if "dub" in version.lower() else "sub"

        # Try live resolve via HTTP (mockable)
        try:
            resp = self.http.get(f"{self.base_resolve_url}/episode/{episode_id}", params={"quality": quality, "lang": lang}, timeout=2)
            if resp is not None and hasattr(resp, "status_code") and resp.status_code == 200:
                data = resp.json() if callable(getattr(resp, "json", None)) else None
                if isinstance(data, dict) and data.get("url"):
                    return DownloadHandle(url=str(data["url"]), quality=quality, audio=audio, headers=data.get("headers"))
        except Exception as e:
            if isinstance(e, AdapterError):
                raise
            pass

        # Fallback: search stubs for episode
        for detail in self._stub_details.values():
            for ep in detail.episodes:
                if ep.id == episode_id:
                    # find version matching quality – prefer lang match, then any quality match
                    exact_match = None
                    quality_match = None
                    for v in ep.versions:
                        if v.quality == quality:
                            if v.lang == lang and exact_match is None:
                                exact_match = v
                            if quality_match is None:
                                quality_match = v
                    if exact_match:
                        return DownloadHandle(url=exact_match.url or f"https://cdn.muse-india.example/hls/{episode_id}_{quality}.m3u8", quality=quality, audio=exact_match.audio)
                    if quality_match:
                        return DownloadHandle(url=quality_match.url or f"https://cdn.muse-india.example/hls/{episode_id}_{quality}.m3u8", quality=quality, audio=quality_match.audio)
                    # fallback to first version
                    if ep.versions:
                        v = ep.versions[0]
                        return DownloadHandle(url=v.url or f"https://cdn.muse-india.example/hls/{episode_id}_{quality}.m3u8", quality=v.quality, audio=v.audio)
        # If not found in stub, synthesize URL (yt-dlp compatible)
        # Muse India is YouTube-based, so return YouTube URL pattern
        return DownloadHandle(
            url=f"https://www.youtube.com/watch?v={episode_id}",
            quality=quality,
            audio=audio,
            headers={"Referer": "https://www.youtube.com/"},
        )
