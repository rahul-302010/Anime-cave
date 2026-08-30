type Item = { id: string; title: string; sub: string; img: string; progress: number; onPlay: () => void }

export default function ContinueWatching({ items }: { items: Item[] }) {
  return (
    <div style={{ background: '#14141A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: '#FF3358' }}>◧</span>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Continue Watching</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {items.map((it) => (
          <div key={it.id} style={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 12, padding: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#1A1A22' }}>
              <img
                src={it.img}
                alt={it.title}
                onError={(e) => ((e.target as HTMLImageElement).src = `https://placehold.co/72x72/1E1E32/FFFFFF?text=${encodeURIComponent(it.title.slice(0, 2))}`)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={it.onPlay}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.9)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>▶</span>
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{it.sub}</div>
              <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${it.progress}%`, height: '100%', background: '#FF3358', borderRadius: 999 }} />
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: '#6B7280', textAlign: 'right' }}>{it.progress}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
