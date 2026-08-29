import { useEffect, useRef } from 'react'

/**
 * ThreeHero – decorative Three.js canvas behind header.
 * Lazy import, pauses when off-screen or prefers-reduced-motion.
 * Stub respects docs/MOTION_AND_INTERACTIONS.md
 */
export default function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) return
    let renderer: any
    let scene: any
    let camera: any
    let points: any
    let frame = 0
    let stopped = false
    let observer: IntersectionObserver | null = null

    const init = async () => {
      try {
        const THREE = await import('three')
        const mount = mountRef.current
        if (!mount) return
        const width = mount.clientWidth || window.innerWidth
        const height = 280
        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
        camera.position.z = 4

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '280px'
        renderer.domElement.style.display = 'block'
        mount.appendChild(renderer.domElement)

        // Points / mist
        const count = 800
        const geo = new THREE.BufferGeometry()
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count * 3; i++) {
          pos[i] = (Math.random() - 0.5) * 10
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        const mat = new THREE.PointsMaterial({
          size: 0.03,
          color: 0x7c3aed,
          transparent: true,
          opacity: 0.6,
          sizeAttenuation: true,
        })
        points = new THREE.Points(geo, mat)
        scene.add(points)

        // Secondary cyan points
        const geo2 = new THREE.BufferGeometry()
        const pos2 = new Float32Array(400 * 3)
        for (let i = 0; i < 400 * 3; i++) pos2[i] = (Math.random() - 0.5) * 8
        geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3))
        const mat2 = new THREE.PointsMaterial({ size: 0.02, color: 0x00e5cc, transparent: true, opacity: 0.35 })
        const points2 = new THREE.Points(geo2, mat2)
        scene.add(points2)

        let mouseX = 0
        let mouseY = 0
        const onMove = (e: MouseEvent) => {
          mouseX = (e.clientX / window.innerWidth - 0.5) * 0.06 * 6
          mouseY = (e.clientY / 280 - 0.5) * 0.06 * 6
          if (points) {
            points.rotation.y += (mouseX - points.rotation.y) * 0.06
            points.rotation.x += (mouseY - points.rotation.x) * 0.06
          }
        }
        window.addEventListener('mousemove', onMove)

        const animate = () => {
          if (stopped) return
          frame = requestAnimationFrame(animate)
          if (points) points.rotation.y += 0.0006
          if (document.hidden) return
          renderer.render(scene, camera)
        }
        animate()

        // Pause when off-screen
        observer = new IntersectionObserver(
          (entries) => {
            const vis = entries[0]?.isIntersecting
            if (!vis) stopped = true
            else {
              if (stopped) {
                stopped = false
                animate()
              }
            }
          },
          { threshold: 0 }
        )
        observer.observe(mount)

        // Handle resize
        const onResize = () => {
          if (!mount || !renderer || !camera) return
          const w = mount.clientWidth
          camera.aspect = w / 280
          camera.updateProjectionMatrix()
          renderer.setSize(w, 280)
        }
        window.addEventListener('resize', onResize)

        return () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('resize', onResize)
        }
      } catch {
        // fallback: no Three.js
      }
    }
    init()
    return () => {
      stopped = true
      if (frame) cancelAnimationFrame(frame)
      if (observer) observer.disconnect()
      if (renderer && mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
        renderer.dispose()
      }
    }
  }, [reduceMotion])

  if (reduceMotion) {
    return (
      <div
        style={{
          height: 280,
          background: 'linear-gradient(180deg, rgba(124,58,237,0.12) 0%, rgba(0,229,204,0.06) 50%, transparent 100%)',
          borderBottom: '1px solid rgba(237,233,254,0.06)',
        }}
      />
    )
  }

  return (
    <div
      ref={mountRef}
      style={{
        height: 280,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0A0A12 0%, #12121F 100%)',
        borderBottom: '1px solid rgba(237,233,254,0.06)',
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', opacity: 0.9 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 600, letterSpacing: '0.12em', color: '#EDE9FE' }}>ANIME CAVE</div>
          <div style={{ fontSize: 12, color: '#A1A1B5', letterSpacing: '0.08em', marginTop: 4 }}>Local-first · English · தமிழ்</div>
        </div>
      </div>
    </div>
  )
}
