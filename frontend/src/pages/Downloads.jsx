import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { Link } from "react-router-dom";

export default function Downloads() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(){
    setLoading(true); setError("");
    try {
      const data = await api.library();
      setFiles(data.files || []);
    } catch(e){ setError(e.message); }
    finally{ setLoading(false); }
  }
  useEffect(()=> { load(); }, []);

  async function del(f){
    if(!confirm(`Delete ${f.fileName}?`)) return;
    try { await api.deleteDownload(f.fileName); load(); } catch(e){ alert(e.message); }
  }

  return (
    <div className="library">
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <h2>📁 Downloaded Library <span style={{color:"#9aa0b8", fontWeight:400, fontSize:14}}>({files.length} files)</span></h2>
        <button className="btn-primary" onClick={load}>↻ Refresh</button>
      </div>

      <div style={{marginTop:10, padding:10, borderRadius:12, background:"rgba(0,230,118,0.08)", border:"1px solid rgba(0,230,118,0.2)", color:"#b6f5d6", fontSize:12}}>
        Offline = only for owned/legal content. Files stored in <code>downloads/</code> and <code>local_content/videos/</code>. Served via <code>/api/downloads/stream/:fileName</code> with Range support.
      </div>

      {error && <div className="error" style={{margin:"14px 0"}}>⚠ {error}</div>}
      {loading ? <div className="loading"><div className="spinner"/>Scanning library...</div> :
        files.length===0 ? (
          <div className="empty" style={{marginTop:14}}>
            <div style={{fontSize:18, fontWeight:700}}>No offline videos yet</div>
            <p style={{marginTop:6}}>Download only from approved sources (sample-videos etc.). YouTube/Crunchyroll are streaming-only.</p>
            <p style={{marginTop:8, fontSize:12, color:"#9aa0b8"}}>Tip: Place your owned .mp4 files in <code>local_content/videos</code> named like <code>21_sub_ep1.mp4</code> or use the Download button on a LOCAL episode (it will fetch a demo approved file).</p>
            <Link to="/" className="btn-primary" style={{display:"inline-flex", marginTop:12, textDecoration:"none"}}>Discover anime</Link>
          </div>
        ) : (
          <div className="lib-grid">
            {files.map(f=> (
              <div key={f.fileName} className="lib-card">
                <div style={{width:42,height:42,borderRadius:10,background:"linear-gradient(135deg,#00e676,#00b8a9)",display:"grid",placeItems:"center",color:"#00110a",fontWeight:800}}>▶</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{f.fileName}</div>
                  <div style={{fontSize:12, color:"#9aa0b8"}}>
                    {f.animeId ? `Anime ${f.animeId} • ${f.version} • EP ${f.episodeNumber}` : f.dir} • {f.sizeMB} MB
                  </div>
                </div>
                <div className="lib-actions">
                  <a href={f.streamUrl} target="_blank" rel="noreferrer" className="btn-sm local" style={{textDecoration:"none", display:"inline-flex"}}>Play</a>
                  <button className="btn-sm" onClick={()=> del(f)} style={{color:"#ff5c7a", borderColor:"rgba(255,92,122,0.3)"}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

      <div style={{marginTop:16}}>
        <h3 style={{fontSize:14, color:"#9aa0b8", letterSpacing:"0.06em", textTransform:"uppercase"}}>How downloads work (V1)</h3>
        <ol style={{marginTop:8, paddingLeft:18, color:"#cbd0e8", lineHeight:1.7, fontSize:13}}>
          <li>Go to Anime Detail → pick LOCAL version episode → click <b>⬇ Download</b> → choose 480p/720p</li>
          <li>Backend validates <code>APPROVED_DOWNLOAD_HOSTS</code> and blocks YouTube/Crunchyroll</li>
          <li>File saved to <code>downloads/</code>, appears here, playable offline via custom player (<code>/api/downloads/stream</code> with Range)</li>
          <li>Subtitles: place <code>.vtt</code> in <code>local_content/subtitles</code> named <code>{'{animeId}'}_{'{version}'}_ep{'{n}'}_en.vtt</code></li>
        </ol>
      </div>
    </div>
  );
}
