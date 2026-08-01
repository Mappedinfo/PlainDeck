import { describe, expect, it } from 'vitest'
import { alignmentPatch, moveFrame, resizeFrame, snap } from './geometry'

describe('geometry', () => {
  it('snaps to an integer grid', () => expect(snap(93, 8)).toBe(96))
  it('keeps moved frames inside canvas', () => expect(moveFrame({ x: 90, y: 90, w: 20, h: 20 }, 50, 50, { width: 100, height: 100 }).x).toBe(80))
  it('keeps resized frames valid', () => expect(resizeFrame({ x: 20, y: 20, w: 100, h: 100 }, -1000, -1000, { width: 500, height: 500 })).toEqual({ x: 20, y: 20, w: 32, h: 24 }))
  it('aligns multiple frames by left edge', () => expect(alignmentPatch([{ x: 10, y: 0, w: 20, h: 20 }, { x: 40, y: 0, w: 20, h: 20 }], 'left')).toEqual([{ x: 10 }, { x: 10 }]))
})
