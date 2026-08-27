import { describe, expect, it } from 'vitest'
import { fitImageFrame, validateImageFile } from './imageImport'
import { LocalizedError } from '../i18n/errors'

describe('local image import', () => {
  it('fits large images without changing their aspect ratio', () => {
    const frame = fitImageFrame({ width: 1600, height: 1200 }, { width: 1600, height: 900 })
    expect(frame).toEqual({ x: 454, y: 190, w: 693, h: 520 })
    expect(frame.w / frame.h).toBeCloseTo(4 / 3, 2)
  })

  it('centers at the drop point and keeps the image inside the canvas', () => {
    expect(fitImageFrame({ width: 400, height: 200 }, { width: 1600, height: 900 }, { x: 30, y: 40 })).toEqual({ x: 0, y: 0, w: 400, h: 200 })
    expect(fitImageFrame({ width: 400, height: 200 }, { width: 1600, height: 900 }, { x: 1580, y: 880 })).toEqual({ x: 1200, y: 700, w: 400, h: 200 })
  })

  it('rejects non-images and oversized files with localized errors', () => {
    try { validateImageFile(new File(['text'], 'notes.txt', { type: 'text/plain' })); expect.unreachable() } catch (error) { expect(error).toBeInstanceOf(LocalizedError); expect((error as LocalizedError).messageKey).toBe('unsupportedImageFormat') }
    try { validateImageFile(new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' })); expect.unreachable() } catch (error) { expect((error as LocalizedError).messageKey).toBe('imageTooLarge') }
  })
})
