'use client'

import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, Sparkles } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { INTERACT_DISTANCE, NPC_POSITION, ROOM_HALF, WALK_LIMIT, WALL_HEIGHT, memories, type InteractTarget, type Memory } from './data'
import { input } from './input'

const UP = new THREE.Vector3(0, 1, 0)
const CLICK_DRAG_TOLERANCE = 6

function setCursor(value: string) {
  document.body.style.cursor = value
}

function Frame({ memory, highlighted, onOpen }: { memory: Memory; highlighted: boolean; onOpen: (memory: Memory) => void }) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > CLICK_DRAG_TOLERANCE) return
    onOpen(memory)
  }
  return (
    <group
      position={memory.position}
      rotation={[0, memory.rotation, 0]}
      onClick={handleClick}
      onPointerOver={(event) => { event.stopPropagation(); setCursor('pointer') }}
      onPointerOut={() => setCursor('')}
    >
      <mesh castShadow>
        <boxGeometry args={[1.55, 1.55, 0.14]} />
        <meshStandardMaterial color="#b68b56" metalness={0.5} roughness={0.32} emissive="#e6b98a" emissiveIntensity={highlighted ? 0.45 : 0} />
      </mesh>
      <mesh position={[0, 0, 0.085]}><boxGeometry args={[1.32, 1.32, 0.035]} /><meshStandardMaterial color="#f3e8d6" /></mesh>
      <mesh position={[0, 0, 0.11]}><planeGeometry args={[1.12, 1.12]} /><meshStandardMaterial color={memory.color} roughness={0.9} /></mesh>
      <mesh position={[0, 0.05, 0.12]}><circleGeometry args={[0.28, 32]} /><meshStandardMaterial color="#f5d7c9" roughness={1} /></mesh>
      <mesh position={[-0.2, -0.24, 0.125]}><circleGeometry args={[0.15, 24]} /><meshStandardMaterial color="#8b5e55" roughness={1} /></mesh>
      <mesh position={[0.2, -0.24, 0.125]}><circleGeometry args={[0.15, 24]} /><meshStandardMaterial color="#71554e" roughness={1} /></mesh>
      <mesh position={[0, -1.02, 0.03]}><boxGeometry args={[0.9, 0.2, 0.03]} /><meshStandardMaterial color="#3a2e2f" roughness={0.7} /></mesh>
      <Html position={[0, -1.02, 0.06]} center distanceFactor={7} zIndexRange={[1, 0]} className="frame-label">
        <span className={highlighted ? 'is-near' : undefined}>{memory.title}</span>
      </Html>
    </group>
  )
}

function Companion() {
  const heart = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!heart.current) return
    const t = state.clock.elapsedTime
    heart.current.position.y = 2.35 + Math.sin(t * 2) * 0.07
    heart.current.rotation.y = t * 1.2
  })
  return (
    <group position={NPC_POSITION} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.7, 0]} castShadow><capsuleGeometry args={[0.33, 0.72, 6, 14]} /><meshStandardMaterial color="#334756" roughness={0.8} /></mesh>
      <mesh position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.25, 24, 24]} /><meshStandardMaterial color="#d7a988" roughness={0.85} /></mesh>
      <mesh position={[0, 1.47, -0.05]}><sphereGeometry args={[0.265, 24, 24]} /><meshStandardMaterial color="#302523" roughness={0.95} /></mesh>
      <mesh ref={heart} position={[0, 2.35, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#f2a7a0" emissive="#e98b84" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 2, 0.4]} color="#f5ba92" intensity={1.2} distance={3.5} />
    </group>
  )
}

type PlayerProps = { paused: boolean; onTargetChange: (target: InteractTarget) => void }

function Player({ paused, onTargetChange }: PlayerProps) {
  const group = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const angle = useRef(0)
  const lastTargetKey = useRef<string>('none')
  const tmp = useMemo(() => ({
    direction: new THREE.Vector3(),
    target: new THREE.Vector3(),
    desired: new THREE.Vector3(),
    frameFront: new THREE.Vector3(),
  }), [])

  useEffect(() => {
    const element = gl.domElement
    let dragging = false
    let lastX = 0
    const down = (event: PointerEvent) => {
      dragging = true
      lastX = event.clientX
      element.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!dragging) return
      input.lookDelta += event.clientX - lastX
      lastX = event.clientX
    }
    const up = (event: PointerEvent) => {
      dragging = false
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    }
    const preventMenu = (event: MouseEvent) => event.preventDefault()
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    element.addEventListener('contextmenu', preventMenu)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
      element.removeEventListener('contextmenu', preventMenu)
    }
  }, [gl])

  useFrame((state, rawDelta) => {
    const player = group.current
    if (!player) return
    const delta = Math.min(rawDelta, 0.05)
    const { keys, joystick } = input

    angle.current -= input.lookDelta * 0.006
    input.lookDelta = 0

    let forward = 0
    let side = 0
    if (!paused) {
      forward = Number(!!(keys.w || keys.arrowup)) - Number(!!(keys.s || keys.arrowdown)) - joystick.y
      side = Number(!!(keys.d || keys.arrowright)) - Number(!!(keys.a || keys.arrowleft)) + joystick.x
    }
    const moving = Math.abs(forward) > 0.05 || Math.abs(side) > 0.05

    if (moving) {
      const speed = keys.shift ? 4.4 : 2.6
      tmp.direction.set(side, 0, -forward)
      if (tmp.direction.lengthSq() > 1) tmp.direction.normalize()
      tmp.direction.applyAxisAngle(UP, angle.current)
      player.position.addScaledVector(tmp.direction, speed * delta)
      player.position.x = THREE.MathUtils.clamp(player.position.x, -WALK_LIMIT, WALK_LIMIT)
      player.position.z = THREE.MathUtils.clamp(player.position.z, -WALK_LIMIT, WALK_LIMIT)

      const dx = player.position.x - NPC_POSITION[0]
      const dz = player.position.z - NPC_POSITION[2]
      const distance = Math.hypot(dx, dz)
      const minDistance = 0.8
      if (distance < minDistance && distance > 0.0001) {
        player.position.x = NPC_POSITION[0] + (dx / distance) * minDistance
        player.position.z = NPC_POSITION[2] + (dz / distance) * minDistance
      }

      const targetRotation = Math.atan2(tmp.direction.x, tmp.direction.z)
      const turn = Math.atan2(Math.sin(targetRotation - player.rotation.y), Math.cos(targetRotation - player.rotation.y))
      player.rotation.y += turn * Math.min(1, delta * 12)
    }
    player.position.y = moving ? Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.05 : 0

    tmp.target.set(player.position.x, 1.25, player.position.z)
    tmp.desired.set(
      THREE.MathUtils.clamp(player.position.x + Math.sin(angle.current) * 4.6, -ROOM_HALF + 0.45, ROOM_HALF - 0.45),
      2.7,
      THREE.MathUtils.clamp(player.position.z + Math.cos(angle.current) * 4.6, -ROOM_HALF + 0.45, ROOM_HALF - 0.45),
    )
    camera.position.lerp(tmp.desired, 1 - Math.exp(-delta * 4))
    camera.lookAt(tmp.target)

    let nearest: InteractTarget = null
    let nearestKey = 'none'
    let best = INTERACT_DISTANCE
    const npcDistance = Math.hypot(player.position.x - NPC_POSITION[0], player.position.z - NPC_POSITION[2])
    if (npcDistance < 1.6) {
      nearest = { kind: 'npc' }
      nearestKey = 'npc'
      best = npcDistance
    }
    for (const memory of memories) {
      tmp.frameFront.set(Math.sin(memory.rotation), 0, Math.cos(memory.rotation)).multiplyScalar(0.9)
      const fx = memory.position[0] + tmp.frameFront.x
      const fz = memory.position[2] + tmp.frameFront.z
      const distance = Math.hypot(player.position.x - fx, player.position.z - fz)
      if (distance < best) {
        best = distance
        nearest = { kind: 'memory', memory }
        nearestKey = memory.id
      }
    }
    if (nearestKey !== lastTargetKey.current) {
      lastTargetKey.current = nearestKey
      onTargetChange(nearest)
    }
  })

  return (
    <group ref={group} position={[0, 0, 0.5]}>
      <mesh position={[0, 0.7, 0]} castShadow><capsuleGeometry args={[0.32, 0.72, 6, 14]} /><meshStandardMaterial color="#7b5360" roughness={0.8} /></mesh>
      <mesh position={[0, 1.4, 0]} castShadow><sphereGeometry args={[0.25, 24, 24]} /><meshStandardMaterial color="#edc6ad" roughness={0.9} /></mesh>
      <mesh position={[0, 1.47, -0.05]}><sphereGeometry args={[0.265, 24, 24]} /><meshStandardMaterial color="#4b3531" roughness={0.95} /></mesh>
      <mesh position={[0, 1.02, 0.29]}><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#f2a7a0" emissive="#e98b84" emissiveIntensity={0.4} /></mesh>
    </group>
  )
}

function Room() {
  const wallY = WALL_HEIGHT / 2 - 0.1
  const size = ROOM_HALF * 2 + 0.5
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_HALF * 2, ROOM_HALF * 2]} />
        <meshStandardMaterial color="#725b55" roughness={0.35} metalness={0.15} />
      </mesh>
      <gridHelper args={[ROOM_HALF * 2, 24, '#b18a70', '#8a6f62']} position={[0, 0.005, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#8c5f5c" roughness={0.9} />
      </mesh>
      <mesh position={[0, wallY, -ROOM_HALF - 0.15]} receiveShadow><boxGeometry args={[size, WALL_HEIGHT + 0.2, 0.3]} /><meshStandardMaterial color="#4a3a3c" roughness={0.85} /></mesh>
      <mesh position={[0, wallY, ROOM_HALF + 0.15]} receiveShadow><boxGeometry args={[size, WALL_HEIGHT + 0.2, 0.3]} /><meshStandardMaterial color="#4a3a3c" roughness={0.85} /></mesh>
      <mesh position={[-ROOM_HALF - 0.15, wallY, 0]} receiveShadow><boxGeometry args={[0.3, WALL_HEIGHT + 0.2, size]} /><meshStandardMaterial color="#45363a" roughness={0.85} /></mesh>
      <mesh position={[ROOM_HALF + 0.15, wallY, 0]} receiveShadow><boxGeometry args={[0.3, WALL_HEIGHT + 0.2, size]} /><meshStandardMaterial color="#45363a" roughness={0.85} /></mesh>
      <mesh position={[0, WALL_HEIGHT + 0.08, 0]}><boxGeometry args={[size, 0.15, size]} /><meshStandardMaterial color="#2c2429" roughness={0.8} /></mesh>
      {[-3.5, 0, 3.5].map((x) => (
        <group key={x}>
          <mesh position={[x, WALL_HEIGHT - 0.05, 0]}><boxGeometry args={[0.08, 0.06, ROOM_HALF * 1.6]} /><meshStandardMaterial color="#d8ad75" emissive="#c58a4c" emissiveIntensity={0.8} /></mesh>
          <pointLight position={[x, WALL_HEIGHT - 0.4, -2.5]} intensity={6} color="#ffcc94" distance={8} decay={1.6} />
          <pointLight position={[x, WALL_HEIGHT - 0.4, 2.8]} intensity={4} color="#ffcc94" distance={7} decay={1.6} />
        </group>
      ))}
    </group>
  )
}

type SceneProps = { paused: boolean; target: InteractTarget; onOpen: (memory: Memory) => void; onTargetChange: (target: InteractTarget) => void }

export function MuseumScene({ paused, target, onOpen, onTargetChange }: SceneProps) {
  useEffect(() => () => setCursor(''), [])
  const highlightedId = target?.kind === 'memory' ? target.memory.id : null
  return (
    <Canvas shadows camera={{ position: [0, 2.7, 5], fov: 55, near: 0.1, far: 40 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#211b20']} />
      <fog attach="fog" args={['#211b20', 9, 22]} />
      <hemisphereLight args={['#ffe7d5', '#3a2a2c', 0.9]} />
      <ambientLight intensity={0.25} color="#ffe7d5" />
      <directionalLight position={[-3, 6, 4]} intensity={1.1} color="#ffe1c2" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
      <Room />
      {memories.map((memory) => <Frame key={memory.id} memory={memory} highlighted={highlightedId === memory.id} onOpen={onOpen} />)}
      <Companion />
      <Player paused={paused} onTargetChange={onTargetChange} />
      <Sparkles count={48} scale={[11, 3.6, 11]} position={[0, 2, 0]} size={1.8} speed={0.18} opacity={0.5} color="#f8d9b5" />
    </Canvas>
  )
}
