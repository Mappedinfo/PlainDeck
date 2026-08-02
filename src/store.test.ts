import { beforeEach, describe, expect, it } from 'vitest'
import { createSampleDocument } from './core/sample'
import { useEditor } from './store'

describe('editor command history', () => {
  beforeEach(() => useEditor.getState().setDocument(createSampleDocument()))
  it('always opens the first page from deck order', () => {
    const state = useEditor.getState()
    expect(state.activeSlidePath).toBe(state.document.deck.slides[0])
    expect(state.document.slides[state.activeSlidePath]).toBeDefined()
  })
  it('undoes and redoes one stable element update', () => {
    const store = useEditor.getState(); store.updateElement('title', { text: 'Changed' }, 'edit')
    expect(useEditor.getState().document.slides['./slides/001-intro.json'].elements.find(item => item.id === 'title')).toMatchObject({ text: 'Changed' })
    useEditor.getState().undo()
    expect(useEditor.getState().document.slides['./slides/001-intro.json'].elements.find(item => item.id === 'title')).not.toMatchObject({ text: 'Changed' })
    useEditor.getState().redo()
    expect(useEditor.getState().document.slides['./slides/001-intro.json'].elements.find(item => item.id === 'title')).toMatchObject({ text: 'Changed' })
  })
  it('marks only active slide dirty for an element update', () => {
    const store = useEditor.getState(); store.updateElement('title', { text: 'Changed' })
    expect([...useEditor.getState().dirtyPaths]).toEqual(['./slides/001-intro.json'])
  })
  it('renames only the active slide and records history', () => {
    const store = useEditor.getState(); store.renameSlide('研究结论')
    const state = useEditor.getState()
    expect(state.document.slides[state.activeSlidePath].name).toBe('研究结论')
    expect([...state.dirtyPaths]).toEqual([state.activeSlidePath])
    expect(state.past.at(-1)?.label).toBe('重命名页面')
  })
  it('creates a new page from a readable layout preset', () => {
    useEditor.getState().addSlide('image-right')
    const state = useEditor.getState(); const slide = state.document.slides[state.activeSlidePath]
    expect(slide.layoutRef).toBe('image-right')
    expect(slide.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'text', text: '让图片承担一半表达' }),
      expect.objectContaining({ type: 'image', src: 'placeholder:image' }),
    ]))
    expect([...state.dirtyPaths]).toEqual(['deck.json', state.activeSlidePath])
  })
  it('adds a shape with editable text defaults', () => {
    useEditor.getState().addElement('shape')
    const state = useEditor.getState(); const shape = state.document.slides[state.activeSlidePath].elements.at(-1)
    expect(shape).toMatchObject({ type: 'shape', text: '双击添加文字', align: 'center', verticalAlign: 'middle' })
  })
})
