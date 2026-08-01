import { describe, expect, it } from 'vitest'
import { assertDocument, SlideSchema } from './schema'
import { createSampleDocument } from './sample'

describe('schema', () => {
  it('validates the starter project', () => expect(assertDocument(createSampleDocument()).deck.schemaVersion).toBe('0.1'))
  it('rejects fractional coordinates', () => expect(() => SlideSchema.parse({ id: 'bad', elements: [{ id: 'x', type: 'text', text: '', frame: { x: .5, y: 0, w: 10, h: 10 } }] })).toThrow())
})
