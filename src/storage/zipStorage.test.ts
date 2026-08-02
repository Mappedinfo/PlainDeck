import { describe, expect, it } from 'vitest'
import { createSampleDocument } from '../core/sample'
import { createProjectZip, importZip } from './zipStorage'

describe('project ZIP assets', () => {
  it('includes referenced directory images as binary assets', async () => {
    const document = createSampleDocument(); const slide = document.slides[document.deck.slides[0]]
    slide.elements.push({ id: 'photo', type: 'image', frame: { x: 0, y: 0, w: 100, h: 100 }, src: './assets/photo.png', fit: 'cover' })
    const zip = await createProjectZip(document, async path => {
      expect(path).toBe('./assets/photo.png')
      return new Uint8Array([137, 80, 78, 71])
    })
    const bytes = await zip.file('assets/photo.png')!.async('uint8array')
    expect([...bytes]).toEqual([137, 80, 78, 71])
  })

  it('restores packaged images when a project ZIP is imported', async () => {
    const document = createSampleDocument(); const slide = document.slides[document.deck.slides[0]]
    slide.elements.push({ id: 'photo', type: 'image', frame: { x: 0, y: 0, w: 100, h: 100 }, src: './assets/photo.png', fit: 'cover' })
    const zip = await createProjectZip(document, async () => new Uint8Array([137, 80, 78, 71]))
    const imported = await importZip(await zip.generateAsync({ type: 'uint8array' }))
    const image = imported.slides[imported.deck.slides[0]].elements.find(element => element.id === 'photo')
    expect(image?.type === 'image' && image.src).toBe('data:image/png;base64,iVBORw==')
  })
})
