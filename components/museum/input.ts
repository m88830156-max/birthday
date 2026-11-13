export const input = {
  keys: {} as Record<string, boolean>,
  joystick: { x: 0, y: 0 },
  lookDelta: 0,
}

export function resetInput() {
  input.keys = {}
  input.joystick.x = 0
  input.joystick.y = 0
  input.lookDelta = 0
}

export function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}
