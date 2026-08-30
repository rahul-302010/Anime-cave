/**
 * API client for Anime Cave backend.
 * All endpoints bind to 127.0.0.1:8000 per ARCHITECTURE.md
 */
const BASE = (import.meta as any).env?.VITE_API_BASE || ''

export type SearchResult = {
  id: string
  title: string
  title_tamil?: string
  lang: string
  thumbnail?: string
  source: string
  year?: number
  score?: number
  url?: string
}

export type AnimeDetail = {
  id: string
  title: string
  title_tamil?: string
  synopsis?: string
  thumbnail?: string
  source: string
  year?: number
  score?: number
  episodes: Array<{
    id: string
    number: number
    title?: string
    thumbnail?: string
    versions: Array<{ quality: string; audio: string; lang: string; source: string; url?: string }>
  }>
  versions: Array<{ quality: string; audio: string; lang: string; source: string; url?: string }>
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${txt}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  search: (q: string, lang?: string, source?: string) => {
    const p = new URLSearchParams({ q })
    if (lang) p.set('lang', lang)
    if (source) p.set('source', source)
    return req<{ query: string; count: number; results: SearchResult[] }>(`/api/search?${p.toString()}`)
  },
  resolve: (id: string) => req<AnimeDetail>(`/api/resolve?id=${encodeURIComponent(id)}`),
  download: (episode_id: string, version = '720p', anime_id?: string) =>
    req<{ jobId: string; status: string }>(`/api/download`, {
      method: 'POST',
      body: JSON.stringify({ episode_id, version, anime_id }),
    }),
  play: (params: { id?: string; episode_id?: string; version?: string; player?: string }) => {
    const p = new URLSearchParams()
    if (params.id) p.set('id', params.id)
    if (params.episode_id) p.set('episode_id', params.episode_id)
    if (params.version) p.set('version', params.version)
    if (params.player) p.set('player', params.player)
    return req<{ playUrl: string; player: string; launched?: boolean }>(`/api/player/play?${p.toString()}`)
  },
  playPost: (body: { id?: string; episode_id?: string; version?: string; player?: string }) =>
    req<{ playUrl: string; player: string }>(`/api/player/play`, { method: 'POST', body: JSON.stringify(body) }),
  networkConfig: () => req<Record<string, any>>(`/api/network/config`),
  networkStatus: () => req<Record<string, any>>(`/api/network/status`),
  wsProgressUrl: () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/progress`,
}
