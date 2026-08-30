/**
 * API client - all requests go through backend (no direct AniList from frontend)
 * file: frontend/src/api/client.js:1
 */
const BASE = import.meta.env.VITE_API_URL || ""; // vite proxy handles /api -> 4000

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text();
    let json;
    try { json = JSON.parse(txt); } catch { json = { error: txt }; }
    throw new Error(json.error || json.details || `HTTP ${res.status}`);
  }
  // handle streams vs json
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

export const api = {
  health: () => request("/api/health"),
  trending: (page = 1, perPage = 20) => request(`/api/anime/trending?page=${page}&perPage=${perPage}`),
  search: (query, page = 1, perPage = 20) => request(`/api/anime/search?query=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}`),
  detail: (id) => request(`/api/anime/${id}`),
  episodes: (id) => request(`/api/anime/${id}/episodes`),
  versions: () => request(`/api/versions`),
  library: () => request(`/api/downloads/library`),
  streamUrl: (fileName) => `${BASE}/api/downloads/stream/${encodeURIComponent(fileName)}`,
  subtitleUrl: (fileName) => `${BASE}/api/subtitles/${encodeURIComponent(fileName)}`,
  download: (url, fileName, quality) => request("/api/downloads/request", {
    method: "POST",
    body: JSON.stringify({ url, fileName, quality, sourceType: "local" }),
  }),
  downloadOwned: (animeName, episodeNumber, version, quality) => request("/api/downloads/request", {
    method: "POST",
    body: JSON.stringify({ animeName, episodeNumber, version, quality, sourceType: "local" }),
  }),
  downloadStructured: (animeName, episodeNumber, version, quality, url) => request("/api/downloads/request", {
    method: "POST",
    body: JSON.stringify({ animeName, episodeNumber, version, quality, url, sourceType: "local" }),
  }),
  deleteDownload: (fileName) => request(`/api/downloads/${encodeURIComponent(fileName)}`, { method: "DELETE" }),
};
