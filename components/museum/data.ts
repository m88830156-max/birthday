export type Memory = {
  id: string
  title: string
  date: string
  note: string
  color: string
  position: [number, number, number]
  rotation: number
}

export const ROOM_HALF = 6
export const WALL_HEIGHT = 4.2
export const WALK_LIMIT = 5.2
export const NPC_POSITION: [number, number, number] = [0, 0, 2.6]
export const INTERACT_DISTANCE = 2.1

export const memories: Memory[] = [
  { id: 'beginning', title: 'The beginning', date: 'A little moment, forever ours', note: 'Somehow, the ordinary days became my favorite story. I would choose every beginning with you, again and again.', color: '#d9a18a', position: [-3.2, 2, -5.82], rotation: 0 },
  { id: 'happy', title: 'Our kind of happy', date: 'The days that feel like home', note: 'The laughter that lasts too long, the little glances, and all the tiny things only we understand.', color: '#bd8c74', position: [0, 2, -5.82], rotation: 0 },
  { id: 'together', title: 'Somewhere together', date: 'A place we found along the way', note: 'Everywhere is a little more beautiful when I get to see it with you.', color: '#e2bd92', position: [3.2, 2, -5.82], rotation: 0 },
  { id: 'favorite', title: 'A favorite day', date: 'One for the books', note: 'I hope we keep collecting days like this — soft, silly, and completely ours.', color: '#d99c9b', position: [-5.82, 2, -1.2], rotation: Math.PI / 2 },
  { id: 'little', title: 'Little things', date: 'The best parts are often the smallest', note: 'Your smile across a room. A song in the car. Being right where I belong: next to you.', color: '#c9a6ba', position: [5.82, 2, -1.2], rotation: -Math.PI / 2 },
  { id: 'choosing', title: 'Still choosing you', date: 'Today, and all the days after', note: 'This little world is only a tiny way to say how much I love the world we make together.', color: '#e5b48f', position: [0, 2, 5.82], rotation: Math.PI },
]

export const memoryArt = (color: string) =>
  `radial-gradient(circle at 50% 45%, #f4d4c3 0 12%, ${color} 13% 43%, #70554d 100%)`

export type InteractTarget = { kind: 'memory'; memory: Memory } | { kind: 'npc' } | null
