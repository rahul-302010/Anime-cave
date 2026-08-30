import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import EpisodeList from "../components/EpisodeList.jsx";

export default function Detail() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(()=> {
    let alive = true;
    async function run(){
      setLoading(true); setError("");
      try {
        const [detail, eps] = await Promise.all([api.detail(id), api.episodes(id)]);
        if(!alive) return;
        setAnime(detail);
        setCatalog(eps);
      } catch(e){ if(alive) setError(e.message); }
      finally { if(alive) setLoading(false); }
    }
    run();
    return ()=> { alive=false; };
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner"/>Loading detail...</div>;
  if (error) return <div className="error">⚠ {error}</div>;
  if (!anime) return <div className="empty">Not found</div>;

  const title = anime.title?.english || anime.title?.romaji || "Untitled";
  const desc = anime.description ? anime.description.replace(/<[^>]*>/g, "") : "No description.";

  return (
    <div>
      <div style={{padding:"12px 22px"}}>
        <Link to="/" className="nav-btn" style={{display:"inline-flex"}}>‹ Back to Discover</Link>
      </div>

      <div className="detail">
        <div className="detail-cover">
          <img src={anime.coverImage?.extraLarge || anime.coverImage?.large} alt={title} />
          {anime.bannerImage && <img src={anime.bannerImage} alt="banner" style={{height:80, objectFit:"cover", opacity:0.9}} />}
        </div>

        <div className="detail-info">
          <h1>{title}</h1>
          {anime.title?.native && <div style={{color:"#9aa0b8", marginTop:4}}>{anime.title.native} • {anime.title.romaji}</div>}

          <div className="detail-meta">
            {anime.averageScore && <span>★ {anime.averageScore/10}</span>}
            {anime.episodes && <span>{anime.episodes} episodes</span>}
            {anime.duration && <span>{anime.duration} min / ep</span>}
            {anime.status && <span>{anime.status}</span>}
            {anime.seasonYear && <span>{anime.season} {anime.seasonYear}</span>}
            {anime.format && <span>{anime.format}</span>}
          </div>

          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
            {(anime.genres||[]).map(g=> <span key={g} className="genre">{g}</span>)}
          </div>

          {anime.trailer?.site==="youtube" && (
            <div style={{marginBottom:12}}>
              <a href={`https://youtube.com/watch?v=${anime.trailer.id}`} target="_blank" rel="noreferrer" className="btn-sm yt" style={{display:"inline-flex", textDecoration:"none"}}>▶ Trailer (YouTube)</a>
              {anime.studios?.nodes?.[0]?.name && <span style={{marginLeft:10, color:"#9aa0b8", fontSize:12}}>Studio: {anime.studios.nodes[0].name}</span>}
            </div>
          )}

          <div className="detail-desc">{desc}</div>

          {catalog ? <EpisodeList catalog={catalog} animeId={id} /> : <div className="loading">Loading episodes...</div>}
        </div>
      </div>
    </div>
  );
}
