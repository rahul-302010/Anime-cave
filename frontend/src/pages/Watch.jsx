import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import VideoPlayer from "../components/VideoPlayer.jsx";

export default function Watch() {
  const { id, version, episodeNumber } = useParams();
  const [search] = useSearchParams();
  const epId = search.get("id");
  const [episode, setEpisode] = useState(null);
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(()=> {
    async function run(){
      setLoading(true); setError("");
      try {
        const [detail, catalog] = await Promise.all([api.detail(id), api.episodes(id)]);
        setAnime(detail);
        const eps = catalog.episodesByVersion?.[version] || [];
        let ep = eps.find(e=> String(e.episodeNumber)===String(episodeNumber));
        if (!ep && epId) ep = eps.find(e=> e.id===epId);
        if (!ep) throw new Error("Episode not found for version " + version);
        setEpisode(ep);
      } catch(e){ setError(e.message); }
      finally{ setLoading(false); }
    }
    run();
  }, [id, version, episodeNumber, epId]);

  if (loading) return <div className="loading"><div className="spinner"/>Loading player...</div>;
  if (error) return <div className="error">⚠ {error} <Link to={`/anime/${id}`} style={{color:"#7c5cff"}}>← Back</Link></div>;

  const title = anime?.title?.english || anime?.title?.romaji || `Anime ${id}`;

  return (
    <div className="player-wrap">
      <div style={{display:"flex", gap:10, marginBottom:14, flexWrap:"wrap"}}>
        <Link to={`/anime/${id}`} className="nav-btn">‹ {title}</Link>
        <span className="nav-btn" style={{background:"var(--bg-card)"}}>{version.toUpperCase()} • Episode {episode.episodeNumber}</span>
        <span className={`tag ${episode.source.type==="local" ? "tag-local" : episode.source.type==="youtube" ? "tag-yt" : "tag-cr"}`} style={{alignSelf:"center"}}>
          {episode.source.type.toUpperCase()}
        </span>
      </div>

      <div className="player-shell">
        <div className="player-header">
          <h3>{title} — {episode.title} <span style={{color:"#9aa0b8", fontWeight:400}}>({version})</span></h3>
          <span style={{fontSize:12, color:"#9aa0b8"}}>{episode.duration} • {episode.source.type==="local" ? "Local .mp4 • VLC-style" : episode.source.type==="youtube" ? "YouTube Embed" : "Crunchyroll Redirect"}</span>
        </div>
        <div className="player-stage">
          <VideoPlayer episode={episode} animeId={id} version={version} />
        </div>
      </div>

      <div style={{marginTop:14, padding:12, borderRadius:12, background:"var(--bg-card)", border:"1px solid var(--border)", fontSize:12, color:"#9aa0b8", lineHeight:1.6}}>
        <b style={{color:"var(--text)"}}>Hybrid Playback:</b> YouTube → embed player (no download). Crunchyroll → opens in browser (no embed). Local .mp4 → custom dark player with Play/Pause, Seek, Fullscreen, Subtitles (.vtt/.srt EN/TA). Download system only for owned content in <code>local_content/videos</code> or <code>downloads</code>.
      </div>
    </div>
  );
}
