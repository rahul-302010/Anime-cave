import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

type Props = {
  src: string | null
  onClose: () => void
}

export default function VideoPlayer({ src, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!src || !videoRef.current) return
    setError(null)
    const video = videoRef.current
    // If native HLS support (Safari) or mp4, just set src
    if (src.endsWith('.mp4')) {
      video.src = src
      video.play().catch(() => {})
      return
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {})
      return
    }
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          setError(`HLS error: ${data.type} ${data.details}`)
        }
      })
      return () => {
        hls.destroy()
      }
    } else {
      setError('HLS not supported in this browser')
    }
  }, [src])

  if (!src) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 90vw)',
          background: '#12121F',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(237,233,254,0.12)',
          boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(237,233,254,0.08)' }}>
          <span style={{ fontWeight: 600, color: '#EDE9FE', fontSize: 14 }}>Now Playing</span>
          <button
            onClick={onClose}
            style={{ background: 'rgba(237,233,254,0.08)', border: 'none', color: '#A1A1B5', borderRadius: 999, width: 28, height: 28, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div style={{ background: '#000', aspectRatio: '16/9', position: 'relative' }}>
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            onError={() => setError('Video failed to load — trying fallback MP4')}
          />
          {error && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(255,59,130,0.9)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
              {error}
              <div style={{ marginTop: 6 }}>
                <a href={src} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                  Open directly
                </a>
                {' · '}
                <a href="https://www.youtube.com/@MuseIndia" target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                  Muse India YouTube
                </a>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 16px', fontSize: 11, color: '#6B7280', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ background: '#1E1E32', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(237,233,254,0.08)' }}>HLS • hls.js 1.5</span>
          <span style={{ color: '#A1A1B5' }}>{src.slice(0, 60)}…</span>
        </div>
      </div>
    </div>
  )
}
