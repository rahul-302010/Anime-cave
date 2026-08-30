import React from 'react'

const items = ['Explore','Search','Popular','New Releases','Genres','Collections','Watchlist','History','Downloads']
export default function LeftNav(){
  return (
    <nav style={{width:240,background:'rgba(0,0,0,0.6)',padding:12,color:'var(--subtext)',minHeight:'100vh'}}>
      <div style={{fontWeight:800,fontSize:16,color:'var(--text)',marginBottom:12}}>ANIME CAVE</div>
      <ul style={{listStyle:'none',padding:0,margin:0}}>
        {items.map(i=> <li key={i} style={{padding:'8px 6px',borderRadius:8,marginBottom:6,background:'transparent'}}>{i}</li>)}
      </ul>
    </nav>
  )
}
