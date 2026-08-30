import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useState } from "react";

export default function EpisodeList({ catalog, animeId }) {
  const [version, setVersion] = useState(catalog?.versions?.[0]?.key || "sub");
  const [downloading, setDownloading] = useState(null);
  const nav = useNavigate();
  const episodes = catalog?.episodesByVersion?.[version] || [];

  async function handleDownload(ep) {
    // Only local sources are downloadable; for external we block
    if (ep.source.type !== "local") {
      alert("External content = streaming only. Downloads allowed only for owned/local content.");
      return;
    }
    // For demo, local files are already considered downloadable; simulate quality selection
    const quality = prompt("Select quality: 480p / 720p", "720p");
    if (!quality || !["480p","720p"].includes(quality)) return;
    // In V1 local owned content: we simulate a download from an approved sample host if file not yet exists
    // Here we try to call backend with a demo approved URL
    const demoUrl = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";
    const fileName = ep.source.fileName;
    setDownloading(ep.id);
    try {
      const res = await api.download(demoUrl, fileName, quality);
      alert(`Downloaded ${fileName} (${quality}) — ${res.size ? (res.size/1024/1024).toFixed(2)+" MB" : ""}`);
    } catch (e) {
      alert("Download failed: " + e.message);
    } finally { setDownloading(null); }
  }

  function play(ep) {
    nav(`/watch/${animeId}/${version}/${ep.episodeNumber}?id=${ep.id}`);
  }

  return (
    <div className="versions">
      <h3>Available Versions</h3>
      <div className="version-tabs">
        {catalog.versions.map(v=> (
          <button key={v.key} className={`vtab ${version===v.key ? "active": ""}`} onClick={()=> setVersion(v.key)} disabled={!v.available}>
            {v.label} {v.available ? "•" : "×"}
          </button>
        ))}
      </div>
      <div style={{marginTop:10, color:"#9aa0b8", fontSize:12}}>
        {version==="sub" && "Japanese audio + English subtitles"}
        {version==="dub" && "English dubbed audio"}
        {version==="tamil" && "Tamil dubbed (if available) • External streaming only for YouTube/Crunchyroll"}
      </div>

      <div className="episode-list">
        {episodes.map(ep=> (
          <div key={ep.id} className="ep-row">
            <div className="ep-num">{ep.episodeNumber}</div>
            <div className="ep-info">
              <div className="ep-title">{ep.title}</div>
              <div className="ep-sub">
                <span className={`tag ${ep.source.type==="local" ? "tag-local" : ep.source.type==="youtube" ? "tag-yt" : "tag-cr"}`}>
                  {ep.source.type==="local" ? "LOCAL • OWNED" : ep.source.type==="youtube" ? "YOUTUBE" : "CRUNCHYROLL"}
                </span>
                <span>{ep.duration}</span>
                {ep.source.type==="local" && <span>• {ep.source.qualities.join(" / ")}</span>}
              </div>
            </div>
            <div className="ep-actions">
              {ep.source.type==="local" && (
                <button className="btn-sm local" onClick={()=> handleDownload(ep)} disabled={downloading===ep.id}>
                  {downloading===ep.id ? "..." : "⬇ Download"}
                </button>
              )}
              <button className={`btn-sm play`} onClick={()=> play(ep)}>
                {ep.source.type==="crunchyroll" ? "↗ Open" : "▶ Play"}
              </button>
            </div>
          </div>
        ))}
        {!episodes.length && <div className="empty">No episodes for this version</div>}
      </div>

      <div style={{marginTop:12, padding:10, borderRadius:12, background:"rgba(255,171,0,0.08)", border:"1px solid rgba(255,171,0,0.2)", color:"#ffcc66", fontSize:12, lineHeight:1.5}}>
        ⚠️ Constraint: External (YouTube/Crunchyroll) = streaming only. Offline download = only for owned/local content (.mp4 in <code>local_content/videos</code> or <code>downloads</code>). Backend blocks YouTube/Crunchyroll downloads.
      </div>
    </div>
  );
}
