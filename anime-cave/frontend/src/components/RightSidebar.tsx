import { useEffect, useState } from 'react'
import { api } from '../api/client'

type QueueJob = { id: string; episode_id: string; version: string; status: string; progress: number }

export function QuickActions({ onSearch, onResolve, onPlay, onDownload }: { onSearch: () => void; onResolve: () => void; onPlay: () => void; onDownload: () => void }) {
  const btn = (icon: string, label: string, onClick: () => void, active?: boolean) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: active ? 'rgba(255,51,88,0.12)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active ? '#FF6B8A' : '#9CA3AF',
        fontSize: 11,
        padding: '6px 8px',
        borderRadius: 10,
        flex: 1,
      }}
    >
      <span style={{ width: 36, height: 36, borderRadius: 10, background: active ? 'rgba(255,51,88,0.14)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: active ? '#FF3358' : '#9CA3AF' }}>{icon}</span>
      {label}
    </button>
  )
  return (
    <div style={{ background: '#14141A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 12 }}>Quick Actions</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {btn('⌕', 'Search', onSearch, true)}
        {btn('◇', 'Resolve', onResolve)}
        {btn('▶', 'Play (VLC)', onPlay)}
        {btn('↓', 'Download', onDownload)}
      </div>
    </div>
  )
}

export function DownloadQueue() {
  const [jobs, setJobs] = useState<QueueJob[]>([])
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/download').then((r) => r.json())
        setJobs((res.jobs || []).slice(0, 5))
      } catch {}
    }, 2000)
    // initial
    fetch('/api/download')
      .then((r) => r.json())
      .then((d) => setJobs((d.jobs || []).slice(0, 5)))
      .catch(() => {})
    return () => clearInterval(id)
  }, [])

  // Also listen WS
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/progress')
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data.job_id) setJobs((prev) => prev.map((j) => (j.id === data.job_id ? { ...j, progress: data.progress, status: data.status } : j)))
        } catch {}
      }
    } catch {}
    return () => ws?.close()
  }, [])

  const demo = jobs.length === 0
  const display: any[] = demo
    ? [
        { id: 'demo1', title: 'Demon Slayer S4', sub: 'Ep 8 • 720p • 350MB', progress: 68, status: 'downloading' },
        { id: 'demo2', title: 'Jujutsu Kaisen S2', sub: 'Ep 20 • 1080p • 650MB', progress: 33, status: 'downloading' },
        { id: 'demo3', title: 'One Piece', sub: 'Ep 1126 • 720p • 280MB', progress: 0, status: 'Queued' },
      ]
    : jobs.map((j) => ({
        id: j.id,
        title: j.episode_id.replace('muse_', '').replace(/_/g, ' ').slice(0, 22),
        sub: `${j.episode_id} • ${j.version}`,
        progress: j.progress || (j.status === 'done' ? 100 : j.status === 'queued' ? 0 : 45),
        status: j.status,
      }))

  return (
    <div style={{ background: '#14141A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>Download Queue</span>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>▦</button>
      </div>
      {display.map((it) => (
        <div key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <img
            src={`https://placehold.co/40x40/1E1E32/FFFFFF?text=${encodeURIComponent(it.title.slice(0, 2))}`}
            alt=""
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>
            <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${it.progress}%`, height: '100%', background: it.status === 'done' ? '#10B981' : '#FF3358' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 10, color: it.status === 'Queued' || it.status === 'queued' ? '#9CA3AF' : '#FF6B8A' }}>{it.progress}%</span>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{it.status === 'Queued' || it.status === 'queued' ? '◷ Queued' : '❚❚'}</span>
          </div>
        </div>
      ))}
      <button style={{ marginTop: 10, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', padding: '7px', borderRadius: 999, fontSize: 11, cursor: 'pointer' }}>View All →</button>
    </div>
  )
}

export function NetworkStatus() {
  const [status, setStatus] = useState<any>(null)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const s = await api.networkStatus()
        setStatus(s)
      } catch {
        try {
          const s = await fetch('/api/network/status').then((r) => r.json())
          setStatus(s)
        } catch {}
      }
    }
    fetchStatus()
    const id = setInterval(fetchStatus, 3000)
    return () => clearInterval(id)
  }, [])

  const knobs = status?.knobs || {}
  const isActive = status ? true : false

  return (
    <div style={{ background: '#14141A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 }}>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 12 }}>Network Status</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#9CA3AF' }}>External Downloader</span>
          <span style={{ background: isActive ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)', color: isActive ? '#10B981' : '#EF4444', padding: '2px 8px', borderRadius: 999, fontSize: 11, border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>{knobs.external_downloader || 'aria2c'} • Active</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9CA3AF' }}>Connections</span>
          <span style={{ color: '#fff' }}>{knobs.concurrency || 3} / {knobs.per_host_limit || 16}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9CA3AF' }}>Speed</span>
          <span style={{ color: '#fff' }}>12.4 MB/s</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9CA3AF' }}>Bandwidth Limit</span>
          <span style={{ color: '#9CA3AF' }}>{knobs.bandwidth_limit && knobs.bandwidth_limit !== '0' ? knobs.bandwidth_limit : 'No Limit'}</span>
        </div>
        <div style={{ height: 28, background: 'rgba(255,51,88,0.08)', borderRadius: 8, marginTop: 8, position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,51,88,0.12)' }}>
          <svg viewBox="0 0 100 28" style={{ width: '100%', height: '100%' }}>
            <polyline points="0,20 10,18 20,22 30,14 40,16 50,10 60,15 70,8 80,12 90,6 100,10" fill="none" stroke="#FF3358" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
