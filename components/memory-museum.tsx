'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Html, Sparkles } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ArrowUpRight, Heart, Music2, Pause, Play, Volume2, X } from 'lucide-react'

type Memory = { title: string; date: string; note: string; color: string; position: [number, number, number]; rotation?: number }

const memories: Memory[] = [
  { title: 'The beginning', date: 'A little moment, forever ours', note: 'Somehow, the ordinary days became my favorite story. I would choose every beginning with you, again and again.', color: '#d9a18a', position: [-3.2, 2.15, -5.8] },
  { title: 'Our kind of happy', date: 'The days that feel like home', note: 'The laughter that lasts too long, the little glances, and all the tiny things only we understand.', color: '#bd8c74', position: [0, 2.15, -5.8] },
  { title: 'Somewhere together', date: 'A place we found along the way', note: 'Everywhere is a little more beautiful when I get to see it with you.', color: '#e2bd92', position: [3.2, 2.15, -5.8] },
  { title: 'A favorite day', date: 'One for the books', note: 'I hope we keep collecting days like this—soft, silly, and completely ours.', color: '#d99c9b', position: [-5.8, 2.15, -1.7], rotation: Math.PI / 2 },
  { title: 'Little things', date: 'The best parts are often the smallest', note: 'Your smile across a room. A song in the car. Being right where I belong: next to you.', color: '#c9a6ba', position: [5.8, 2.15, -1.7], rotation: -Math.PI / 2 },
  { title: 'Still choosing you', date: 'Today, and all the days after', note: 'This little world is only a tiny way to say how much I love the world we make together.', color: '#e5b48f', position: [0, 2.15, 5.8] },
]

function Frame({ memory, onOpen }: { memory: Memory; onOpen: (memory: Memory) => void }) {
  const ref = useRef<THREE.Group>(null)
  return <group ref={ref} position={memory.position} rotation={[0, memory.rotation ?? 0, 0]} onClick={(event) => { event.stopPropagation(); onOpen(memory) }}>
    <mesh><boxGeometry args={[1.55, 1.55, 0.14]} /><meshStandardMaterial color="#b68b56" metalness={0.48} roughness={0.32} /></mesh>
    <mesh position={[0, 0, 0.085]}><boxGeometry args={[1.32, 1.32, 0.035]} /><meshStandardMaterial color="#f3e8d6" /></mesh>
    <mesh position={[0, 0, 0.11]}><planeGeometry args={[1.12, 1.12]} /><meshStandardMaterial color={memory.color} roughness={0.9} /></mesh>
    <mesh position={[0, 0, 0.13]}><circleGeometry args={[0.28, 32]} /><meshStandardMaterial color="#f5d7c9" roughness={1} /></mesh>
    <mesh position={[-0.24, -0.2, 0.135]}><circleGeometry args={[0.13, 24]} /><meshStandardMaterial color="#8b5e55" roughness={1} /></mesh>
    <mesh position={[0.22, -0.2, 0.135]}><circleGeometry args={[0.13, 24]} /><meshStandardMaterial color="#71554e" roughness={1} /></mesh>
    <mesh position={[0, -0.42, 0.14]}><boxGeometry args={[0.32, 0.06, 0.012]} /><meshStandardMaterial color="#f1c7aa" /></mesh>
    <pointLight position={[0, 0, 0.65]} color={memory.color} intensity={0.45} distance={2.4} />
    <Html position={[0, -0.98, 0.1]} center distanceFactor={8} className="frame-label"><span>{memory.title}</span></Html>
  </group>
}

function Player() {
  const group = useRef<THREE.Group>(null)
  const keys = useRef<Record<string, boolean>>({})
  const angle = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const cameraOffset = new THREE.Vector3()
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    const pointerDown = (e: PointerEvent) => { if (e.button === 2) { dragging.current = true; lastX.current = e.clientX } }
    const pointerMove = (e: PointerEvent) => { if (dragging.current) { angle.current -= (e.clientX - lastX.current) * 0.006; lastX.current = e.clientX } }
    const pointerUp = () => { dragging.current = false }
    const context = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    window.addEventListener('pointerdown', pointerDown); window.addEventListener('pointermove', pointerMove); window.addEventListener('pointerup', pointerUp); window.addEventListener('contextmenu', context)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('pointerdown', pointerDown); window.removeEventListener('pointermove', pointerMove); window.removeEventListener('pointerup', pointerUp); window.removeEventListener('contextmenu', context) }
  }, [])
  useFrame((state, delta) => {
    if (!group.current) return
    const k = keys.current
    const forward = Number(k.w || k.arrowup) - Number(k.s || k.arrowdown)
    const side = Number(k.d || k.arrowright) - Number(k.a || k.arrowleft)
    const isMoving = !!(forward || side)
    if (isMoving) {
      const speed = k.shift ? 4.5 : 2.6
      const direction = new THREE.Vector3(side, 0, -forward).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle.current)
      group.current.position.addScaledVector(direction, speed * delta)
      group.current.position.x = THREE.MathUtils.clamp(group.current.position.x, -4.95, 4.95)
      group.current.position.z = THREE.MathUtils.clamp(group.current.position.z, -4.95, 4.95)
      group.current.rotation.y = Math.atan2(direction.x, direction.z)
    }
    const target = group.current.position.clone().add(new THREE.Vector3(0, 1.3, 0))
    cameraOffset.set(Math.sin(angle.current) * 6.5, 4.1, Math.cos(angle.current) * 6.5)
    state.camera.position.lerp(target.clone().add(cameraOffset), 1 - Math.exp(-delta * 3))
    state.camera.lookAt(target)
    const bob = isMoving ? Math.sin(state.clock.elapsedTime * 12) * 0.035 : 0
    group.current.position.y = bob
  })
  return <group ref={group}>
    <mesh position={[0, 1.02, 0]} castShadow><capsuleGeometry args={[0.32, 0.72, 6, 12]} /><meshStandardMaterial color="#7b5360" roughness={0.8} /></mesh>
    <mesh position={[0, 1.72, 0]} castShadow><sphereGeometry args={[0.25, 24, 24]} /><meshStandardMaterial color="#edc6ad" roughness={0.9} /></mesh>
    <mesh position={[0, 1.78, -0.04]}><sphereGeometry args={[0.27, 24, 24]} /><meshStandardMaterial color="#4b3531" roughness={0.95} /></mesh>
    <mesh position={[0, 1.35, 0.29]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#edc6ad" /></mesh>
  </group>
}

function MuseumScene({ onOpen }: { onOpen: (memory: Memory) => void }) {
  return <Canvas shadows camera={{ position: [0, 4, 8], fov: 48 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
    <color attach="background" args={['#211b20']} />
    <fog attach="fog" args={['#211b20', 14, 29]} />
    <ambientLight intensity={0.65} color="#ffe7d5" />
    <directionalLight position={[-3, 8, 4]} intensity={1.6} color="#ffe1c2" castShadow shadow-mapSize={[1024, 1024]} />
    <Environment preset="lobby" />
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow><planeGeometry args={[13, 13]} /><meshStandardMaterial color="#725b55" roughness={0.3} metalness={0.16} /></mesh>
      <gridHelper args={[12, 24, '#b18a70', '#937768']} position={[0, -0.1, 0]} />
      <mesh position={[0, 0.2, -6.2]}><boxGeometry args={[12.5, 5, 0.3]} /><meshStandardMaterial color="#3d3032" roughness={0.82} /></mesh>
      <mesh position={[-6.2, 0.2, 0]}><boxGeometry args={[0.3, 5, 12.5]} /><meshStandardMaterial color="#3d3032" roughness={0.82} /></mesh>
      <mesh position={[6.2, 0.2, 0]}><boxGeometry args={[0.3, 5, 12.5]} /><meshStandardMaterial color="#3d3032" roughness={0.82} /></mesh>
      <mesh position={[0, 0.2, 6.2]}><boxGeometry args={[12.5, 5, 0.3]} /><meshStandardMaterial color="#3d3032" roughness={0.82} /></mesh>
      <mesh position={[0, 2.75, 0]}><boxGeometry args={[12.5, 0.15, 12.5]} /><meshStandardMaterial color="#2c2429" roughness={0.8} /></mesh>
      {[-4.4, 0, 4.4].map((x) => <group key={x}><mesh position={[x, 2.61, -3]}><cylinderGeometry args={[0.045, 0.045, 5.2, 12]} /><meshStandardMaterial color="#d8ad75" emissive="#a36c38" emissiveIntensity={0.7} /></mesh><pointLight position={[x, 2.4, -2.7]} intensity={1.15} color="#ffcc94" distance={7} /></group>)}
      {memories.map((memory) => <Frame key={memory.title} memory={memory} onOpen={onOpen} />)}
      <group position={[0, 0, 3.5]}><mesh position={[0, 1, 0]} castShadow><capsuleGeometry args={[0.34, 0.72, 6, 12]} /><meshStandardMaterial color="#334756" roughness={0.8} /></mesh><mesh position={[0, 1.7, 0]} castShadow><sphereGeometry args={[0.26, 24, 24]} /><meshStandardMaterial color="#d7a988" roughness={0.85} /></mesh><mesh position={[0, 1.76, -0.04]}><sphereGeometry args={[0.28, 24, 24]} /><meshStandardMaterial color="#302523" roughness={0.95} /></mesh><pointLight position={[0, 2.3, 0]} color="#f5ba92" intensity={0.7} distance={3} /></group>
      <Player />
      <Sparkles count={48} scale={[11, 4, 11]} size={1.8} speed={0.18} opacity={0.48} color="#f8d9b5" />
    </group>
  </Canvas>
}

export function MemoryMuseum() {
  const [started, setStarted] = useState(false)
  const [selected, setSelected] = useState<Memory | null>(null)
  const [dialogue, setDialogue] = useState(false)
  const [sound, setSound] = useState(false)
  const handleKey = useCallback((event: KeyboardEvent) => { if (event.key.toLowerCase() === 'e' && !selected) setDialogue(true); if (event.key === 'Escape') { setSelected(null); setDialogue(false) } }, [selected])
  useEffect(() => { window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey) }, [handleKey])
  return <main className="museum-shell">
    <div className="museum-world"><Suspense fallback={<div className="loading-world">Preparing your little world…</div>}><MuseumScene onOpen={setSelected} /></Suspense></div>
    <header className="game-topbar"><a className="brand-mark" href="#home" aria-label="Our Little World home"><span className="brand-heart"><Heart size={15} fill="currentColor" /></span><span>OUR LITTLE WORLD<small>A MEMORY MUSEUM</small></span></a><div className="topbar-right"><span className="chapter-tag"><span className="live-dot" />CHAPTER 01 <i>/</i> THE BEGINNING</span><button className="icon-button" aria-label={sound ? 'Mute music' : 'Enable music'} onClick={() => setSound(!sound)}><Volume2 size={17} /></button></div></header>
    {started && <><div className="chapter-heading"><span className="eyebrow">GALLERY ONE</span><h1>The beginning<span className="heading-period">.</span></h1><p>Every great story has a first page.</p></div><aside className="gallery-index"><div className="index-title">YOUR STORY</div>{['The beginning', 'Our favorite days', 'Little things', 'A place for us'].map((room, index) => <div className={`index-row ${index === 0 ? 'is-active' : ''}`} key={room}><span className="index-number">0{index + 1}</span>{room}{index === 3 && <span className="locked-mark">✦</span>}</div>)}</aside><div className="controls-hint"><div className="key-cluster"><kbd>W</kbd><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div><span>TO WANDER</span><span className="control-divider" /><kbd className="key-wide">SHIFT</kbd><span>TO HURRY</span><span className="control-divider" /><span className="mouse-symbol">↔</span><span>DRAG TO LOOK</span></div><div className="memory-count"><span>MEMORIES FOUND</span><strong>01 <i>/</i> 06</strong><div className="count-track"><span /></div></div><button className="npc-prompt" onClick={() => setDialogue(true)}><span className="npc-heart"><Heart size={16} /></span><span>Someone is waiting for you<small>Press E to say hello</small></span><ArrowUpRight size={16} /></button></>}
    {!started && <div className="welcome-overlay" id="home"><div className="welcome-card"><div className="welcome-kicker"><span /> A LITTLE WORLD, MADE FOR YOU</div><div className="welcome-heart"><Heart size={18} fill="currentColor" /></div><h1>Our Little<br /><em>World.</em></h1><p>A walk through all the little moments that became our favorite story.</p><button className="enter-button" onClick={() => setStarted(true)}>Step inside <ArrowUpRight size={17} /></button><div className="welcome-footnote">TAKE YOUR TIME · THERE&apos;S NO RUSH</div></div><div className="welcome-side-note">A PLACE TO REMEMBER, AND TO DREAM A LITTLE MORE <span>✳</span></div></div>}
    {started && selected && <div className="memory-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="memory-modal" role="dialog" aria-modal="true" aria-labelledby="memory-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Close memory"><X size={18} /></button><div className="modal-art" style={{ background: `radial-gradient(circle at 50% 45%, #f4d4c3 0 12%, ${selected.color} 13% 43%, #70554d 100%)` }}><div className="modal-art-halo" /><span>OUR LITTLE MOMENT</span></div><div className="modal-copy"><span className="eyebrow">A MEMORY TO KEEP</span><h2 id="memory-title">{selected.title}</h2><p className="modal-date">{selected.date}</p><div className="modal-rule" /><p className="modal-note">{selected.note}</p><button className="keep-button" onClick={() => setSelected(null)}>Keep this close <Heart size={15} /></button></div></section></div>}
    {started && dialogue && <div className="memory-backdrop" role="presentation" onClick={() => setDialogue(false)}><section className="dialogue-card" role="dialog" aria-modal="true" aria-labelledby="dialogue-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setDialogue(false)} aria-label="Close"><X size={18} /></button><div className="dialogue-icon"><Heart size={22} fill="currentColor" /></div><span className="eyebrow">A NOTE FROM ME</span><h2 id="dialogue-title">Hey, you.</h2><p>I made this little place for us. Every corner holds a piece of my favorite story — the one where I get to love you.</p><p className="dialogue-signoff">Happy birthday, my love. <Heart size={13} fill="currentColor" /></p><button className="keep-button" onClick={() => setDialogue(false)}>Let&apos;s keep wandering <ArrowUpRight size={15} /></button></section></div>}
    {started && <button className="music-toggle" aria-label="Toggle soundtrack" onClick={() => setSound(!sound)}>{sound ? <Pause size={15} /> : <Play size={15} />}<Music2 size={15} /><span>{sound ? 'MUSIC ON' : 'SOUND OFF'}</span></button>}
    <div className="scene-vignette" aria-hidden="true" />
  </main>
}
