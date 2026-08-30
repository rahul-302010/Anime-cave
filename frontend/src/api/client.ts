export async function search(q:string, adapter='muse_india'){
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&adapter=${encodeURIComponent(adapter)}`)
  return res.json()
}

export async function resolveUrl(url:string, adapter='muse_india'){
  const res = await fetch(`/api/resolve?url=${encodeURIComponent(url)}&adapter=${encodeURIComponent(adapter)}`)
  return res.json()
}

export async function playInVlc(url:string, adapter='muse_india'){
  const res = await fetch(`/api/player/play?url=${encodeURIComponent(url)}&adapter=${encodeURIComponent(adapter)}`,{method:'POST'})
  return res.json()
}

export async function queueDownload(url:string, adapter='muse_india'){
  const res = await fetch(`/api/download?url=${encodeURIComponent(url)}&adapter=${encodeURIComponent(adapter)}`,{method:'POST'})
  return res.json()
}
