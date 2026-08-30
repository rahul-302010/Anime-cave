import { Link } from "react-router-dom";

export default function AnimeCard({ a }) {
  const title = a.title?.english || a.title?.romaji || "Untitled";
  const img = a.coverImage?.extraLarge || a.coverImage?.large;
  return (
    <Link to={`/anime/${a.id}`} className="card">
      <div className="card-img">
        <img src={img} alt={title} loading="lazy" />
        {a.averageScore ? <span className="score">★ {a.averageScore/10}</span> : null}
        {a.episodes ? <span className="ep">{a.episodes} EP</span> : <span className="ep">{a.format}</span>}
      </div>
      <div className="card-body">
        <div className="card-title">{title}</div>
        <div className="card-meta">
          <span>{a.seasonYear || a.season || ""}</span>
          {a.status ? <span>• {a.status}</span> : null}
        </div>
        <div style={{display:"flex", gap:6, marginTop:6, flexWrap:"wrap"}}>
          {(a.genres||[]).slice(0,2).map(g=> <span key={g} className="genre">{g}</span>)}
        </div>
      </div>
    </Link>
  );
}
