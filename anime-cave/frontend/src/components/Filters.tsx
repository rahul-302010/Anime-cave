import { useState } from 'react'

type FilterState = {
  lang: string
  source: string
  year: string
  score: string
}

type Props = {
  value: FilterState
  onChange: (f: FilterState) => void
}

const SOURCES = ['all', 'muse_india']
const YEARS = ['all', '2024', '2023', '2022', '2002', '1999']
const SCORES = ['all', '8+', '7.5+', '7+']

export default function Filters({ value, onChange }: Props) {
  const [presets, setPresets] = useState<Array<{ name: string; f: FilterState }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('ac_presets') || '[]')
    } catch {
      return []
    }
  })

  const chip = (active: boolean) => ({
    background: active ? '#7C3AED' : 'transparent',
    color: active ? '#EDE9FE' : '#A1A1B5',
    border: `1px solid ${active ? '#7C3AED' : 'rgba(237,233,254,0.08)'}`,
    borderRadius: 999 as const,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 6,
  })

  const savePreset = () => {
    const name = prompt('Preset name (e.g., Tamil Dubs 2024)')
    if (!name) return
    const next = [...presets, { name, f: { ...value } }].slice(0, 6)
    setPresets(next)
    localStorage.setItem('ac_presets', JSON.stringify(next))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      {presets.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>Presets:</span>
          {presets.map((p) => (
            <button key={p.name} style={chip(false)} onClick={() => onChange(p.f)}>
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#A1A1B5', minWidth: 44 }}>Lang</span>
        {['all', 'en', 'ta'].map((l) => (
          <button key={l} style={chip(value.lang === l)} onClick={() => onChange({ ...value, lang: l })}>
            {l === 'ta' ? 'தமிழ்' : l.toUpperCase()}
            {value.lang === l && ' ✓'}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#A1A1B5', marginLeft: 12 }}>Source</span>
        {SOURCES.map((s) => (
          <button key={s} style={chip(value.source === s)} onClick={() => onChange({ ...value, source: s })}>
            {s}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#A1A1B5', marginLeft: 12 }}>Year</span>
        {YEARS.map((y) => (
          <button key={y} style={chip(value.year === y)} onClick={() => onChange({ ...value, year: y })}>
            {y}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#A1A1B5', marginLeft: 12 }}>Score</span>
        {SCORES.map((s) => (
          <button key={s} style={chip(value.score === s)} onClick={() => onChange({ ...value, score: s })}>
            {s}
          </button>
        ))}
        <button
          onClick={() => onChange({ lang: 'all', source: 'all', year: 'all', score: 'all' })}
          style={{ color: '#00E5CC', background: 'transparent', border: 'none', fontSize: 12, cursor: 'pointer', marginLeft: 8 }}
        >
          Clear all
        </button>
        <button
          onClick={savePreset}
          style={{ color: '#A1A1B5', background: 'transparent', border: '1px solid rgba(237,233,254,0.08)', borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}
        >
          Save preset
        </button>
      </div>
    </div>
  )
}
