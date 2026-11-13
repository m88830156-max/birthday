'use client'

import { useEffect, useRef } from 'react'

const CHORDS = [
  [261.63, 329.63, 392.0, 523.25],
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23],
  [196.0, 246.94, 293.66, 392.0],
]
const PATTERN = [0, 1, 2, 3, 2, 1, 2, 3]
const STEP_SECONDS = 0.42

type Engine = { ctx: AudioContext; master: GainNode; timer: number | null; step: number; nextTime: number }

function playNote(engine: Engine, frequency: number, time: number, volume: number) {
  const { ctx, master } = engine
  const osc = ctx.createOscillator()
  const overtone = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  overtone.type = 'triangle'
  osc.frequency.value = frequency
  overtone.frequency.value = frequency * 2
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8)
  const overtoneGain = ctx.createGain()
  overtoneGain.gain.value = 0.18
  osc.connect(gain)
  overtone.connect(overtoneGain).connect(gain)
  gain.connect(master)
  osc.start(time)
  overtone.start(time)
  osc.stop(time + 1.9)
  overtone.stop(time + 1.9)
}

function createEngine(): Engine | null {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  const ctx = new AudioCtor()
  const master = ctx.createGain()
  master.gain.value = 0
  const delay = ctx.createDelay()
  delay.delayTime.value = 0.32
  const feedback = ctx.createGain()
  feedback.gain.value = 0.32
  const wet = ctx.createGain()
  wet.gain.value = 0.35
  master.connect(ctx.destination)
  master.connect(delay)
  delay.connect(feedback).connect(delay)
  delay.connect(wet).connect(ctx.destination)
  return { ctx, master, timer: null, step: 0, nextTime: 0 }
}

export function useSoundtrack(enabled: boolean) {
  const engineRef = useRef<Engine | null>(null)

  useEffect(() => {
    if (!enabled) {
      const engine = engineRef.current
      if (!engine) return
      engine.master.gain.setTargetAtTime(0, engine.ctx.currentTime, 0.2)
      if (engine.timer) window.clearInterval(engine.timer)
      engine.timer = null
      return
    }
    const engine = engineRef.current ?? createEngine()
    if (!engine) return
    engineRef.current = engine
    void engine.ctx.resume()
    engine.master.gain.setTargetAtTime(0.16, engine.ctx.currentTime, 0.4)
    engine.nextTime = engine.ctx.currentTime + 0.1
    const schedule = () => {
      while (engine.nextTime < engine.ctx.currentTime + 0.6) {
        const chord = CHORDS[Math.floor(engine.step / PATTERN.length) % CHORDS.length]
        const index = PATTERN[engine.step % PATTERN.length]
        playNote(engine, chord[index], engine.nextTime, 0.22)
        if (engine.step % PATTERN.length === 0) playNote(engine, chord[0] / 2, engine.nextTime, 0.16)
        engine.step += 1
        engine.nextTime += STEP_SECONDS
      }
    }
    schedule()
    engine.timer = window.setInterval(schedule, 150)
    return () => {
      if (engine.timer) window.clearInterval(engine.timer)
      engine.timer = null
    }
  }, [enabled])

  useEffect(() => () => {
    const engine = engineRef.current
    if (engine?.timer) window.clearInterval(engine.timer)
    void engine?.ctx.close()
    engineRef.current = null
  }, [])
}
