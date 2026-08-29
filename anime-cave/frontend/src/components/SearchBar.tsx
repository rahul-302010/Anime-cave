import { useEffect, useState, useRef } from 'react'
import { api, SearchResult } from '../api/client'

type Props = {
  onResults: (results: SearchResult[]) => void
  lang: string
  onLangChange: (l: string) => void
}

export default function SearchBar({ onResults, lang, onLangChange }: Props) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggest, setSuggest] = useState<SearchResult[]>([])
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl+K focus
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSuggest([])
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.search(q, lang === 'all' ? undefined : lang)
        setSuggest(data.results.slice(0, 6))
        onResults(data.results)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [q, lang])

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 640 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 44,
          borderRadius: 10,
          border: '1px solid rgba(237,233,254,0.08)',
          background: '#1E1E32',
          padding: '0 12px',
          gap: 8,
        }}
      >
        <span style={{ color: '#6B7280', fontSize: 16 }}>⌕</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search anime — English or Tamil…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#EDE9FE',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
          }}
        />
        {q && (
          <button
            onClick={() => {
              setQ('')
              setSuggest([])
              onResults([])
            }}
            aria-label="clear"
            style={{
              background: 'rgba(237,233,254,0.08)',
              border: 'none',
              borderRadius: 999,
              width: 24,
              height: 24,
              color: '#A1A1B5',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => onLangChange(lang === 'en' ? 'ta' : lang === 'ta' ? 'all' : 'en')}
            style={{
              background: lang === 'ta' ? '#00E5CC' : 'transparent',
              color: lang === 'ta' ? '#0A0A12' : '#A1A1B5',
              border: '1px solid rgba(237,233,254,0.08)',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {lang === 'ta' ? 'தமிழ்' : lang === 'en' ? 'EN' : 'ALL'}
          </button>
          <span style={{ fontSize: 11, color: '#6B7280' }}>⌘K</span>
        </div>
      </div>
      {focused && suggest.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            background: '#1E1E32',
            border: '1px solid rgba(237,233,254,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {suggest.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                gap: 10,
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(237,233,254,0.04)',
              }}
              onMouseDown={() => {
                onResults([r])
                setQ(r.title)
              }}
            >
              <img src={r.thumbnail} alt="" style={{ width: 32, height: 48, borderRadius: 6, objectFit: 'cover', background: '#12121F' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#EDE9FE' }}>{r.title}</div>
                {r.title_tamil && <div style={{ fontSize: 12, color: '#A1A1B5', lineHeight: 1.6 }}>{r.title_tamil}</div>}
                <div style={{ fontSize: 11, color: '#6B7280' }}>{r.year} · {r.source} · <span style={{ border: '1px solid rgba(0,229,204,0.4)', color: '#00E5CC', padding: '1px 6px', borderRadius: 999 }}>{r.lang === 'ta' ? 'தமிழ்' : 'EN'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && <div style={{ position: 'absolute', right: 12, top: 50, fontSize: 12, color: '#A1A1B5' }}>Searching…</div>}
    </div>
  )
}
