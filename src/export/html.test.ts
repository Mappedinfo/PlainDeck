import { describe, expect, it } from 'vitest'
import { createSampleDocument } from '../core/sample'
import { embedLocalImages } from './html'

describe('browser HTML image export', () => {
  it('embeds directory assets without mutating the project document', async () => {
    const document = createSampleDocument(); const path = document.deck.slides[0]
    document.slides[path].elements.push({ id: 'local-image', type: 'image', frame: { x: 0, y: 0, w: 100, h: 100 }, src: './assets/photo.png', fit: 'cover' })
    const portable = await embedLocalImages(document, async assetPath => {
      expect(assetPath).toBe('./assets/photo.png')
      return new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
    })
    const image = portable.slides[path].elements.find(element => element.id === 'local-image')
    expect(image).toMatchObject({ type: 'image', src: expect.stringMatching(/^data:image\/png;base64,/) })
    expect(document.slides[path].elements.find(element => element.id === 'local-image')).toMatchObject({ src: './assets/photo.png' })
  })
})
