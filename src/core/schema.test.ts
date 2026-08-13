import { describe, expect, it } from 'vitest'
import { assertDocument, SlideSchema } from 'plaindeck/core'
import { createSampleDocument } from './sample'

describe('schema', () => {
  it('validates the seven-page Nature methods starter project', () => {
    const document = assertDocument(createSampleDocument())
    expect(document.deck.schemaVersion).toBe('0.1')
    expect(document.deck.title).toBe('方法标题：一句话说清解决了什么')
    expect(document.deck.slides).toHaveLength(7)
  })
  it('rejects fractional coordinates', () => expect(() => SlideSchema.parse({ id: 'bad', elements: [{ id: 'x', type: 'text', text: '', frame: { x: .5, y: 0, w: 10, h: 10 } }] })).toThrow())
  it('accepts editable text inside a shape', () => {
    const slide = SlideSchema.parse({ id: 'shape-text', elements: [{ id: 'card', type: 'shape', frame: { x: 0, y: 0, w: 320, h: 180 }, fill: '#20211D', text: 'Readable JSON', textColor: '#FFF8E9', fontSize: 30, align: 'center', verticalAlign: 'middle' }] })
    expect(slide.elements[0]).toMatchObject({ type: 'shape', text: 'Readable JSON', align: 'center' })
  })
  it('accepts rectangular native tables and rejects ragged rows', () => {
    const table = { id: 'table', type: 'table', frame: { x: 0, y: 0, w: 800, h: 400 }, cells: [['Method', 'Score'], ['Base', '82.4']], headerRows: 1, style: 'rules' }
    expect(SlideSchema.parse({ id: 'table-slide', elements: [table] }).elements[0]).toMatchObject({ type: 'table', headerRows: 1, style: 'rules' })
    expect(() => SlideSchema.parse({ id: 'bad-table', elements: [{ ...table, cells: [['Method', 'Score'], ['Base']] }] })).toThrow()
  })
})
