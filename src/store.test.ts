import { beforeEach, describe, expect, it } from 'vitest'
import { applyOperations, themePresets } from 'plaindeck/core'
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
    const firstSlide = useEditor.getState().document.deck.slides[0]
    const store = useEditor.getState(); store.updateElement('title', { text: 'Changed' }, 'edit')
    expect(useEditor.getState().document.slides[firstSlide].elements.find(item => item.id === 'title')).toMatchObject({ text: 'Changed' })
    useEditor.getState().undo()
    expect(useEditor.getState().document.slides[firstSlide].elements.find(item => item.id === 'title')).not.toMatchObject({ text: 'Changed' })
    useEditor.getState().redo()
    expect(useEditor.getState().document.slides[firstSlide].elements.find(item => item.id === 'title')).toMatchObject({ text: 'Changed' })
  })
  it('marks only active slide dirty for an element update', () => {
    const store = useEditor.getState(); store.updateElement('title', { text: 'Changed' })
    expect([...useEditor.getState().dirtyPaths]).toEqual([useEditor.getState().activeSlidePath])
  })
  it('produces the same document as the public operation kernel', () => {
    const before = createSampleDocument(); const path = before.deck.slides[0]
    const expected = applyOperations(before, [{ op: 'set-element', slide: path, element: 'title', patch: { text: 'One kernel' } }])
    useEditor.getState().setDocument(before)
    useEditor.getState().updateElement('title', { text: 'One kernel' })
    expect(useEditor.getState().document).toEqual(expected.document)
    expect([...useEditor.getState().dirtyPaths]).toEqual(expected.changedPaths)
  })
  it('applies a color system to theme-bound slide elements', () => {
    const theme = themePresets.find(preset => preset.id === 'night-citrus')!.theme
    useEditor.getState().applyTheme(theme)
    const state = useEditor.getState(); const cover = state.document.slides[state.activeSlidePath]
    expect(cover.background).toEqual({ color: '#101714' })
    expect(cover.elements.find(element => element.id === 'accent-panel')).toMatchObject({ type: 'shape', fill: '#D8FF52' })
    expect([...state.dirtyPaths]).toEqual(['./theme.json', ...state.document.deck.slides])
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
  it('duplicates and moves pages through stable operations', () => {
    const originalPath = useEditor.getState().activeSlidePath
    useEditor.getState().duplicateSlide()
    const duplicatePath = useEditor.getState().activeSlidePath
    expect(duplicatePath).not.toBe(originalPath)
    expect(useEditor.getState().document.deck.slides[1]).toBe(duplicatePath)
    useEditor.getState().moveSlide(1)
    expect(useEditor.getState().document.deck.slides[2]).toBe(duplicatePath)
    expect([...useEditor.getState().dirtyPaths]).toEqual(['deck.json', duplicatePath])
  })
  it('reorders layers through element IDs', () => {
    const state = useEditor.getState(); const slide = state.document.slides[state.activeSlidePath]
    const element = slide.elements[0]; const next = slide.elements[1]
    state.select([element.id]); useEditor.getState().reorderLayer(1)
    expect(useEditor.getState().document.slides[state.activeSlidePath].elements.slice(0, 2).map(item => item.id)).toEqual([next.id, element.id])
  })
  it('aligns multiple elements through a set-element operation batch', () => {
    const state = useEditor.getState(); const slide = state.document.slides[state.activeSlidePath]; const selected = slide.elements.slice(0, 2)
    state.select(selected.map(element => element.id)); useEditor.getState().alignSelected('left')
    const aligned = useEditor.getState().document.slides[state.activeSlidePath].elements.filter(element => selected.some(item => item.id === element.id))
    expect(new Set(aligned.map(element => element.frame.x)).size).toBe(1)
    expect([...useEditor.getState().dirtyPaths]).toEqual([state.activeSlidePath])
  })
  it('adds a shape with editable text defaults', () => {
    useEditor.getState().addElement('shape')
    const state = useEditor.getState(); const shape = state.document.slides[state.activeSlidePath].elements.at(-1)
    expect(shape).toMatchObject({ type: 'shape', text: '双击添加文字', align: 'center', verticalAlign: 'middle' })
  })
  it('adds imported images through the public operation kernel', () => {
    const path = useEditor.getState().activeSlidePath
    const id = useEditor.getState().addImage('data:image/png;base64,iVBORw0KGgo=', { x: 120, y: 80, w: 400, h: 240 }, 'local.png')
    const state = useEditor.getState(); const image = state.document.slides[path].elements.find(element => element.id === id)
    expect(image).toMatchObject({ type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', frame: { x: 120, y: 80, w: 400, h: 240 }, alt: 'local.png' })
    expect(state.selectedIds).toEqual([id])
    expect([...state.dirtyPaths]).toEqual([path])
  })
})
