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

DEFAULT_SEARCH_URL = "https://api.muse-india.example/search"
DEFAULT_RESOLVE_URL = "https://api.muse-india.example/anime"


class MuseIndiaAdapter(Adapter):
    name = "muse_india"
    supports_lang = ["en", "ta"]

    def __init__(self, http_client=None, base_search_url: str = DEFAULT_SEARCH_URL, base_resolve_url: str = DEFAULT_RESOLVE_URL):
        self.http = http_client or requests
        self.base_search_url = base_search_url
        self.base_resolve_url = base_resolve_url
        SAMPLE_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        SAMPLE_MP4 = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        # All thumbnails use placehold.co (200 OK) until real Muse India CDN is wired
        self._stub_results = [
            Result(id="muse_solo_001", title="Solo Leveling", title_tamil="சோலோ லெவலிங்", lang="en", thumbnail="https://placehold.co/300x450/1A0B2E/8B5CF6?text=Solo+Leveling", source="muse_india", year=2024, score=8.9, url="https://www.youtube.com/watch?v=lS_qe0N2a4k"),
            Result(id="muse_jujutsu_002", title="Jujutsu Kaisen S2", title_tamil="ஜுஜுட்சு கைசென்", lang="en", thumbnail="https://placehold.co/300x450/0F172A/38BDF8?text=Jujutsu+Kaisen", source="muse_india", year=2023, score=8.8, url="https://www.youtube.com/watch?v=YKJyP8L6QEs"),
            Result(id="muse_demonslayer_003", title="Demon Slayer", title_tamil="டீமன் ஸ்லேயர்", lang="en", thumbnail="https://placehold.co/300x450/422006/F43F5E?text=Demon+Slayer", source="muse_india", year=2019, score=8.7, url="https://www.youtube.com/watch?v=x7uLq7_0-2Q"),
            Result(id="muse_onepiece_002", title="One Piece", title_tamil="ஒன் பீஸ்", lang="ta", thumbnail="https://placehold.co/300x450/0E1A2B/00E5CC?text=One+Piece", source="muse_india", year=1999, score=9.0, url="https://www.youtube.com/watch?v=8Qn_spdM5Zg"),
            Result(id="muse_naruto_001", title="Naruto: Shippuden", title_tamil="நருடோ", lang="en", thumbnail="https://placehold.co/300x450/1E1E32/F97316?text=Naruto", source="muse_india", year=2007, score=8.6, url="https://www.youtube.com/watch?v=QkWS9y5LxHg"),
            Result(id="muse_aot_004", title="Attack on Titan", title_tamil="அட்டாக் ஆன் டைட்டன்", lang="en", thumbnail="https://placehold.co/300x450/1C1917/A3A3A3?text=Attack+on+Titan", source="muse_india", year=2013, score=9.1, url="https://www.youtube.com/watch?v=MGRm4IzK1SQ"),
            Result(id="muse_opm_005", title="One Punch Man S3", title_tamil="ஒன் பஞ்ச் மேன்", lang="en", thumbnail="https://placehold.co/300x450/3F1D1D/FBBF24?text=One+Punch+Man", source="muse_india", year=2024, score=8.2, url="https://www.youtube.com/watch?v=2JAElThbKr0"),
            Result(id="muse_frieren_006", title="Frieren: Beyond Journey's End", title_tamil="பிரீரன்", lang="en", thumbnail="https://placehold.co/300x450/1E293B/C4B5FD?text=Frieren", source="muse_india", year=2023, score=9.0, url="https://www.youtube.com/watch?v=Iwr1aLEDpe4"),
            Result(id="muse_chainsaw_007", title="Chainsaw Man", title_tamil="செயின்சா மேன்", lang="en", thumbnail="https://placehold.co/300x450/2D0A0A/EF4444?text=Chainsaw+Man", source="muse_india", year=2022, score=8.5, url="https://www.youtube.com/watch?v=l96zmDlWCBk"),
        ]
        self._stub_details = {
            "muse_solo_001": AnimeDetail(id="muse_solo_001", title="Solo Leveling", title_tamil="சோலோ லெவலிங்", synopsis="The gates have opened and the hunters must rise. The shadow monarch awakens. Season 2.", thumbnail="https://placehold.co/300x450/1A0B2E/8B5CF6?text=Solo+Leveling", source="muse_india", year=2024, score=8.9, episodes=[
                Episode(id="muse_solo_001_ep7", number=7, title="The Beginning After the End", thumbnail="https://placehold.co/300x450/1A0B2E/8B5CF6?text=S2-E7", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
                Episode(id="muse_solo_001_ep8", number=8, title="The Shadow Monarch", thumbnail="https://placehold.co/300x450/1A0B2E/8B5CF6?text=S2-E8", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS), Version(quality="480p", audio="sub", lang="en", source="muse_india", url=SAMPLE_MP4)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
            "muse_jujutsu_002": AnimeDetail(id="muse_jujutsu_002", title="Jujutsu Kaisen S2", title_tamil="ஜுஜுட்சு கைசென்", synopsis="Cursed spirits and jujutsu sorcerers collide.", thumbnail="https://placehold.co/300x450/0F172A/38BDF8?text=Jujutsu+Kaisen", source="muse_india", year=2023, score=8.8, episodes=[
                Episode(id="muse_jujutsu_002_ep20", number=20, title="Thunderclap", thumbnail="https://placehold.co/300x450/0F172A/38BDF8?text=EP20", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            "muse_demonslayer_003": AnimeDetail(id="muse_demonslayer_003", title="Demon Slayer", title_tamil="டீமன் ஸ்லேயர்", synopsis="Tanjiro hunts demons to save his sister.", thumbnail="https://placehold.co/300x450/422006/F43F5E?text=Demon+Slayer", source="muse_india", year=2019, score=8.7, episodes=[
                Episode(id="muse_demonslayer_003_ep8", number=8, title="The Smell of Enchanting Blood", thumbnail="https://placehold.co/300x450/422006/F43F5E?text=EP8", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            "muse_naruto_001": AnimeDetail(id="muse_naruto_001", title="Naruto: Shippuden", title_tamil="நருடோ", synopsis="A young ninja strives to become Hokage. Tamil dub via Muse India.", thumbnail="https://placehold.co/300x450/1E1E32/F97316?text=Naruto", source="muse_india", year=2007, score=8.6, episodes=[
                Episode(id="muse_naruto_001_ep1", number=1, title="Enter: Naruto Uzumaki!", thumbnail="https://placehold.co/300x450/1E1E32/F97316?text=EP1", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS), Version(quality="480p", audio="sub", lang="en", source="muse_india", url=SAMPLE_MP4)]),
                Episode(id="muse_naruto_001_ep500", number=500, title="The Message", thumbnail="https://placehold.co/300x450/1E1E32/F97316?text=EP500", versions=[Version(quality="720p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
            "muse_onepiece_002": AnimeDetail(id="muse_onepiece_002", title="One Piece", title_tamil="ஒன் பீஸ்", synopsis="Monkey D. Luffy explores the Grand Line.", thumbnail="https://placehold.co/300x450/0E1A2B/00E5CC?text=One+Piece", source="muse_india", year=1999, score=9.0, episodes=[
                Episode(id="muse_onepiece_002_ep1", number=1, title="I am Luffy!", thumbnail="https://placehold.co/300x450/0E1A2B/00E5CC?text=EP1", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
                Episode(id="muse_onepiece_002_ep1126", number=1126, title="The Final Saga Begins", thumbnail="https://placehold.co/300x450/0E1A2B/00E5CC?text=EP1126", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS), Version(quality="720p", audio="dub", lang="ta", source="muse_india", url=SAMPLE_HLS)]),
            "muse_aot_004": AnimeDetail(id="muse_aot_004", title="Attack on Titan", title_tamil="அட்டாக் ஆன் டைட்டன்", synopsis="Humanity fights titans.", thumbnail="https://placehold.co/300x450/1C1917/A3A3A3?text=Attack+on+Titan", source="muse_india", year=2013, score=9.1, episodes=[
                Episode(id="muse_aot_004_ep89", number=89, title="The Final Chapters", thumbnail="https://placehold.co/300x450/1C1917/A3A3A3?text=EP89", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            "muse_opm_005": AnimeDetail(id="muse_opm_005", title="One Punch Man S3", title_tamil="ஒன் பஞ்ச் மேன்", synopsis="Saitama seeks a worthy opponent.", thumbnail="https://placehold.co/300x450/3F1D1D/FBBF24?text=One+Punch+Man", source="muse_india", year=2024, score=8.2, episodes=[
                Episode(id="muse_opm_005_ep7", number=7, title="The Strongest Hero", thumbnail="https://placehold.co/300x450/3F1D1D/FBBF24?text=EP7", versions=[Version(quality="720p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="720p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            "muse_frieren_006": AnimeDetail(id="muse_frieren_006", title="Frieren: Beyond Journey's End", title_tamil="பிரீரன்", synopsis="Elf mage reflects on time after hero's death.", thumbnail="https://placehold.co/300x450/1E293B/C4B5FD?text=Frieren", source="muse_india", year=2023, score=9.0, episodes=[
                Episode(id="muse_frieren_006_ep26", number=26, title="A New Journey", thumbnail="https://placehold.co/300x450/1E293B/C4B5FD?text=EP26", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            "muse_chainsaw_007": AnimeDetail(id="muse_chainsaw_007", title="Chainsaw Man", title_tamil="செயின்சா மேன்", synopsis="Denji becomes Chainsaw Man.", thumbnail="https://placehold.co/300x450/2D0A0A/EF4444?text=Chainsaw+Man", source="muse_india", year=2022, score=8.5, episodes=[
                Episode(id="muse_chainsaw_007_ep5", number=5, title="Gun Devil", thumbnail="https://placehold.co/300x450/2D0A0A/EF4444?text=EP5", versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
            ], versions=[Version(quality="1080p", audio="sub", lang="en", source="muse_india", url=SAMPLE_HLS)]),
        }

    def _normalize_query(self, query: str) -> str:
        if not query or not query.strip():
            raise AdapterError("empty query")
        return query.strip()

    def search(self, query: str, lang: Optional[str] = None) -> List[Result]:
        q = self._normalize_query(query)
        # Special trending/popular/empty-all handling for UI hero + explore
        if q.lower() in ("trending", "popular", "all", "explore", "*"):
            results = list(self._stub_results)
            if lang in ("en", "ta"):
                results = [r for r in results if r.lang == lang]
            return results[:20]
        try:
            resp = self.http.get(self.base_search_url, params={"q": q, "lang": lang or "all"}, timeout=2)
            if resp is not None and hasattr(resp, "status_code"):
                if resp.status_code == 200:
                    data = resp.json() if callable(getattr(resp, "json", None)) else []
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
                            if lang in ("en", "ta"):
                                results = [r for r in results if r.lang == lang]
                            ql = q.lower()
                            results = [r for r in results if ql in r.title.lower() or (r.title_tamil and ql in r.title_tamil.lower())]
                            return results
        except Exception as e:
            if isinstance(e, AdapterError):
                raise
            pass
        ql = q.lower()
        filtered = []
        for r in self._stub_results:
            hay = f"{r.title} {r.title_tamil or ''}".lower()
            if ql in hay or ql in r.id.lower() or q == "":
                filtered.append(r)
            # also match partial for popular names
            # if query is single char 'a' etc, fallback to all to avoid empty hero
            if len(ql) == 1 and ql in hay:
                pass
        # If single-char search yields 0, return all for better UX (explore page)
        if not filtered and len(ql) <= 2:
            filtered = list(self._stub_results)
        if lang in ("en", "ta"):
            filtered = [r for r in filtered if r.lang == lang]
        return filtered[:20]

    def resolve(self, anime_id: str) -> AnimeDetail:
        if not anime_id or not anime_id.strip():
            raise AdapterError("empty anime_id")
        anime_id = anime_id.strip()
        try:
            resp = self.http.get(f"{self.base_resolve_url}/{anime_id}", timeout=2)
            if resp is not None and hasattr(resp, "status_code") and resp.status_code == 200:
                data = resp.json() if callable(getattr(resp, "json", None)) else None
                if isinstance(data, dict) and data.get("id"):
                    episodes = []
                    for ep in data.get("episodes", []):
                        versions = [Version(quality=v.get("quality", "720p"), audio=v.get("audio", "sub"), lang=v.get("lang", "en"), source="muse_india", url=v.get("url")) for v in ep.get("versions", [])]
                        episodes.append(Episode(id=str(ep.get("id", "")), number=int(ep.get("number", 0)), title=ep.get("title"), thumbnail=ep.get("thumbnail"), versions=versions))
                    return AnimeDetail(id=str(data.get("id")), title=str(data.get("title", "")), title_tamil=data.get("title_tamil"), synopsis=data.get("synopsis"), thumbnail=data.get("thumbnail"), source="muse_india", year=data.get("year"), score=data.get("score"), episodes=episodes, versions=[Version(quality=v.get("quality", "720p"), audio=v.get("audio", "sub"), lang=v.get("lang", "en"), source="muse_india", url=v.get("url")) for v in data.get("versions", [])])
        except Exception as e:
            if isinstance(e, AdapterError):
                raise
            pass
        if anime_id in self._stub_details:
            return self._stub_details[anime_id]
        for key, detail in self._stub_details.items():
            if anime_id.lower() in key.lower():
                return detail
        raise AdapterError(f"anime not found: {anime_id}")

    def download(self, episode_id: str, version: str = "720p") -> DownloadHandle:
        if not episode_id or not episode_id.strip():
            raise AdapterError("empty episode_id")
        episode_id = episode_id.strip()
        m = re.search(r"(\d{3,4})p", version or "")
        quality = m.group(0) if m else "720p"
        lang = "ta" if "ta" in version.lower() or "tamil" in version.lower() or "dub" in version.lower() else "en"
        audio = "dub" if "dub" in version.lower() else "sub"
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
        for detail in self._stub_details.values():
            for ep in detail.episodes:
                if ep.id == episode_id:
                    exact_match = None
                    quality_match = None
                    for v in ep.versions:
                        if v.quality == quality:
                            if v.lang == lang and exact_match is None:
                                exact_match = v
                            if quality_match is None:
                                quality_match = v
                    if exact_match:
                        return DownloadHandle(url=exact_match.url or "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", quality=quality, audio=exact_match.audio)
                    if quality_match:
                        return DownloadHandle(url=quality_match.url or "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", quality=quality, audio=quality_match.audio)
                    if ep.versions:
                        v = ep.versions[0]
                        return DownloadHandle(url=v.url or "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", quality=v.quality, audio=v.audio)
        return DownloadHandle(url="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", quality=quality, audio=audio, headers={"Referer": "https://www.youtube.com/"})
