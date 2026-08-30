/**
 * Simple in-memory cache with TTL - avoids spamming AniList
 * file: backend/src/utils/cache.js:1
 */
const store = new Map();

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = 5 * 60 * 1000) {
  store.set(key, { value, expiry: Date.now() + ttlMs });
}

export function clearCache() {
  store.clear();
}
