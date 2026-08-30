import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Header({ onSearch }) {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const loc = useLocation();

  function submit(e) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    onSearch?.(q.trim());
    nav(`/?q=${encodeURIComponent(q.trim())}`);
  }

  const isActive = (p) => loc.pathname === p;

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#ff3b5c,#7c5cff)",display:"grid",placeItems:"center",color:"white",fontWeight:800}}>AC</span>
        Anime <span>Cave</span> <span className="badge" style={{marginLeft:6}}>V1</span>
      </Link>

      <form onSubmit={submit} className="header-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20L16 16"/></svg>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search anime — e.g. Naruto, One Piece, Demon Slayer" />
      </form>

      <nav className="header-nav">
        <Link className={`nav-btn ${isActive("/") ? "active": ""}`} to="/">Discover</Link>
        <Link className={`nav-btn ${isActive("/downloads") ? "active": ""}`} to="/downloads">Downloads</Link>
        <span className="nav-btn" style={{background:"rgba(124,92,255,0.12)", color:"#b9a7ff", borderColor:"rgba(124,92,255,0.3)"}}>Desktop • Electron</span>
      </nav>
    </header>
  );
}
