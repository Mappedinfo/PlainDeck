import type { Frame } from 'plaindeck/core'

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const snap = (value: number, grid = 8) => Math.round(value / grid) * grid

export function moveFrame(frame: Frame, dx: number, dy: number, canvas: { width: number; height: number }, grid = 8): Frame {
  return {
    ...frame,
    x: snap(clamp(frame.x + dx, 0, canvas.width - frame.w), grid),
    y: snap(clamp(frame.y + dy, 0, canvas.height - frame.h), grid),
  }
}

export function resizeFrame(frame: Frame, dw: number, dh: number, canvas: { width: number; height: number }, grid = 8): Frame {
  return {
    ...frame,
    w: snap(clamp(frame.w + dw, 32, canvas.width - frame.x), grid),
    h: snap(clamp(frame.h + dh, 24, canvas.height - frame.y), grid),
  }
}

export function alignmentPatch(frames: Frame[], mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Partial<Frame>[] {
  if (!frames.length) return []
  const minX = Math.min(...frames.map(f => f.x)); const maxX = Math.max(...frames.map(f => f.x + f.w))
  const minY = Math.min(...frames.map(f => f.y)); const maxY = Math.max(...frames.map(f => f.y + f.h))
  return frames.map(frame => {
    if (mode === 'left') return { x: minX }
    if (mode === 'center') return { x: Math.round((minX + maxX - frame.w) / 2) }
    if (mode === 'right') return { x: maxX - frame.w }
    if (mode === 'top') return { y: minY }
    if (mode === 'middle') return { y: Math.round((minY + maxY - frame.h) / 2) }
    return { y: maxY - frame.h }
  })
}
