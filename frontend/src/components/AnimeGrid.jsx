import AnimeCard from "./AnimeCard.jsx";

export default function AnimeGrid({ items, loading }) {
  if (loading) return <div className="loading"><div className="spinner"/><div>Loading cave...</div></div>;
  if (!items?.length) return <div className="empty">No anime found. Try another search.</div>;
  return <div className="grid">{items.map(a=> <AnimeCard key={a.id} a={a}/>)}</div>;
}
