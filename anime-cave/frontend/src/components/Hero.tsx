import { useState } from 'react'

type Props = {
  onWatch: () => void
  onWatchlist: () => void
  title?: string
  subtitle?: string
}

export default function Hero({ onWatch, onWatchlist }: Props) {
  const [idx, setIdx] = useState(0)
  const heroImg = "https://cdn.myanimelist.net/images/anime/1800/146167.jpg" // Solo Leveling poster as fallback hero art
  const bannerFallback = "https://placehold.co/1200x400/1A0B2E/8B5CF6?text=Solo+Leveling+S2E8"

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0F0F14', border: '1px solid rgba(255,255,255,0.06)', height: 280 }}>
      {/* background image + gradient */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src={heroImg}
          alt="Solo Leveling"
          onError={(e) => ((e.target as HTMLImageElement).src = bannerFallback)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.85 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 45%, transparent 75%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 300px at 70% 40%, rgba(139,92,246,0.35), transparent 70%), radial-gradient(500px 250px at 85% 30%, rgba(56,189,248,0.2), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,10,15,0.7) 0%, transparent 55%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560 }}>
        <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(255,51,88,0.14)', border: '1px solid rgba(255,51,88,0.3)', color: '#FF6B8A', padding: '3px 8px', borderRadius: 999, fontSize: 10, letterSpacing: '0.08em', fontWeight: 600 }}>TRENDING NOW</span>
        <div style={{ marginTop: 10, fontFamily: '"Cinzel Decorative", "Space Grotesk", serif', fontSize: 44, fontWeight: 800, color: '#fff', textShadow: '0 2px 24px rgba(139,92,246,0.5), 0 0 12px rgba(139,92,246,0.3)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          Solo Leveling
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#D1D5DB' }}>Season 2 - Episode 8</div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, maxWidth: 420 }}>
          The gates have opened and the hunters must rise. The shadow monarch awakens.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button
            onClick={onWatch}
            style={{ background: '#FF3358', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(255,51,88,0.35)' }}
          >
            ▶ Watch Now
          </button>
          <button
            onClick={onWatchlist}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}
          >
            ＋ Watchlist
          </button>
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 6, alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 999, background: i === idx ? '#FF3358' : 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 180ms' }} />
          ))}
        </div>
      </div>

      <button onClick={() => setIdx((i) => (i + 5) % 6)} style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 999, background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(6px)', zIndex: 2 }}>‹</button>
      <button onClick={() => setIdx((i) => (i + 1) % 6)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 999, background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(6px)', zIndex: 2 }}>›</button>
    </div>
  )
}
