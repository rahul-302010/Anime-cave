import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Detail from "./pages/Detail.jsx";
import Watch from "./pages/Watch.jsx";
import Downloads from "./pages/Downloads.jsx";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <BrowserRouter>
      <Header onSearch={setSearchQuery} />
      <Routes>
        <Route path="/" element={<Home searchQuery={searchQuery} />} />
        <Route path="/anime/:id" element={<Detail />} />
        <Route path="/watch/:id/:version/:episodeNumber" element={<Watch />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="*" element={<div className="empty" style={{margin:22}}>404 — Not found <a href="/" style={{color:"#7c5cff"}}>Go home</a></div>} />
      </Routes>
      <footer style={{padding:"22px", textAlign:"center", color:"#9aa0b8", fontSize:12, borderTop:"1px solid #2a2a45", marginTop:22}}>
        Anime Cave V1 • React + Vite + Express + Electron • AniList API • Hybrid Playback • <span style={{color:"#ff3b5c"}}>Working system &gt; fancy features</span> • Future: ARISE voice assistant
      </footer>
    </BrowserRouter>
  );
}
