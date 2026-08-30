import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import FilterBar from './components/FilterBar'
import AnimeCard from './components/AnimeCard'
import ContinueWatching from './components/ContinueWatching'
import { QuickActions, DownloadQueue, NetworkStatus } from './components/RightSidebar'
import VideoPlayer from './components/VideoPlayer'
import { api, SearchResult } from './api/client'

export default function App() {
  const [activeNav, setActiveNav] = useState('explore')
  const [results, setResults] = useState<SearchResult[]>([])
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggest, setSuggest] = useState<SearchResult[]>([])
  const [tab, setTab] = useState('All')
  const [genre, setGenre] = useState('all')
  const [year, setYear] = useState('all')
  const [lang, setLang] = useState('all')
  const [headerLang, setHeaderLang] = useState('EN')
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [playSrc, setPlaySrc] = useState<string | null>(null)
  const [queueCount, setQueueCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('ac_watchlist') || '[]')))
  const [continueItems] = useState([
    { id: 'solo', title: 'Solo Leveling', sub: 'S2 • Ep 7', img: 'https://placehold.co/120x120/1A0B2E/8B5CF6?text=Solo', progress: 72, ep: 'muse_solo_001_ep7' },
    { id: 'frieren', title: 'Frieren: Beyond Journey’s End', sub: 'Ep 26', img: 'https://placehold.co/120x120/1E293B/C4B5FD?text=Frieren', progress: 41, ep: 'muse_frieren_006_ep26' },
    { id: 'chainsaw', title: 'Chainsaw Man', sub: 'Ep 5', img: 'https://placehold.co/120x120/2D0A0A/EF4444?text=CM', progress: 78, ep: 'muse_chainsaw_007_ep5' },
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | null>(null)

  // initial load trending
  useEffect(() => {
    api.search('trending').then((d) => setResults(d.results)).catch(() => {})
  }, [])

  // polling queue count for badge
  useEffect(() => {
    const fet = async () => {
      try {
        const res = await fetch('/api/download').then((r) => r.json())
        setQueueCount((res.jobs || []).filter((j: any) => j.status === 'queued' || j.status === 'downloading').length)
      } catch {}
    }
    fet()
    const id = setInterval(fet, 2500)
    return () => clearInterval(id)
  }, [])

  // search debounce header
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSuggest([])
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const data = await api.search(q, lang === 'all' ? undefined : headerLang === 'தமிழ்' ? 'ta' : 'en')
        setSuggest(data.results.slice(0, 5))
        setResults(data.results)
      } catch {}
    }, 250)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [q])

  // Ctrl K focus
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const showToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = results.filter((r) => {
    if (tab !== 'All') {
      // naive: Movies tab hides series, etc — for demo just pass through if All else show all too to avoid empty
    }
    if (year !== 'all' && String(r.year) !== year) return false
    if (lang !== 'all' && lang !== 'All') {
      // language filter uses headerLang or filterBar lang
    }
    if (headerLang === 'தமிழ்' && r.lang !== 'ta') {
      // header Tamil toggle implies filter ta — keep but show toast
    }
    if (genre !== 'all') {
      // genre not in schema yet — skip filtering
    }
    return true
  })

  // apply Year/Language from FilterBar + headerLang
  const displayResults = filtered.filter((r) => {
    if (year !== 'all' && String(r.year) !== year) return false
    // FilterBar language: EN/Tamil
    if (lang === 'EN' && r.lang !== 'en') return false
    if (lang === 'Tamil' && r.lang !== 'ta') return false
    return true
  })

  const handleSelect = async (r: SearchResult) => {
    setSelected(r)
    try {
      const d = await api.resolve(r.id)
      setDetail(d)
      const el = document.getElementById('detail-drawer')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setDetail(null)
    }
  }

  const handlePlay = async (animeId?: string, epId?: string, version = '720p') => {
    try {
      const res = await api.play({ id: animeId, episode_id: epId, version })
      if (res.playUrl) {
        setPlaySrc(res.playUrl)
        showToast(`Playing ${version}`)
      }
    } catch (e: any) {
      showToast(`Play failed: ${e.message}`)
    }
  }

  const toggleWatchlist = (id: string) => {
    const next = new Set(watchlist)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setWatchlist(next)
    localStorage.setItem('ac_watchlist', JSON.stringify([...next]))
    showToast(next.has(id) ? 'Added to Watchlist' : 'Removed from Watchlist')
  }

  const onNav = (id: string) => {
    setActiveNav(id)
    if (id === 'search') inputRef.current?.focus()
    if (id === 'download-manager' || id === 'downloads') {
      document.getElementById('download-queue-card')?.scrollIntoView({ behavior: 'smooth' })
      showToast('Download Manager — queue below →')
    }
    if (id === 'playback') {
      if (selected) handlePlay(selected.id, detail?.episodes?.[0]?.id)
      else showToast('Select an anime first')
    }
    if (id === 'network') document.getElementById('network-status-card')?.scrollIntoView({ behavior: 'smooth' })
    if (['popular', 'new', 'genres', 'collections'].includes(id)) {
      api.search(id === 'popular' ? 'trending' : id).then((d) => setResults(d.results)).catch(() => {})
      showToast(`${id} — showing trending`)
    }
  }

  const quickResolve = async () => {
    const id = prompt('Enter anime ID to resolve (e.g. muse_solo_001, muse_naruto_001):', selected?.id || 'muse_solo_001')
    if (!id) return
    try {
      const d = await api.resolve(id)
      const fake: SearchResult = { id: d.id, title: d.title, title_tamil: d.title_tamil, lang: 'en', thumbnail: d.thumbnail || '', source: d.source, year: d.year, score: d.score, url: '' }
      setSelected(fake)
      setDetail(d)
      showToast(`Resolved ${d.title}`)
    } catch (e: any) {
      showToast(`Resolve failed: ${e.message}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#E5E7EB', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <Sidebar active={activeNav} onNav={onNav} downloadCount={queueCount} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ height: 56, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', background: 'rgba(15,15,20,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', background: '#18181F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999, padding: '0 6px 0 14px', height: 36 }}>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 180)}
                placeholder="Search anime, movies, episodes..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E5E7EB', fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 6, marginRight: 6 }}>Ctrl K</span>
              <button
                onClick={() => {
                  if (q) api.search(q).then((d) => setResults(d.results))
                }}
                style={{ width: 32, height: 28, borderRadius: 999, background: '#FF3358', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ⌕
              </button>
            </div>
            {focused && suggest.length > 0 && (
              <div style={{ position: 'absolute', top: 42, left: 0, right: 0, background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {suggest.map((r) => (
                  <div key={r.id} onMouseDown={() => { setQ(r.title); setResults([r]); setSuggest([]) }} style={{ display: 'flex', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <img src={r.thumbnail} alt="" style={{ width: 32, height: 44, borderRadius: 6, objectFit: 'cover' }} onError={(e) => ((e.target as HTMLImageElement).src = `https://placehold.co/32x44/1E1E32/FFF?text=${encodeURIComponent(r.title.slice(0,2))}`)} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.year} • {r.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setHeaderLang((p) => (p === 'EN' ? 'தமிழ்' : 'EN'))} style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#1A1A22', border: '1px solid rgba(255,255,255,0.06)', color: '#E5E7EB', padding: '6px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>
              <span>◍</span> {headerLang} <span style={{ color: '#6B7280' }}>▾</span>
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A1A22', border: '1px solid rgba(255,255,255,0.06)', color: '#E5E7EB', padding: '6px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>
              <span>◎</span> {headerLang === 'EN' ? 'தமிழ்' : 'EN'}
            </button>
            <button style={{ width: 36, height: 36, borderRadius: 999, background: '#1A1A22', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer' }}>◐</button>
            <button style={{ width: 36, height: 36, borderRadius: 999, background: '#1A1A22', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer' }}>♡</button>
            <img src={`https://placehold.co/32x32/FF3358/FFF?text=A`} alt="user" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', border: '2px solid rgba(255,51,88,0.3)' }} />
          </div>
        </header>

        <main style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Hero
              onWatch={() => handlePlay('muse_solo_001', 'muse_solo_001_ep8', '1080p')}
              onWatchlist={() => toggleWatchlist('muse_solo_001')}
            />

            <FilterBar active={tab} onSelect={setTab} genre={genre} setGenre={setGenre} year={year} setYear={setYear} lang={lang} setLang={setLang} />

            {/* Card grid — 6 per row like screenshot: Jujutsu, Demon Slayer, One Piece, Naruto, AOT, OPM */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                {(() => {
                  const ORDER = ['muse_jujutsu_002', 'muse_demonslayer_003', 'muse_onepiece_002', 'muse_naruto_001', 'muse_aot_004', 'muse_opm_005']
                  const pool = displayResults.length ? displayResults : results
                  let cards: SearchResult[] = ORDER.map((id) => pool.find((r) => r.id === id) || results.find((r) => r.id === id)).filter(Boolean) as SearchResult[]
                  if (cards.length < 6) cards = (pool.length ? pool : results).slice(0, 6)
                  return cards.map((r) => {
                    const badges: Record<string, string> = {
                      'muse_jujutsu_002': 'NEW',
                      'muse_demonslayer_003': 'UPDATED',
                      'muse_onepiece_002': 'NEW',
                      'muse_naruto_001': 'UPDATED',
                    }
                    const badge = (badges as any)[r.id] || (r.score && r.score >= 8.8 ? 'UPDATED' : undefined)
                    const epMap: Record<string, string> = {
                      muse_jujutsu_002: 'Episode 20 • Sub',
                      muse_demonslayer_003: 'Episode 8 • Sub | Dub',
                      muse_onepiece_002: 'Episode 1126 • Sub',
                      muse_naruto_001: 'Episode 500 • Sub | Dub',
                      muse_aot_004: 'Episode 89 • Sub',
                      muse_opm_005: 'Episode 7 • Sub',
                    }
                    return (
                      <AnimeCard
                        key={r.id}
                        id={r.id}
                        title={r.title}
                        thumbnail={r.thumbnail || `https://placehold.co/300x450/1E1E32/FFF?text=${encodeURIComponent(r.title)}`}
                        badge={badge}
                        episode={epMap[r.id] || `${r.year} • ${r.source}`}
                        onClick={() => handleSelect(r)}
                        onBookmark={() => toggleWatchlist(r.id)}
                      />
                    )
                  })
                })()}
              </div>
              {/* carousel arrow */}
              <button style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 999, background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>›</button>
            </div>

            <ContinueWatching
              items={continueItems.map((c) => ({
                ...c,
                onPlay: () => handlePlay(undefined, c.ep),
              }))}
            />

            {/* Detail drawer — episodes & versions */}
            {selected && (
              <div id="detail-drawer" style={{ background: '#14141A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <img
                    src={selected.thumbnail}
                    alt={selected.title}
                    style={{ width: 120, height: 170, borderRadius: 12, objectFit: 'cover' }}
                    onError={(e) => ((e.target as HTMLImageElement).src = `https://placehold.co/120x170/1E1E32/FFF?text=${encodeURIComponent(selected.title.slice(0, 4))}`)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{selected.title}</div>
                    {selected.title_tamil && <div style={{ color: '#9CA3AF', fontSize: 13 }}>{selected.title_tamil}</div>}
                    <div style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>{selected.year} • {selected.source} • {selected.score}</div>
                    {selected.url && (
                      <a href={selected.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 8, color: '#FF6B8A', fontSize: 12, textDecoration: 'none', border: '1px solid rgba(255,51,88,0.2)', padding: '4px 10px', borderRadius: 999 }}>
                        ↗ Muse India • YouTube
                      </a>
                    )}
                    {detail?.synopsis && <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>{detail.synopsis}</div>}
                  </div>
                </div>
                {detail?.episodes && (
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: 10, fontSize: 13 }}>Episodes & Versions — click Play to watch in-app via hls.js</div>
                    {detail.episodes.map((ep: any) => (
                      <div key={ep.id} style={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ minWidth: 130 }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: 12 }}>EP {ep.number}</div>
                          <div style={{ color: '#9CA3AF', fontSize: 11 }}>{ep.title}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                          {ep.versions.map((v: any, idx: number) => (
                            <span key={idx} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', background: '#1A1A22', borderLeft: `3px solid ${v.audio === 'dub' ? '#00E5CC' : '#FF3358'}`, padding: '6px 10px', borderRadius: 8, fontSize: 11, color: '#E5E7EB' }}>
                              {v.quality} • {v.audio} {v.lang === 'ta' ? 'தமிழ்' : 'EN'}
                              <button onClick={() => handlePlay(undefined, ep.id, v.quality)} style={{ background: '#FF3358', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: 999, fontSize: 11, cursor: 'pointer' }}>Play</button>
                              <button onClick={async () => { try { const r = await api.download(ep.id, v.quality); showToast(`Queued ${r.jobId.slice(0, 6)}`)} catch(e:any){showToast(e.message)}} } style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 999, fontSize: 11, cursor: 'pointer' }}>↓</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 11, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              "The only one who should kill, are those who are prepared to be killed. – Lelouch Lamperouge"
            </div>
          </div>

          <aside style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
            <QuickActions
              onSearch={() => inputRef.current?.focus()}
              onResolve={quickResolve}
              onPlay={() => {
                if (selected) handlePlay(selected.id, detail?.episodes?.[0]?.id)
                else showToast('Select an anime first, then Play')
              }}
              onDownload={async () => {
                if (!selected || !detail?.episodes?.[0]) return showToast('Select anime → episode first')
                const ep = detail.episodes[0].id
                const r = await api.download(ep, '720p').catch((e: any) => showToast(e.message))
                if (r) showToast(`Queued ${r.jobId.slice(0, 8)}`)
              }}
            />
            <div id="download-queue-card">
              <DownloadQueue />
            </div>
            <div id="network-status-card">
              <NetworkStatus />
            </div>
          </aside>
        </main>
      </div>

      {playSrc && <VideoPlayer src={playSrc} onClose={() => setPlaySrc(null)} />}
      {toast && <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#1A1A22', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 12, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>{toast}</div>}
    </div>
  )
}
