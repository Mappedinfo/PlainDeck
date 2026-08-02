import { beforeEach, describe, expect, it } from 'vitest'
import { createSampleDocument } from './sample'
import { useEditor } from '../store'
import { createSaveLoop } from './saveLoop'

describe('revision-aware save loop', () => {
  beforeEach(() => useEditor.getState().setDocument(createSampleDocument()))

  it('serializes writes and immediately persists an edit made during a save', async () => {
    let releaseFirst!: () => void
    const firstBlocked = new Promise<void>(resolve => { releaseFirst = resolve })
    const savedTexts: string[] = []
    let activeWrites = 0; let maxActiveWrites = 0
    const loop = createSaveLoop({
      hasPending: () => useEditor.getState().dirtyRevisions.size > 0,
      saveOnce: async () => {
        const state = useEditor.getState(); const captured = new Map(state.dirtyRevisions); const document = structuredClone(state.document)
        activeWrites += 1; maxActiveWrites = Math.max(maxActiveWrites, activeWrites)
        savedTexts.push((document.slides[state.activeSlidePath].elements.find(element => element.id === 'title') as { text: string }).text)
        if (savedTexts.length === 1) await firstBlocked
        activeWrites -= 1
        useEditor.getState().clearDirty(captured)
      },
      onError: error => { throw error },
    })

    useEditor.getState().updateElement('title', { text: 'v1' })
    const firstSave = loop.request()
    await Promise.resolve()
    useEditor.getState().updateElement('title', { text: 'v2' })
    const joinedSave = loop.request()
    releaseFirst()
    await Promise.all([firstSave, joinedSave])

    expect(savedTexts).toEqual(['v1', 'v2'])
    expect(maxActiveWrites).toBe(1)
    expect(useEditor.getState().dirtyPaths.size).toBe(0)
  })
})
