import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import AnimeGrid from "../components/AnimeGrid.jsx";

export default function Home({ searchQuery }) {
  const [params] = useSearchParams();
  const q = params.get("q") || searchQuery || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [mode, setMode] = useState("trending");

  async function load(p=1, query = q) {
    setLoading(true); setError("");
    try {
      if (query && query.length >=2) {
        setMode("search");
        const data = await api.search(query, p, 20);
        setItems(data.media || []);
        setHasNext(data.pageInfo?.hasNextPage);
      } else {
        setMode("trending");
        const data = await api.trending(p, 20);
        setItems(data.media || []);
        setHasNext(data.pageInfo?.hasNextPage);
      }
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  useEffect(()=> { load(1, q); }, [q]);
  // also react to external searchQuery prop
  useEffect(()=> { if (searchQuery) load(1, searchQuery); }, [searchQuery]);

  return (
    <div>
      <div className="hero">
        <div>
          <h1>Enter the <span style={{background:"linear-gradient(135deg,#ff3b5c,#7c5cff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Cave</span> — Stream. Own. Offline.</h1>
          <p>Desktop-first anime streaming. Hybrid playback: YouTube embed + Crunchyroll redirect for external, local .mp4 with VLC-style player + offline downloads only for owned content. Powered by AniList.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={()=> load(1, "")}>↻ Trending</button>
            <button className="btn-ghost" onClick={()=> document.querySelector('.header-search input')?.focus()}>⌕ Search anime</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat"><b>V1</b><span>Stable</span></div>
          <div className="stat"><b>3</b><span>Versions</span></div>
          <div className="stat"><b>2</b><span>Qualities</span></div>
        </div>
      </div>

      {error && <div className="error">⚠ {error} — check backend is running on http://localhost:4000</div>}
      {q && <div className="search-hint">Search results for <b>“{q}”</b> • <span style={{color:"#7c5cff"}}>{mode}</span></div>}

      <div className="section">
        <div className="section-head">
          <h2>{mode==="search" ? `Search — ${q}` : "🔥 Trending Now"}</h2>
          <div style={{display:"flex", gap:8}}>
            <button className="nav-btn" disabled={page<=1} onClick={()=> load(page-1)}>‹ Prev</button>
            <span className="nav-btn" style={{background:"var(--bg-soft)"}}>Page {page}</span>
            <button className="nav-btn" disabled={!hasNext} onClick={()=> load(page+1)}>Next ›</button>
          </div>
        </div>
        <AnimeGrid items={items} loading={loading} />
      </div>

      <div style={{padding:"0 22px 22px", color:"#9aa0b8", fontSize:12, display:"flex", gap:10, flexWrap:"wrap"}}>
        <span>✓ Backend proxies AniList (no direct URLs exposed)</span>
        <span>•</span>
        <span>External = streaming only</span>
        <span>•</span>
        <span>Offline = owned/local only</span>
        <span>•</span>
        <span>Subtitles: .vtt / .srt (EN, TA)</span>
      </div>
    </div>
  );
}
