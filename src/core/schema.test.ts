import { describe, expect, it } from 'vitest'
import { assertDocument, SlideSchema } from 'plaindeck/core'
import { createSampleDocument } from './sample'

describe('schema', () => {
  it('validates the eight-page starter project', () => {
    const document = assertDocument(createSampleDocument())
    expect(document.deck.schemaVersion).toBe('0.1')
    expect(document.deck.title).toBe('论文标题：一句话说清核心贡献')
    expect(document.deck.slides).toHaveLength(8)
  })
  it('rejects fractional coordinates', () => expect(() => SlideSchema.parse({ id: 'bad', elements: [{ id: 'x', type: 'text', text: '', frame: { x: .5, y: 0, w: 10, h: 10 } }] })).toThrow())
  it('accepts editable text inside a shape', () => {
    const slide = SlideSchema.parse({ id: 'shape-text', elements: [{ id: 'card', type: 'shape', frame: { x: 0, y: 0, w: 320, h: 180 }, fill: '#20211D', text: 'Readable JSON', textColor: '#FFF8E9', fontSize: 30, align: 'center', verticalAlign: 'middle' }] })
    expect(slide.elements[0]).toMatchObject({ type: 'shape', text: 'Readable JSON', align: 'center' })
  })
})
