'use client'

import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Heart, Volume2, VolumeX } from 'lucide-react'
import { memories, type InteractTarget, type Memory } from './museum/data'
import { input, isTypingTarget, resetInput } from './museum/input'
import { MuseumScene } from './museum/scene'
import { FallbackGallery, MemoryModal, NoteModal, WelcomeOverlay } from './museum/overlays'
import { Joystick } from './museum/joystick'
import { useSoundtrack } from './museum/use-soundtrack'

class GraphicsBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFail() }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function MemoryMuseum() {
  const [started, setStarted] = useState(false)
  const [selected, setSelected] = useState<Memory | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [sound, setSound] = useState(false)
  const [found, setFound] = useState<Set<string>>(() => new Set())
  const [target, setTarget] = useState<InteractTarget>(null)
  const [graphicsFailed, setGraphicsFailed] = useState(false)

  useSoundtrack(sound)

  useEffect(() => {
    if (!supportsWebGL()) setGraphicsFailed(true)
  }, [])

  const complete = found.size === memories.length
  const modalOpen = !!selected || noteOpen

  const openMemory = useCallback((memory: Memory) => {
    resetInput()
    setSelected(memory)
    setFound((previous) => (previous.has(memory.id) ? previous : new Set(previous).add(memory.id)))
  }, [])

  const openNote = useCallback(() => {
    resetInput()
    setNoteOpen(true)
  }, [])

  const closeAll = useCallback(() => {
    setSelected(null)
    setNoteOpen(false)
  }, [])

  const interact = useCallback(() => {
    if (target?.kind === 'memory') openMemory(target.memory)
    else openNote()
  }, [target, openMemory, openNote])

  useEffect(() => {
    if (!started) return
    const down = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'escape') { closeAll(); return }
      if (modalOpen) return
      if (key === 'e' && !event.repeat && target) { interact(); return }
      if (key.startsWith('arrow') || key === ' ') event.preventDefault()
      input.keys[key] = true
    }
    const up = (event: KeyboardEvent) => { input.keys[event.key.toLowerCase()] = false }
    const blur = () => resetInput()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [started, modalOpen, target, interact, closeAll])

  const fallback = <FallbackGallery memories={memories} found={found} onOpen={openMemory} />
  const show3d = started && !graphicsFailed
  const selectedIndex = selected ? memories.findIndex((memory) => memory.id === selected.id) : -1

  const prompt = target?.kind === 'memory'
    ? { title: target.memory.title, hint: 'Press E or tap to look closer' }
    : target?.kind === 'npc'
      ? { title: complete ? 'They have one more thing to say' : 'Someone is waiting for you', hint: 'Press E or tap to say hello' }
      : null

  return (
    <main className="museum-shell">
      <div className="museum-world">
        {graphicsFailed ? fallback : (
          <GraphicsBoundary fallback={fallback} onFail={() => setGraphicsFailed(true)}>
            <Suspense fallback={<div className="loading-world">Preparing your little world…</div>}>
              <MuseumScene paused={!started || modalOpen} target={target} onOpen={openMemory} onTargetChange={setTarget} />
            </Suspense>
          </GraphicsBoundary>
        )}
      </div>

      <header className="game-topbar">
        <a className="brand-mark" href="#home" aria-label="Our Little World home">
          <span className="brand-heart"><Heart size={15} fill="currentColor" /></span>
          <span>OUR LITTLE WORLD<small>A MEMORY MUSEUM</small></span>
        </a>
        <div className="topbar-right">
          <span className="chapter-tag"><span className="live-dot" />GALLERY 01 <i>/</i> OUR STORY</span>
          <button className={`icon-button ${sound ? 'is-on' : ''}`} aria-label={sound ? 'Mute music' : 'Play music'} aria-pressed={sound} onClick={() => setSound((value) => !value)}>
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </header>

      {show3d && (
        <>
          <div className="chapter-heading">
            <span className="eyebrow">GALLERY ONE</span>
            <h1>{complete ? 'All found' : 'The beginning'}<span className="heading-period">.</span></h1>
            <p>{complete ? 'Now go see who is waiting for you.' : 'Walk up to each frame to remember.'}</p>
          </div>
          <nav className="gallery-index" aria-label="Memories">
            <div className="index-title">YOUR STORY</div>
            <ul>
              {memories.map((memory, index) => (
                <li key={memory.id}>
                  <button className={`index-row ${found.has(memory.id) ? 'is-active' : ''}`} onClick={() => openMemory(memory)}>
                    <span className="index-number">{pad(index + 1)}</span>
                    {memory.title}
                    {found.has(memory.id) && <Heart className="locked-mark" size={11} fill="currentColor" aria-label="found" />}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="controls-hint" aria-hidden="true">
            <div className="key-cluster"><kbd>W</kbd><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div>
            <span>TO WANDER</span>
            <span className="control-divider" />
            <kbd className="key-wide">SHIFT</kbd><span>TO HURRY</span>
            <span className="control-divider" />
            <span className="mouse-symbol">↔</span><span>DRAG TO LOOK</span>
          </div>
          <Joystick />
        </>
      )}

      {started && (
        <>
          <div className="memory-count" role="status" aria-live="polite">
            <span>MEMORIES FOUND</span>
            <strong>{pad(found.size)} <i>/</i> {pad(memories.length)}</strong>
            <div className="count-track"><span style={{ width: `${(found.size / memories.length) * 100}%` }} /></div>
          </div>
          {(prompt || graphicsFailed) && (
            <button className={`npc-prompt ${prompt ? 'is-near' : ''}`} onClick={prompt ? interact : openNote}>
              <span className="npc-heart"><Heart size={16} /></span>
              <span>{prompt?.title ?? 'A note is waiting for you'}<small>{prompt?.hint ?? 'Tap to open it'}</small></span>
              <ArrowUpRight size={16} />
            </button>
          )}
        </>
      )}

      {!started && <WelcomeOverlay onStart={() => setStarted(true)} />}
      {started && selected && <MemoryModal memory={selected} index={selectedIndex} onClose={() => setSelected(null)} />}
      {started && noteOpen && <NoteModal complete={complete} onClose={() => setNoteOpen(false)} />}
      <div className="scene-vignette" aria-hidden="true" />
    </main>
  )
}
