# ADAPTERS

> Adapter interface and Muse India implementation notes.

## Adapter Contract (all adapters)
```python
class Adapter:
    name: str
    def search(self, query: str, lang: str|None) -> list[Result]: ...
    def resolve(self, anime_id: str) -> AnimeDetail: ...
    def download(self, episode_id: str, version: str) -> DownloadHandle: ...
```

- `Result`: `{id, title, title_tamil, lang, thumbnail, source, year, score, url}`
- `AnimeDetail`: `{id, title, episodes[], versions[]}` where version = `{quality, audio, lang, source, url}`
- Errors raise `AdapterError`.

## Muse India Adapter (`muse_india`)

**Source:** Muse India YouTube channel + CDN fallback. Tamil dubs are first-class.

### Sample Inputs / Outputs

**search("naruto", lang="en") ->**
```json
[
  {
    "id": "muse_naruto_001",
    "title": "Naruto",
    "title_tamil": "நருடோ",
    "lang": "en",
    "thumbnail": "https://cdn.muse-india.example/thumbs/naruto.jpg",
    "source": "muse_india",
    "year": 2002,
    "score": 8.3,
    "url": "https://www.youtube.com/watch?v=naruto001"
  }
]
```

**search("நருடோ", lang="ta") ->** same shape, matches `title_tamil`.

**resolve("muse_naruto_001") ->**
```json
{
  "id": "muse_naruto_001",
  "title": "Naruto",
  "episodes": [
    {
      "id": "muse_naruto_001_ep1",
      "number": 1,
      "title": "Enter: Naruto Uzumaki!",
      "versions": [
        {"quality": "1080p", "audio": "sub", "lang": "en", "source": "muse_india", "url": "https://cdn.muse-india.example/hls/naruto_ep1_1080.m3u8"},
        {"quality": "720p", "audio": "dub", "lang": "ta", "source": "muse_india", "url": "https://cdn.muse-india.example/hls/naruto_ep1_720_ta.m3u8"}
      ]
    }
  ],
  "versions": [
    {"quality": "1080p", "audio": "sub", "lang": "en", "source": "muse_india"},
    {"quality": "720p", "audio": "dub", "lang": "ta", "source": "muse_india"}
  ]
}
```

**download("muse_naruto_001_ep1", version="720p_ta_dub") ->**
```json
{
  "url": "https://cdn.muse-india.example/hls/naruto_ep1_720_ta.m3u8",
  "quality": "720p",
  "audio": "dub",
  "headers": {"Referer": "https://www.youtube.com/"}
}
```

### Mock & Test Notes
- Adapter accepts `http_client` injection; tests pass a Mock with `.get()`.
- On network failure (timeout/exception or non-200) falls back to in-memory stubs.
- Tamil queries match `title_tamil`; `lang` filter is applied post-normalization.
- Empty query/episode_id raises `AdapterError`.

### Checklist
- [x] search/resolve/download implemented
- [x] Normalized schema validated via unit tests
- [x] Network mocked in tests, no live hits
- [x] Tamil parity tested
