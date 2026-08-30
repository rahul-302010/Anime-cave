import { useState } from 'react'
import { api } from '../api/client'
import VideoPlayer from './VideoPlayer'

type Props = {
  animeId?: string
  episodeId?: string
  version?: string
  label?: string
}

export default function PlayerButton({ animeId, episodeId, version = '720p', label = 'Play' }: Props) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [playSrc, setPlaySrc] = useState<string | null>(null)

  const handlePlay = async () => {
    if (!animeId && !episodeId) {
      setMsg('No episode selected')
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      const res = await api.play({ id: animeId, episode_id: episodeId, version })
      if (res.playUrl) {
        // Embed player instead of window.open — fake cdn.muse-india.example never resolves (DNS_NXDOMAIN)
        // Now backend returns https://test-streams.mux.dev/... which plays via hls.js
        setPlaySrc(res.playUrl)
        setMsg(`Playing ${(res as any).quality || version} via ${res.player}`)
        setTimeout(() => setMsg(null), 3000)
      } else {
        setMsg('No play URL')
      }
    } catch (e: any) {
      setMsg(`Play failed: ${e.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  const handleDownload = async () => {
    if (!episodeId) {
      setMsg('Select episode first')
      return
    }
    setLoading(true)
    try {
      const res = await api.download(episodeId, version, animeId)
      setMsg(`Queued download ${res.jobId.slice(0, 8)}…`)
    } catch (e: any) {
      setMsg(`Queue failed: ${e.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <>
      {playSrc && <VideoPlayer src={playSrc} onClose={() => setPlaySrc(null)} />}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handlePlay}
          disabled={loading}
          style={{
            background: loading ? '#6D28D9' : '#7C3AED',
            color: '#EDE9FE',
            border: 'none',
            borderRadius: 10,
            height: 44,
            padding: '0 20px',
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transform: loading ? 'scale(0.99)' : 'scale(1)',
            transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {loading ? (
            <span style={{ width: 16, height: 16, border: '2px solid rgba(237,233,254,0.3)', borderTopColor: '#EDE9FE', borderRadius: 999, display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <span>▶</span>
          )}
          {loading ? 'Loading…' : label}
        </button>
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            background: 'transparent',
            color: '#A1A1B5',
            border: '1px solid rgba(237,233,254,0.08)',
            borderRadius: 10,
            height: 44,
            padding: '0 16px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Queue download
        </button>
        {msg && (
          <span style={{ fontSize: 12, color: '#00E5CC', background: '#1E1E32', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(237,233,254,0.08)' }}>
            {msg}
          </span>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </>
  )
}
