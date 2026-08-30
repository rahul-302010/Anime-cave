import React, {useState, useEffect} from 'react'
import Header from '../components/Header'
import LeftNav from '../components/LeftNav'
import Hero from '../components/Hero'
import {search} from '../api/client'

export default function ExplorePage(){
  const [results,setResults]=useState<any[]>([])
  useEffect(()=>{ search('naruto').then(r=>setResults(r.results||[])) },[])
  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <LeftNav />
      <div style={{flex:1}}>
        <Header />
        <div className="container">
          <Hero />
          <h2 style={{color:'var(--subtext)'}}>Results</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
            {results.map((it,i)=> (
              <div key={i} className="card">
                <strong>{it.title||it.id}</strong>
                <div style={{color:'var(--subtext)',fontSize:13}}>{it.source}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
