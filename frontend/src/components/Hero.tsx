import React from 'react'

export default function Hero(){
  return (
    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16}}>
      <div style={{flex:1}} className="card">
        <h1 style={{margin:0,fontSize:36}}>Solo Leveling</h1>
        <p style={{color:'var(--subtext)'}}>Season 2 - Episode 8<br/>The gates have opened and the hunters must rise.</p>
        <div style={{marginTop:12}}>
          <button className="button">Watch Now</button>
          <button style={{marginLeft:8,background:'transparent',border:'1px solid rgba(255,255,255,0.06)',color:'var(--text)',padding:'8px 10px',borderRadius:8}}>Watchlist</button>
        </div>
      </div>
      <div style={{width:320,height:180,borderRadius:10,background:'linear-gradient(90deg, rgba(255,0,120,0.06), rgba(90,44,223,0.06))'}}>
        {/* poster placeholder */}
      </div>
    </div>
  )
}
