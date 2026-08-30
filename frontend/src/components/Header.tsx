import React from 'react'

export default function Header(){
  return (
    <header style={{display:'flex',alignItems:'center',gap:12,padding:12}}>
      <div style={{fontWeight:800,fontSize:18,marginRight:8}}>ANIME CAVE</div>
      <div style={{flex:1}}>
        <input placeholder="Search anime, movies, episodes..." style={{width:'100%',padding:10,borderRadius:10,border:'1px solid rgba(255,255,255,0.04)',background:'rgba(255,255,255,0.02)',color:'var(--text)'}} />
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className="button">Search</button>
      </div>
    </header>
  )
}
