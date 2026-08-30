/**
 * Anime routes - proxy to AniList with caching and security
 * file: backend/src/routes/anime.js:1
 */
import express from "express";
import { fetchTrending, searchAnime, fetchAnimeDetail } from "../services/anilist.js";
import { getEpisodeCatalog } from "../services/episodeCatalog.js";
import { getCache, setCache } from "../utils/cache.js";

const router = express.Router();

// GET /api/anime/trending?page=1&perPage=20
router.get("/trending", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.perPage) || 20));
    const key = `trending:${page}:${perPage}`;
    const cached = getCache(key);
    if (cached) return res.json({ ...cached, cached: true });

    const data = await fetchTrending(page, perPage);
    const payload = { ...data, cached: false };
    setCache(key, payload, 5 * 60 * 1000);
    res.json(payload);
  } catch (e) {
    console.error("[trending]", e);
    res.status(500).json({ error: "Failed to fetch trending", details: e.message });
  }
});

// GET /api/anime/search?query=naruto&page=1
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.query || req.query.q || "").trim();
    if (!q || q.length < 2) return res.status(400).json({ error: "query must be >=2 chars" });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.perPage) || 20));
    const key = `search:${q}:${page}:${perPage}`;
    const cached = getCache(key);
    if (cached) return res.json({ ...cached, cached: true });

    const data = await searchAnime(q, page, perPage);
    const payload = { ...data, cached: false };
    setCache(key, payload, 3 * 60 * 1000);
    res.json(payload);
  } catch (e) {
    console.error("[search]", e);
    res.status(500).json({ error: "Search failed", details: e.message });
  }
});

// GET /api/anime/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid id" });
    const key = `detail:${id}`;
    const cached = getCache(key);
    if (cached) return res.json({ ...cached, cached: true });

    const media = await fetchAnimeDetail(id);
    if (!media) return res.status(404).json({ error: "Not found" });
    const payload = { ...media, cached: false };
    setCache(key, payload, 10 * 60 * 1000);
    res.json(payload);
  } catch (e) {
    console.error("[detail]", e);
    res.status(500).json({ error: "Failed to fetch detail", details: e.message });
  }
});

// GET /api/anime/:id/episodes
router.get("/:id/episodes", async (req, res) => {
  try {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid id" });
    // need media to build catalog (for title/genres/popularity)
    let media = getCache(`detail:${id}`);
    if (media && media.cached !== undefined) {
      // unwrap cached wrapper
      media = media.id ? media : null;
    }
    if (!media || !media.id) {
      try { media = await fetchAnimeDetail(id); } catch { media = { id, title: { romaji: `Anime ${id}` } }; }
    }
    const catalog = getEpisodeCatalog(id, media);
    res.json(catalog);
  } catch (e) {
    console.error("[episodes]", e);
    res.status(500).json({ error: "Failed to fetch episodes", details: e.message });
  }
});

export default router;
