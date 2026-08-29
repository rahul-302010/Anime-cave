import { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import Filters from './components/Filters'
import PlayerButton from './components/PlayerButton'
import ThreeHero from './components/ThreeHero'
import { SearchResult, api } from './api/client'

export default function App() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [filters, setFilters] = useState({ lang: 'all', source: 'all', year: 'all', score: 'all' })
  const [lang, setLang] = useState('all')
  const [queue, setQueue] = useState<any[]>([])
  const [showQueue, setShowQueue] = useState(false)

  const filtered = results.filter((r) => {
    if (filters.lang !== 'all' && r.lang !== filters.lang) return false
    if (filters.source !== 'all' && r.source !== filters.source) return false
    if (filters.year !== 'all' && String(r.year) !== filters.year) return false
    if (filters.score !== 'all') {
      const th = parseFloat(filters.score)
      if ((r.score || 0) < th) return false
    }
    return true
  })

  const handleSelect = async (r: SearchResult) => {
    setSelected(r)
    try {
      const d = await api.resolve(r.id)
      setDetail(d)
    } catch {
      setDetail(null)
    }
  }

  // Poll queue
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/download').then((r) => r.json())
        setQueue(res.jobs || [])
      } catch {}
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // WebSocket progress (fallback to poll)
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/progress')
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data.job_id) {
            setQueue((prev) => prev.map((j) => (j.id === data.job_id ? { ...j, progress: data.progress, status: data.status } : j)))
          }
        } catch {}
      }
    } catch {}
    return () => ws?.close()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A12', color: '#EDE9FE', fontFamily: 'Inter, sans-serif' }}>
      <header
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 20px',
          background: 'rgba(18,18,31,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(237,233,254,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.12em', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#00E5CC)', display: 'inline-block' }} />
          ANIME CAVE
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar onResults={setResults} lang={lang} onLangChange={setLang} />
        </div>
        <button
          onClick={() => setShowQueue(!showQueue)}
          style={{ position: 'relative', background: 'transparent', border: '1px solid rgba(237,233,254,0.08)', borderRadius: 10, width: 44, height: 44, cursor: 'pointer', color: '#EDE9FE' }}
        >
          ▦
          {queue.filter((j) => j.status === 'queued' || j.status === 'downloading').length > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, background: '#FF3B82', color: '#fff', borderRadius: 999, fontSize: 11, padding: '2px 6px', minWidth: 18, textAlign: 'center' }}>
              {queue.filter((j) => j.status === 'queued' || j.status === 'downloading').length}
            </span>
          )}
        </button>
      </header>

      <ThreeHero />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px' }}>
        <Filters value={filters} onChange={setFilters} />

        {/* Queue drawer */}
        {showQueue && (
          <div style={{ background: '#1E1E32', border: '1px solid rgba(237,233,254,0.08)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Queue · {queue.length} jobs</div>
            {queue.length === 0 ? (
              <div style={{ color: '#A1A1B5', fontSize: 13 }}>No downloads yet. Queue a version from the player drawer.</div>
            ) : (
              queue.slice(0, 10).map((j: any) => (
                <div key={j.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(237,233,254,0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{j.episode_id}</div>
                    <div style={{ fontSize: 11, color: '#A1A1B5' }}>{j.version} · {j.status}</div>
                    <div style={{ height: 4, background: 'rgba(237,233,254,0.08)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${j.progress || 0}%`, height: '100%', background: '#7C3AED', transition: 'width 300ms linear' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: j.status === 'done' ? '#10B981' : j.status === 'failed' ? '#FF3B82' : '#F59E0B' }}>{j.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Results grid */}
        {filtered.length === 0 && results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#A1A1B5' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#EDE9FE' }}>Search anime — English or Tamil</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>Try “Naruto”, “One Piece”, or “நருடோ”. Use filters to narrow by language.</div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {['Naruto', 'One Piece', 'Demon Slayer'].map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    const d = await api.search(s)
                    setResults(d.results)
                  }}
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#EDE9FE', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 999, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#A1A1B5' }}>No results for current filters. <button onClick={() => setFilters({ lang: 'all', source: 'all', year: 'all', score: 'all' })} style={{ color: '#00E5CC', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 16 }}>
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelect(r)}
                style={{
                  background: '#12121F',
                  border: '1px solid rgba(237,233,254,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border 180ms, transform 180ms, box-shadow 180ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.3)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(124,58,237,0.15)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(237,233,254,0.08)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '2/3', background: '#1E1E32', overflow: 'hidden' }}>
                  <img src={r.thumbnail} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  {r.score !== undefined && r.score >= 7.5 && (
                    <span style={{ position: 'absolute', top: 8, right: 8, background: '#FF3B82', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 999, fontWeight: 600 }}>{r.score}</span>
                  )}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</div>
                  {r.title_tamil && <div style={{ fontSize: 12, color: '#A1A1B5', lineHeight: 1.6 }}>{r.title_tamil}</div>}
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>{r.year}</span>·<span>{r.source}</span>
                    <span style={{ border: r.lang === 'ta' ? '1px solid #00E5CC' : '1px solid rgba(237,233,254,0.08)', color: r.lang === 'ta' ? '#00E5CC' : '#A1A1B5', padding: '1px 6px', borderRadius: 999, fontSize: 11 }}>{r.lang === 'ta' ? 'தமிழ்' : 'EN'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player drawer */}
        {selected && (
          <div style={{ marginTop: 24, background: '#12121F', border: '1px solid rgba(237,233,254,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid rgba(237,233,254,0.06)' }}>
              <img src={selected.thumbnail} alt="" style={{ width: 120, height: 180, borderRadius: 12, objectFit: 'cover', background: '#1E1E32' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>{selected.title}</div>
                {selected.title_tamil && <div style={{ fontSize: 16, color: '#A1A1B5', lineHeight: 1.6 }}>{selected.title_tamil}</div>}
                <div style={{ fontSize: 13, color: '#A1A1B5', marginTop: 6 }}>{selected.year} · {selected.source} · Score {selected.score}</div>
                {detail?.synopsis && <div style={{ fontSize: 13, color: '#A1A1B5', marginTop: 10, lineHeight: 1.5 }}>{detail.synopsis}</div>}
                <div style={{ marginTop: 16 }}>
                  <PlayerButton animeId={selected.id} episodeId={detail?.episodes?.[0]?.id} />
                </div>
              </div>
            </div>
            {detail?.episodes && (
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>Episodes & Versions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.episodes.map((ep: any) => (
                    <div key={ep.id} style={{ background: '#1E1E32', borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 120 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>EP {ep.number}</div>
                        <div style={{ fontSize: 12, color: '#A1A1B5' }}>{ep.title}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                        {ep.versions.map((v: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#12121F', borderLeft: idx === 0 ? '3px solid #00E5CC' : '3px solid transparent', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>
                            <span style={{ color: '#EDE9FE' }}>{v.quality}</span>
                            <span style={{ color: v.audio === 'dub' ? '#00E5CC' : '#A1A1B5' }}>{v.audio}</span>
                            <span style={{ color: '#6B7280' }}>{v.lang}</span>
                            <PlayerButton episodeId={ep.id} version={`${v.quality}${v.lang === 'ta' ? '_ta_dub' : ''}`} label="Play" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: 20, color: '#6B7280', fontSize: 12, borderTop: '1px solid rgba(237,233,254,0.06)', marginTop: 40 }}>
        Anime Cave · Local-first · 127.0.0.1 only · Tamil + English parity
      </footer>
    </div>
  )
}
