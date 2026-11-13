'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { input } from './input'

const RADIUS = 42

export function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  const update = (event: PointerEvent<HTMLDivElement>) => {
    const rect = base.current?.getBoundingClientRect()
    if (!rect) return
    let x = event.clientX - (rect.left + rect.width / 2)
    let y = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(x, y)
    if (length > RADIUS) { x = (x / length) * RADIUS; y = (y / length) * RADIUS }
    input.joystick.x = x / RADIUS
    input.joystick.y = y / RADIUS
    setKnob({ x, y })
  }
  const release = () => {
    input.joystick.x = 0
    input.joystick.y = 0
    setKnob({ x: 0, y: 0 })
  }

  return (
    <div
      ref={base}
      className="touch-joystick"
      role="presentation"
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); update(event) }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event) }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span className="touch-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
