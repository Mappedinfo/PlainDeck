import { beforeEach, describe, expect, it } from 'vitest'
import { createSampleDocument } from './core/sample'
import { useEditor } from './store'

describe('editor command history', () => {
  beforeEach(() => useEditor.getState().setDocument(createSampleDocument()))
  it('undoes and redoes one stable element update', () => {
    const store = useEditor.getState(); store.updateElement('title', { text: 'Changed' }, 'edit')
    expect(useEditor.getState().document.slides['./slides/001-title.json'].elements.find(item => item.id === 'title')).toMatchObject({ text: 'Changed' })
    useEditor.getState().undo()
    expect(useEditor.getState().document.slides['./slides/001-title.json'].elements.find(item => item.id === 'title')).not.toMatchObject({ text: 'Changed' })
    useEditor.getState().redo()
    expect(useEditor.getState().document.slides['./slides/001-title.json'].elements.find(item => item.id === 'title')).toMatchObject({ text: 'Changed' })
  })
  it('marks only active slide dirty for an element update', () => {
    const store = useEditor.getState(); store.updateElement('title', { text: 'Changed' })
    expect([...useEditor.getState().dirtyPaths]).toEqual(['./slides/001-title.json'])
  })
})
