import { describe, expect, it } from 'vitest'
import { alignmentPatch, centerFrame, framePlacement, moveFrame, resizeFrame, snap } from './geometry'

describe('geometry', () => {
  it('snaps to an integer grid', () => expect(snap(93, 8)).toBe(96))
  it('allows moved frames to leave the canvas completely', () => expect(moveFrame({ x: 90, y: 90, w: 20, h: 20 }, 50, 50, { width: 100, height: 100 })).toEqual({ x: 144, y: 144, w: 20, h: 20 }))
  it('classifies inside, partial, and outside frames', () => {
    const canvas = { width: 100, height: 100 }
    expect(framePlacement({ x: 10, y: 10, w: 20, h: 20 }, canvas)).toBe('inside')
    expect(framePlacement({ x: -10, y: 10, w: 20, h: 20 }, canvas)).toBe('partial')
    expect(framePlacement({ x: -30, y: 10, w: 20, h: 20 }, canvas)).toBe('outside')
  })
  it('centers a frame without changing its size', () => expect(centerFrame({ x: -500, y: 1200, w: 200, h: 100 }, { width: 1000, height: 600 })).toEqual({ x: 400, y: 248, w: 200, h: 100 }))
  it('keeps resized frames valid', () => expect(resizeFrame({ x: 20, y: 20, w: 100, h: 100 }, -1000, -1000, { width: 500, height: 500 })).toEqual({ x: 20, y: 20, w: 32, h: 24 }))
  it('aligns multiple frames by left edge', () => expect(alignmentPatch([{ x: 10, y: 0, w: 20, h: 20 }, { x: 40, y: 0, w: 20, h: 20 }], 'left')).toEqual([{ x: 10 }, { x: 10 }]))
})
