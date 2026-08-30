type Props = { active: string; onNav: (id: string) => void; downloadCount: number }

const NAV = [
  { id: 'explore', label: 'Explore', icon: '⌂' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'popular', label: 'Popular', icon: '♨' },
  { id: 'new', label: 'New Releases', icon: '◉' },
  { id: 'genres', label: 'Genres', icon: '⊞' },
  { id: 'collections', label: 'Collections', icon: '▭' },
  { id: 'watchlist', label: 'Watchlist', icon: '♡' },
  { id: 'history', label: 'History', icon: '↻' },
  { id: 'downloads', label: 'Downloads', icon: '↓', badge: true },
]
const TOOLS = [
  { id: 'download-manager', label: 'Download Manager', icon: '⤓' },
  { id: 'playback', label: 'Playback (VLC)', icon: '▶' },
  { id: 'network', label: 'Network & Settings', icon: '⚙' },
]
const SYSTEM = [
  { id: 'version', label: 'Version Control', icon: '◇' },
  { id: 'logs', label: 'Logs', icon: '☰' },
  { id: 'about', label: 'About Anime Cave', icon: 'ⓘ' },
]

export default function Sidebar({ active, onNav, downloadCount }: Props) {
  const item = (it: any, isActive: boolean) => (
    <button
      key={it.id}
      onClick={() => onNav(it.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        background: isActive ? 'linear-gradient(90deg, rgba(255,51,88,0.18) 0%, transparent 100%)' : 'transparent',
        color: isActive ? '#FF3358' : '#9CA3AF',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        position: 'relative',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 18, textAlign: 'center', fontSize: 14, color: isActive ? '#FF3358' : '#6B7280' }}>{it.icon}</span>
      {it.label}
      {it.badge && downloadCount > 0 && (
        <span style={{ marginLeft: 'auto', background: 'rgba(255,51,88,0.15)', color: '#FF3358', border: '1px solid rgba(255,51,88,0.3)', padding: '1px 6px', borderRadius: 999, fontSize: 11 }}>{downloadCount}</span>
      )}
      {isActive && <span style={{ position: 'absolute', right: 0, top: 6, bottom: 6, width: 3, background: '#FF3358', borderRadius: 999 }} />}
    </button>
  )

  return (
    <aside style={{ width: 220, minWidth: 220, background: '#0A0A0F', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
      <div style={{ padding: '18px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: 36, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#FF3358,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◼</span>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, letterSpacing: '0.08em', fontSize: 15, lineHeight: 1, color: '#fff' }}>ANIME</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, letterSpacing: '0.08em', fontSize: 15, lineHeight: 1, color: '#FF3358' }}>CAVE</div>
        </div>
      </div>

      <div style={{ padding: '14px 10px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{NAV.map(n => item(n, active === n.id))}</div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#6B7280', padding: '0 12px 8px', fontWeight: 600 }}>TOOLS</div>
          {TOOLS.map(t => item(t, active === t.id))}
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#6B7280', padding: '0 12px 8px', fontWeight: 600 }}>SYSTEM</div>
          {SYSTEM.map(s => item(s, active === s.id))}
        </div>
      </div>

      <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ background: '#14141A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>v0.1.0</span>
          <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 6px', borderRadius: 999 }}>Up to date</span>
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6, padding: '0 2px' }}>You're on the latest version</div>
      </div>
    </aside>
  )
}
