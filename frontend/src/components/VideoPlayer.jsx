import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

export default function VideoPlayer({ episode, animeId, version }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // local file handling
  const isLocal = episode?.source?.type === "local";
  const isYT = episode?.source?.type === "youtube";
  const isCR = episode?.source?.type === "crunchyroll";

  const src = isLocal ? api.streamUrl(episode.source.fileName) : null;
  const subtitleEn = isLocal ? api.subtitleUrl(`${animeId}_${version}_ep${episode.episodeNumber}_en.vtt`) : null;
  const subtitleTa = isLocal && version==="tamil" ? api.subtitleUrl(`${animeId}_${version}_ep${episode.episodeNumber}_ta.vtt`) : null;

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }
  function onTime() {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    setDuration(v.duration || 0);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  }
  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const v = videoRef.current;
    if (v && v.duration) v.currentTime = pct * v.duration;
  }
  function fmt(s){
    if(!isFinite(s)) return "00:00";
    const m = Math.floor(s/60).toString().padStart(2,"0");
    const sec = Math.floor(s%60).toString().padStart(2,"0");
    return `${m}:${sec}`;
  }
  function goFullscreen(){
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  }
  useEffect(()=>{
    const h =()=> setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return ()=> document.removeEventListener("fullscreenchange", h);
  },[]);

  if (isCR) {
    return (
      <div className="cr-placeholder">
        <div>
          <div style={{fontSize:22,fontWeight:800}}>Crunchyroll — External Platform</div>
          <p style={{color:"#9aa0b8",marginTop:8, maxWidth:560, marginInline:"auto"}}>
            Crunchyroll cannot be embedded (policy). Click below to open episode {episode.episodeNumber} in browser. External = streaming only.
          </p>
          <a href={episode.source.searchUrl} target="_blank" rel="noreferrer">↗ Open in Crunchyroll</a>
          <div style={{marginTop:14, fontSize:12, color:"#9aa0b8"}}>Anime: {animeId} • Version: {version} • Episode {episode.episodeNumber}</div>
        </div>
      </div>
    );
  }

  if (isYT) {
    return (
      <iframe
        src={episode.source.embedUrl}
        title={`YouTube ${episode.episodeNumber}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  // Local custom player - dark VLC-style
  return (
    <>
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        onTimeUpdate={onTime}
        onLoadedMetadata={onTime}
        onPlay={()=> setPlaying(true)}
        onPause={()=> setPlaying(false)}
        onClick={toggle}
        controls={false}
        style={{background:"#000"}}
      >
        <track kind="subtitles" src={subtitleEn} srcLang="en" label="English" default />
        {subtitleTa && <track kind="subtitles" src={subtitleTa} srcLang="ta" label="Tamil" />}
      </video>

      <div className="local-controls">
        <div className="controls-row" onClick={seek} style={{cursor:"pointer"}}>
          <div className="progress"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
        </div>
        <div className="controls-row">
          <button className="pbtn primary" onClick={toggle}>{playing ? "⏸" : "▶"}</button>
          <button className="pbtn" onClick={()=> { const v=videoRef.current; if(v) v.currentTime = Math.max(0, v.currentTime-10); }}>⟲ 10</button>
          <button className="pbtn" onClick={()=> { const v=videoRef.current; if(v) v.currentTime = Math.min(v.duration||0, v.currentTime+10); }}>10 ⟳</button>
          <div className="time">{fmt(current)} / {fmt(duration)}</div>
          <div style={{marginLeft:"auto", display:"flex", gap:8}}>
            <button className="pbtn" onClick={()=> { const v=videoRef.current; if(v) v.muted=!v.muted; }} title="Mute">🔊</button>
            <button className="pbtn" onClick={goFullscreen} title="Fullscreen">{fullscreen ? "⤓" : "⛶"}</button>
          </div>
        </div>
        <div style={{fontSize:11, color:"rgba(255,255,255,0.7)", display:"flex", gap:8}}>
          <span>LOCAL • {episode.source.fileName}</span>
          <span>• VLC-style dark player • 480p/720p via source • Subtitles: English{version==="tamil"?" + Tamil":""}</span>
        </div>
      </div>
    </>
  );
}
