import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

/**
 * Strict source-based playback - Different source = different player
 * file: frontend/src/components/VideoPlayer.jsx:1
 */
export default function VideoPlayer({ episode, animeId, version }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const type = episode?.source?.type;
  const videoId = episode?.source?.videoId;
  const url = episode?.source?.url || episode?.source?.searchUrl;
  const file = episode?.source?.file || episode?.source?.fileName;

  // DEBUG REQUIREMENT - log before rendering
  useEffect(() => {
    console.log("Playback:", type, videoId, url, file);
    console.log("Playback details:", {
      type,
      videoId,
      url,
      file,
      validated: episode?.source?.validated,
      channel: episode?.source?.channel,
      query: episode?.source?.query
    });
    // Validate source before playing
    if (!["youtube", "crunchyroll", "local"].includes(type)) {
      console.error("Playback error: unknown source type", type);
    }
    if (type === "youtube" && !videoId) console.error("Playback error: youtube missing videoId", episode?.source);
    if (type === "crunchyroll" && !url) console.error("Playback error: crunchyroll missing url", episode?.source);
    if (type === "local" && !file) console.error("Playback error: local missing file", episode?.source);
  }, [type, videoId, url, file, episode]);

  const isLocal = type === "local";
  const isYT = type === "youtube";
  const isCR = type === "crunchyroll";

  // STRICT: Different source = different player - never mix
  if (isCR) {
    // CRUNCHYROLL - external only, never embedded, never custom player
    const openExternal = () => {
      console.log("Playback: opening Crunchyroll externally", url);
      // Electron: shell.openExternal, Web: window.open
      if (window.animeCave?.openExternal) {
        window.animeCave.openExternal(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };
    return (
      <div className="cr-placeholder">
        <div>
          <div style={{fontSize:22,fontWeight:800}}>Crunchyroll — External Platform</div>
          <p style={{color:"#9aa0b8",marginTop:8, maxWidth:560, marginInline:"auto"}}>
            Crunchyroll cannot be embedded (policy). This content is <b>streaming only</b> and must open in the official platform.
            Click below to watch Episode {episode.episodeNumber} on Crunchyroll.
          </p>
          <button onClick={openExternal} style={{marginTop:14,display:"inline-flex",padding:"12px 18px",borderRadius:999,background:"#ff6b00",color:"white",fontWeight:800,border:"none",cursor:"pointer"}}>
            ↗ Open in Crunchyroll
          </button>
          <div style={{marginTop:10}}>
            <a href={url} target="_blank" rel="noreferrer" style={{color:"#ff8f33",fontSize:12}}>or open link directly: {url?.slice(0,60)}...</a>
          </div>
          <div style={{marginTop:14, fontSize:12, color:"#9aa0b8"}}>Anime: {animeId} • Version: {version} • Episode {episode.episodeNumber} • Source: crunchyroll • External</div>
        </div>
      </div>
    );
  }

  if (isYT) {
    // YOUTUBE - Muse India validated embed only, never custom player
    if (!videoId) {
      return <div className="error">Playback error: Missing YouTube videoId for Episode {episode.episodeNumber}</div>;
    }
    const embedUrl = episode.source.embedUrl || `https://www.youtube.com/embed/${videoId}`;
    return (
      <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column"}}>
        <iframe
          src={embedUrl}
          title={`Muse India - ${episode.title} - Episode ${episode.episodeNumber}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          style={{width:"100%",height:"100%",border:"none",flex:1}}
        />
        <div style={{padding:"6px 10px",background:"rgba(255,0,0,0.08)",borderTop:"1px solid #2a2a45",fontSize:11,color:"#ff8ea0",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{background:"#ff0000",color:"white",padding:"3px 7px",borderRadius:999,fontWeight:800,fontSize:10}}>YOUTUBE</span>
          <span>Muse India • {episode.source.query || `Muse India Episode ${episode.episodeNumber}`} • Channel: {episode.source.channel || "Muse India"} • Validated: {String(episode.source.validated)}</span>
        </div>
      </div>
    );
  }

  if (isLocal) {
    // LOCAL ONLY - VLC-style custom player, never for YouTube/Crunchyroll
    const streamFile = episode.source.fileName || file;
    const src = api.streamUrl(streamFile);
    const subtitleEn = api.subtitleUrl(`${animeId}_${version}_ep${episode.episodeNumber}_en.vtt`);
    const subtitleTa = version==="tamil" ? api.subtitleUrl(`${animeId}_${version}_ep${episode.episodeNumber}_ta.vtt`) : null;

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
          style={{background:"#000", width:"100%", height:"100%"}}
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
            <span>LOCAL • {streamFile}</span>
            <span>• VLC-style • 480p/720p • Subtitles: English{version==="tamil"?" + Tamil":""}</span>
          </div>
        </div>
      </>
    );
  }

  // Unknown type - error, never force into one player
  return <div className="error">Playback error: Unknown source type "{type}" — Different source = different player. Check console.log("Playback:", type, videoId, url)</div>;
}
