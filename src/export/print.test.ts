// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { waitForPrintResources } from './print'

describe('print resource readiness', () => {
  it('waits for fonts before decoding images', async () => {
    let releaseFonts!: () => void
    const fontsReady = new Promise<void>(resolve => { releaseFonts = resolve })
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: fontsReady } })
    const root = document.createElement('div'); const image = document.createElement('img'); const decode = vi.fn(async () => undefined)
    Object.defineProperty(image, 'complete', { configurable: true, value: true }); image.decode = decode; root.append(image)
    const waiting = waitForPrintResources(root)
    await Promise.resolve(); expect(decode).not.toHaveBeenCalled()
    releaseFonts(); await waiting
    expect(decode).toHaveBeenCalledOnce()
  })
})
