type Props = {
  id: string
  title: string
  subtitle?: string
  thumbnail: string
  badge?: string // NEW / UPDATED
  episode?: string
  lang?: string
  onClick: () => void
  onBookmark?: () => void
}

export default function AnimeCard({ title, subtitle, thumbnail, badge, episode, lang, onClick, onBookmark }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#14141A',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 160ms, border 160ms, box-shadow 160ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,51,88,0.25)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '3/4.2', background: '#0F0F14', overflow: 'hidden' }}>
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            if (!t.src.includes('placehold.co')) t.src = `https://placehold.co/300x450/1E1E32/FFFFFF?text=${encodeURIComponent(title.slice(0, 12))}`
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {badge && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: badge === 'NEW' ? '#FF3358' : '#22C55E',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 7px',
              borderRadius: 999,
              letterSpacing: '0.04em',
            }}
          >
            {badge}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBookmark?.()
          }}
          style={{ position: 'absolute', bottom: 8, right: 8, width: 26, height: 26, borderRadius: 999, background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(255,255,255,0.12)', color: '#FF6B8A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
        >
          <span style={{ fontSize: 12 }}>♡</span>
        </button>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 40%)', pointerEvents: 'none' }} />
        {/* Title overlay at bottom of image like screenshot */}
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.2, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{title}</div>
      </div>
      <div style={{ padding: '8px 10px 10px', background: '#14141A' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {subtitle || episode ? (
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {episode || subtitle} {lang ? `• ${lang}` : ''}
          </div>
        ) : null}
      </div>
    </div>
  )
}
