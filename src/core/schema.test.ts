import { describe, expect, it } from 'vitest'
import { assertDocument, SlideSchema } from './schema'
import { createSampleDocument } from './sample'

describe('schema', () => {
  it('validates the five-page starter project', () => {
    const document = assertDocument(createSampleDocument())
    expect(document.deck.schemaVersion).toBe('0.1')
    expect(document.deck.title).toBe('一分钟认识 PlainDeck')
    expect(document.deck.slides).toHaveLength(5)
  })
  it('rejects fractional coordinates', () => expect(() => SlideSchema.parse({ id: 'bad', elements: [{ id: 'x', type: 'text', text: '', frame: { x: .5, y: 0, w: 10, h: 10 } }] })).toThrow())
})
