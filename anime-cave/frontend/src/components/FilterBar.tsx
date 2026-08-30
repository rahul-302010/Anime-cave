type Props = {
  active: string
  onSelect: (id: string) => void
  genre: string
  setGenre: (v: string) => void
  year: string
  setYear: (v: string) => void
  lang: string
  setLang: (v: string) => void
}

const TABS = ['All', 'TV Series', 'Movies', 'OVA', 'ONA', 'Special']

export default function FilterBar({ active, onSelect, genre, setGenre, year, setYear, lang, setLang }: Props) {
  const pill = (label: string, isActive: boolean) => (
    <button
      key={label}
      onClick={() => onSelect(label)}
      style={{
        background: isActive ? '#FF3358' : 'rgba(255,255,255,0.06)',
        color: isActive ? '#fff' : '#9CA3AF',
        border: isActive ? '1px solid #FF3358' : '1px solid rgba(255,255,255,0.06)',
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )

  const select = (value: string, setter: (v: string) => void, placeholder: string, options: string[]) => (
    <select
      value={value}
      onChange={(e) => setter(e.target.value)}
      style={{ background: '#1A1A22', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
    >
      <option value="all">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '12px 0' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#14141A', padding: 4, borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map((t) => pill(t, active === t))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
        {select(genre, setGenre, 'Genre', ['Action', 'Adventure', 'Fantasy', 'Romance'])}
        {select(year, setYear, 'Year', ['2024', '2023', '2022', '2021', '2013', '2007', '1999'])}
        {select(lang, setLang, 'Language', ['EN', 'Tamil'])}
      </div>
    </div>
  )
}
