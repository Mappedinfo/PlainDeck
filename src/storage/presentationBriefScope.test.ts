import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSampleDocument } from '../core/sample'
import { useEditor } from '../store'
import type { DirectoryHandle } from './browserStorage'
import { createDirectoryBriefScopeResolver, type DirectoryBriefScopeRecord, type DirectoryBriefScopeRegistry } from './presentationBriefScope'

function directory(identity: string) {
  const handle = {
    name: 'deck', kind: 'directory' as const, identity,
    isSameEntry: vi.fn(async (other: { identity?: string }) => other.identity === identity),
    queryPermission: vi.fn(), requestPermission: vi.fn(),
  }
  return handle as unknown as DirectoryHandle & typeof handle
}

function memoryRegistry(): DirectoryBriefScopeRegistry & { records: DirectoryBriefScopeRecord[] } {
  const records: DirectoryBriefScopeRecord[] = []
  return { records, read: async () => [...records], write: async record => { records.push(record) } }
}

describe('directory presentation brief identity', () => {
  it('matches actual entries across resolver sessions and isolates same-name folders', async () => {
    const registry = memoryRegistry()
    const first = directory('/private/deck')
    const second = directory('/public/deck')
    const resolve = createDirectoryBriefScopeResolver(registry)
    const privateScope = await resolve(first)
    const publicScope = await resolve(second)
    expect(privateScope).toMatch(/^directory:/)
    expect(publicScope).not.toBe(privateScope)
    expect(registry.records).toHaveLength(2)

    const nextSession = createDirectoryBriefScopeResolver(registry)
    expect(await nextSession(directory('/private/deck'))).toBe(privateScope)
    expect(await nextSession(directory('/public/deck'))).toBe(publicScope)
    expect(first.queryPermission).not.toHaveBeenCalled()
    expect(first.requestPermission).not.toHaveBeenCalled()
    expect(second.queryPermission).not.toHaveBeenCalled()
    expect(second.requestPermission).not.toHaveBeenCalled()
  })

  it('serializes concurrent resolutions and reuses a pending request for the same handle', async () => {
    const registry = memoryRegistry()
    const resolve = createDirectoryBriefScopeResolver(registry)
    const handle = directory('/private/deck')
    const pending = resolve(handle)
    expect(resolve(handle)).toBe(pending)
    const [first, sameEntry, differentEntry] = await Promise.all([pending, resolve(directory('/private/deck')), resolve(directory('/public/deck'))])
    expect(first).toBe(sameEntry)
    expect(first).not.toBe(differentEntry)
    expect(registry.records).toHaveLength(2)
  })

  it.each(['read', 'write', 'identity'] as const)('falls back to an isolated per-handle scope after %s failure', async failure => {
    const registry = memoryRegistry()
    const oldHandle = directory('/old/deck')
    registry.records.push({ scope: 'directory:old', handle: oldHandle })
    if (failure === 'read') registry.read = async () => { throw new Error('Storage unavailable') }
    if (failure === 'write') registry.write = async () => { throw new DOMException('Handle cannot be cloned', 'DataCloneError') }
    const first = directory('/private/deck'); const second = directory('/public/deck')
    if (failure === 'identity') {
      first.isSameEntry.mockRejectedValue(new Error('Identity unavailable'))
      second.isSameEntry.mockRejectedValue(new Error('Identity unavailable'))
    }
    const resolve = createDirectoryBriefScopeResolver(registry)
    const firstScope = await resolve(first)
    const secondScope = await resolve(second)
    expect(firstScope).not.toBe('directory:old')
    expect(secondScope).not.toBe(firstScope)
    expect(await resolve(first)).toBe(firstScope)
  })

  it('uses a fresh scope when identity or IndexedDB is unavailable', async () => {
    const read = vi.fn(async () => [])
    const noIdentity = { kind: 'directory', name: 'deck' } as DirectoryHandle
    const resolve = createDirectoryBriefScopeResolver({ read, write: async () => undefined })
    const scope = await resolve(noIdentity)
    expect(await resolve(noIdentity)).toBe(scope)
    expect(read).not.toHaveBeenCalled()
    const indexedDB = globalThis.indexedDB
    vi.stubGlobal('indexedDB', undefined)
    try {
      const browserResolve = createDirectoryBriefScopeResolver()
      const first = directory('/private/deck')
      const privateScope = await browserResolve(first)
      expect(await browserResolve(first)).toBe(privateScope)
      expect(await browserResolve(directory('/public/deck'))).not.toBe(privateScope)
    } finally { vi.stubGlobal('indexedDB', indexedDB) }
  })

  it('ignores malformed registry entries', async () => {
    const write = vi.fn(async () => undefined)
    const resolve = createDirectoryBriefScopeResolver({ read: async () => [null, {}, { scope: 'sample', handle: directory('/private/deck') }], write })
    const handle = directory('/private/deck')
    const scope = await resolve(handle)
    expect(scope).toMatch(/^directory:/)
    expect(write).toHaveBeenCalledWith({ scope, handle })
  })
})

describe('editor presentation brief scope', () => {
  const initial = useEditor.getState()
  afterEach(() => { useEditor.setState(initial, true) })

  it('starts with the persistent sample scope and isolates explicit replacements with identical deck IDs', () => {
    expect(initial.briefScope).toBe('sample')
    const document = createSampleDocument()
    const before = JSON.stringify(document)
    useEditor.getState().setDocument(document)
    const first = useEditor.getState().briefScope
    useEditor.getState().setDocument(structuredClone(document))
    expect(useEditor.getState().briefScope).not.toBe(first)
    expect(JSON.stringify(document)).toBe(before)
    expect(useEditor.getState().document).not.toHaveProperty('briefScope')
  })

  it('preserves an explicit directory scope through edits, undo, redo and language refresh', () => {
    useEditor.getState().setDocument(createSampleDocument(), directory('/private/deck'), 'directory:existing')
    useEditor.getState().updateElement('title', { text: 'Updated title' })
    expect(useEditor.getState().briefScope).toBe('directory:existing')
    useEditor.getState().undo()
    expect(useEditor.getState().briefScope).toBe('directory:existing')
    useEditor.getState().redo()
    expect(useEditor.getState().briefScope).toBe('directory:existing')
    useEditor.getState().setDocument(createSampleDocument('en'), null, useEditor.getState().briefScope)
    expect(useEditor.getState().briefScope).toBe('directory:existing')
  })

  it('gives restored projects a fresh scope when their stored brief identity is unknown', () => {
    useEditor.getState().setDocument(createSampleDocument(), null, 'unrelated-brief')
    useEditor.getState().restoreDocument(createSampleDocument(), 2)
    expect(useEditor.getState().briefScope).not.toBe('unrelated-brief')
    expect(useEditor.getState().saveState).toBe('dirty')
  })
})
