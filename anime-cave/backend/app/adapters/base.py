"""
Base adapter contract for Anime Cave.
All adapters must implement search / resolve / download and normalize to shared schemas.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, List, Protocol
import abc


@dataclass
class Result:
    """Normalized search result."""
    id: str
    title: str
    title_tamil: Optional[str] = None
    lang: str = "en"  # en | ta
    thumbnail: Optional[str] = None
    source: str = "unknown"
    year: Optional[int] = None
    score: Optional[float] = None
    url: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "title_tamil": self.title_tamil,
            "lang": self.lang,
            "thumbnail": self.thumbnail,
            "source": self.source,
            "year": self.year,
            "score": self.score,
            "url": self.url,
        }


@dataclass
class Version:
    quality: str  # 1080p, 720p, 480p
    audio: str  # sub | dub
    lang: str  # en | ta
    source: str
    url: Optional[str] = None


@dataclass
class Episode:
    id: str
    number: int
    title: Optional[str] = None
    thumbnail: Optional[str] = None
    versions: List[Version] = field(default_factory=list)


@dataclass
class AnimeDetail:
    id: str
    title: str
    title_tamil: Optional[str] = None
    synopsis: Optional[str] = None
    thumbnail: Optional[str] = None
    source: str = "unknown"
    year: Optional[int] = None
    score: Optional[float] = None
    episodes: List[Episode] = field(default_factory=list)
    versions: List[Version] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "title_tamil": self.title_tamil,
            "synopsis": self.synopsis,
            "thumbnail": self.thumbnail,
            "source": self.source,
            "year": self.year,
            "score": self.score,
            "episodes": [
                {
                    "id": e.id,
                    "number": e.number,
                    "title": e.title,
                    "thumbnail": e.thumbnail,
                    "versions": [v.__dict__ for v in e.versions],
                }
                for e in self.episodes
            ],
            "versions": [v.__dict__ for v in self.versions],
        }


@dataclass
class DownloadHandle:
    url: str
    headers: Optional[dict] = None
    quality: Optional[str] = None
    audio: Optional[str] = None


class AdapterError(Exception):
    pass


class Adapter(abc.ABC):
    """Abstract adapter interface."""
    name: str
    supports_lang: List[str] = ["en", "ta"]

    @abc.abstractmethod
    def search(self, query: str, lang: Optional[str] = None) -> List[Result]:
        raise NotImplementedError

    @abc.abstractmethod
    def resolve(self, anime_id: str) -> AnimeDetail:
        raise NotImplementedError

    @abc.abstractmethod
    def download(self, episode_id: str, version: str = "720p") -> DownloadHandle:
        raise NotImplementedError
