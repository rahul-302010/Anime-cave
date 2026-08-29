"""
Unit tests for MuseIndiaAdapter – mocks network and validates normalized schema.
Run: pytest backend/tests/adapters/test_muse_india.py -v
"""
import pytest
from unittest.mock import Mock, MagicMock
from app.adapters.muse_india import MuseIndiaAdapter
from app.adapters.base import AdapterError


class FakeResponse:
    def __init__(self, json_data, status_code=200):
        self._json = json_data
        self.status_code = status_code
    def json(self):
        return self._json


def test_search_normalizes_and_filters_lang():
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse([
        {"id": "muse_test_01", "title": "Naruto Tamil Dub", "lang": "ta", "year": 2002, "score": 8.3},
        {"id": "muse_test_02", "title": "Naruto English Sub", "lang": "en", "year": 2002, "score": 8.3},
    ], 200)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    results = adapter.search("naruto", lang="ta")
    assert len(results) == 1
    assert results[0].lang == "ta"
    assert results[0].source == "muse_india"
    assert results[0].id == "muse_test_01"
    # Verify schema fields present
    for r in results:
        d = r.to_dict()
        assert "id" in d and "title" in d and "source" in d
        assert d["source"] == "muse_india"


def test_search_fallback_to_stub_on_network_failure():
    mock_http = Mock()
    mock_http.get.side_effect = Exception("network down")
    adapter = MuseIndiaAdapter(http_client=mock_http)
    results = adapter.search("Naruto")
    assert len(results) >= 1
    assert any("naruto" in r.title.lower() for r in results)


def test_search_empty_query_raises():
    adapter = MuseIndiaAdapter(http_client=Mock())
    with pytest.raises(AdapterError):
        adapter.search("")
    with pytest.raises(AdapterError):
        adapter.search("   ")


def test_search_stub_lang_filter():
    mock_http = Mock()
    mock_http.get.side_effect = Exception("fail")
    adapter = MuseIndiaAdapter(http_client=mock_http)
    en_results = adapter.search("One Piece", lang="en")
    # stub has One Piece with lang ta, so en filter should return 0 for that query
    # but Naruto en should return 1
    naruto_en = adapter.search("naruto", lang="en")
    assert len(naruto_en) == 1
    assert naruto_en[0].lang == "en"


def test_resolve_returns_normalized_detail():
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse(None, 404)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    detail = adapter.resolve("muse_naruto_001")
    assert detail.id == "muse_naruto_001"
    assert detail.source == "muse_india"
    assert len(detail.episodes) >= 1
    assert detail.episodes[0].number == 1
    assert len(detail.episodes[0].versions) >= 1
    # validate to_dict
    d = detail.to_dict()
    assert "episodes" in d and "versions" in d


def test_resolve_not_found_raises():
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse(None, 404)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    with pytest.raises(AdapterError):
        adapter.resolve("nonexistent_999")


def test_resolve_with_live_mock():
    live_data = {
        "id": "muse_live_001",
        "title": "Live Anime",
        "title_tamil": "லைவ்",
        "year": 2024,
        "score": 8.0,
        "episodes": [
            {"id": "ep1", "number": 1, "title": "Episode 1", "versions": [{"quality": "1080p", "audio": "sub", "lang": "en", "url": "https://cdn.example/ep1.m3u8"}]}
        ],
        "versions": [{"quality": "1080p", "audio": "sub", "lang": "en", "url": "https://cdn.example/ep1.m3u8"}]
    }
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse(live_data, 200)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    detail = adapter.resolve("muse_live_001")
    assert detail.title == "Live Anime"
    assert detail.episodes[0].id == "ep1"


def test_download_returns_handle_with_url():
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse(None, 404)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    handle = adapter.download("muse_naruto_001_ep1", version="720p")
    assert handle.url is not None
    assert "http" in handle.url
    assert handle.quality == "720p"


def test_download_parses_tamil_dub_version():
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse(None, 404)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    handle = adapter.download("muse_naruto_001_ep1", version="720p_ta_dub")
    assert handle.quality == "720p"
    assert handle.url is not None


def test_download_live_mock_returns_direct_url():
    mock_http = Mock()
    mock_http.get.return_value = FakeResponse({"url": "https://cdn.example/direct.m3u8", "headers": {"Referer": "https://example.com"}}, 200)
    adapter = MuseIndiaAdapter(http_client=mock_http)
    handle = adapter.download("muse_naruto_001_ep1", version="1080p")
    assert handle.url == "https://cdn.example/direct.m3u8"


def test_download_empty_episode_raises():
    adapter = MuseIndiaAdapter(http_client=Mock())
    with pytest.raises(AdapterError):
        adapter.download("")
    with pytest.raises(AdapterError):
        adapter.download("   ")


def test_search_tamil_query():
    mock_http = Mock()
    mock_http.get.side_effect = Exception("fail")
    adapter = MuseIndiaAdapter(http_client=mock_http)
    results = adapter.search("நருடோ")
    # stub title_tamil contains Tamil, should match
    assert len(results) >= 1
