'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowUpRight, Heart, X } from 'lucide-react'
import { memoryArt, type Memory } from './data'

function ModalShell({ label, className, onClose, children }: { label: string; className: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = panel.current.querySelectorAll<HTMLElement>('button')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', trap)
    return () => { window.removeEventListener('keydown', trap); previous?.focus?.() }
  }, [])
  return (
    <div className="memory-backdrop" onClick={onClose}>
      <section ref={panel} className={className} role="dialog" aria-modal="true" aria-labelledby={label} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {children}
      </section>
    </div>
  )
}

export function MemoryModal({ memory, index, onClose }: { memory: Memory; index: number; onClose: () => void }) {
  return (
    <ModalShell label="memory-title" className="memory-modal" onClose={onClose}>
      <div className="modal-art" style={{ background: memoryArt(memory.color) }}>
        <div className="modal-art-halo" />
        <span>MEMORY {String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="modal-copy">
        <span className="eyebrow">A MEMORY TO KEEP</span>
        <h2 id="memory-title">{memory.title}</h2>
        <p className="modal-date">{memory.date}</p>
        <div className="modal-rule" />
        <p className="modal-note">{memory.note}</p>
        <button className="keep-button" data-autofocus onClick={onClose}>Keep this close <Heart size={15} /></button>
      </div>
    </ModalShell>
  )
}

export function NoteModal({ complete, onClose }: { complete: boolean; onClose: () => void }) {
  return (
    <ModalShell label="dialogue-title" className="dialogue-card" onClose={onClose}>
      <div className="dialogue-icon"><Heart size={22} fill="currentColor" /></div>
      <span className="eyebrow">{complete ? 'YOU FOUND THEM ALL' : 'A NOTE FROM ME'}</span>
      <h2 id="dialogue-title">{complete ? 'Every single one.' : 'Hey, you.'}</h2>
      {complete ? (
        <p>Six little moments, and still they don&apos;t hold half of it. Thank you for every day you&apos;ve given me. Here&apos;s to all the memories we haven&apos;t made yet.</p>
      ) : (
        <p>I made this little place for us. Every frame holds a piece of my favorite story — the one where I get to love you. Go find them all.</p>
      )}
      <p className="dialogue-signoff">Happy birthday, my love. <Heart size={13} fill="currentColor" /></p>
      <button className="keep-button" data-autofocus onClick={onClose}>{complete ? 'Stay a little longer' : 'Let\u2019s keep wandering'} <ArrowUpRight size={15} /></button>
    </ModalShell>
  )
}

export function WelcomeOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome-overlay" id="home">
      <div className="welcome-card">
        <div className="welcome-kicker"><span /> A LITTLE WORLD, MADE FOR YOU</div>
        <div className="welcome-heart"><Heart size={18} fill="currentColor" /></div>
        <h1>Our Little<br /><em>World.</em></h1>
        <p>A walk through all the little moments that became our favorite story.</p>
        <button className="enter-button" autoFocus onClick={onStart}>Step inside <ArrowUpRight size={17} /></button>
        <div className="welcome-footnote">TAKE YOUR TIME · THERE&apos;S NO RUSH</div>
      </div>
      <div className="welcome-side-note">A PLACE TO REMEMBER, AND TO DREAM A LITTLE MORE <span aria-hidden="true">✳</span></div>
    </div>
  )
}

export function FallbackGallery({ memories, found, onOpen }: { memories: Memory[]; found: Set<string>; onOpen: (memory: Memory) => void }) {
  return (
    <div className="museum-fallback">
      <div className="fallback-light" aria-hidden="true" />
      <div className="fallback-copy">
        <span className="eyebrow">A LITTLE WORLD, MADE FOR YOU</span>
        <h2>Our story,<br /><em>in little moments.</em></h2>
        <p>Pick a memory to open its frame.</p>
      </div>
      <ul className="fallback-gallery">
        {memories.map((memory, index) => (
          <li key={memory.id}>
            <button className={`fallback-frame ${found.has(memory.id) ? 'is-found' : ''}`} onClick={() => onOpen(memory)}>
              <span className="fallback-art" style={{ background: memoryArt(memory.color) }}>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </span>
              <span className="fallback-title">{memory.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <span className="fallback-note">SOME MOMENTS DESERVE THEIR OWN PLACE</span>
    </div>
  )
}
