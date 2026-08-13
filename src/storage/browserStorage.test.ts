import { beforeEach, describe, expect, it } from 'vitest'
import { applyOperations } from 'plaindeck/core'
import { createSampleDocument } from '../core/sample'
import { clearRecoveryFromOpfs, initializeProject, readProject, restoreFromOpfs, snapshotToOpfs, writeProject, type DirectoryHandle } from './browserStorage'

class MemoryFileHandle {
  kind = 'file' as const
  constructor(public name: string, public content = '', private readonly events: string[] = []) {}
  async getFile() { return { text: async () => this.content } as File }
  async createWritable() {
    let next: string | Blob = ''
    return {
      write: async (value: string | Blob) => { next = value },
      close: async () => { this.content = typeof next === 'string' ? next : await next.text(); this.events.push(`write:${this.name}`) },
    } as FileSystemWritableFileStream
  }
}

class MemoryDirectoryHandle {
  kind = 'directory' as const
  readonly directories = new Map<string, MemoryDirectoryHandle>()
  readonly files = new Map<string, MemoryFileHandle>()
  constructor(public name: string, readonly events: string[] = [], private readonly prefix = '') {}
  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const existing = this.directories.get(name)
    if (existing) return existing
    if (!options?.create) throw new DOMException(`Missing directory ${name}`, 'NotFoundError')
    const directory = new MemoryDirectoryHandle(name, this.events, `${this.prefix}${name}/`); this.directories.set(name, directory); return directory
  }
  async getFileHandle(name: string, options?: { create?: boolean }) {
    const existing = this.files.get(name)
    if (existing) return existing
    if (!options?.create) throw new DOMException(`Missing file ${name}`, 'NotFoundError')
    const file = new MemoryFileHandle(`${this.prefix}${name}`, '', this.events); this.files.set(name, file); return file
  }
  async removeEntry(name: string) {
    if (!this.files.delete(name) && !this.directories.delete(name)) throw new DOMException(`Missing entry ${name}`, 'NotFoundError')
    this.events.push(`remove:${this.prefix}${name}`)
  }
  async queryPermission() { return 'granted' as const }
  async requestPermission() { return 'granted' as const }
}

function directory(name = 'deck') {
  return new MemoryDirectoryHandle(name) as unknown as DirectoryHandle
}

async function put(root: DirectoryHandle, path: string, content: string) {
  const parts = path.replace(/^\.\//, '').split('/'); const name = parts.pop()!
  let current = root
  for (const part of parts) current = await current.getDirectoryHandle(part, { create: true })
  const handle = await current.getFileHandle(name, { create: true }); const writable = await handle.createWritable(); await writable.write(content); await writable.close()
}

describe('browser project storage', () => {
  beforeEach(() => { Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined }) })

  it('refuses initialization before overwriting any planned file', async () => {
    const root = directory(); await put(root, './theme.json', 'keep-theme')
    await expect(initializeProject(root, createSampleDocument())).rejects.toThrow('theme.json')
    await expect(root.getFileHandle('deck.json')).rejects.toMatchObject({ name: 'NotFoundError' })
    expect(await (await root.getFileHandle('theme.json')).getFile().then(file => file.text())).toBe('keep-theme')
  })

  it('uses the shared commit order and removes deleted slide files', async () => {
    const events: string[] = []; const memory = new MemoryDirectoryHandle('deck', events); const root = memory as unknown as DirectoryHandle
    const original = createSampleDocument(); await initializeProject(root, original); events.length = 0
    const added = applyOperations(original, [{ op: 'add-slide', id: 'browser-safe', layout: 'blank' }])
    await writeProject(root, added.document, new Set(added.changedPaths))
    expect(events).toEqual(['write:slides/008-browser-safe.json', 'write:deck.json'])
    events.length = 0
    const removed = applyOperations(added.document, [{ op: 'remove-slide', slide: './slides/008-browser-safe.json' }])
    await writeProject(root, removed.document, new Set(removed.changedPaths))
    expect(events).toEqual(['write:deck.json', 'remove:slides/008-browser-safe.json'])
    expect((await readProject(root)).deck.slides).not.toContain('./slides/008-browser-safe.json')
  })

  it('restores only validated, dirty snapshots for the matching project', async () => {
    const opfs = new MemoryDirectoryHandle('opfs') as unknown as FileSystemDirectoryHandle
    Object.defineProperty(navigator, 'storage', { configurable: true, value: { getDirectory: async () => opfs } })
    const document = createSampleDocument()
    await snapshotToOpfs({ document, projectFingerprint: 'deck:sample', revision: 2, persistedRevision: 1 })
    await expect(restoreFromOpfs('other:sample')).resolves.toBeNull()
    await expect(restoreFromOpfs('deck:sample')).resolves.toMatchObject({ revision: 2, persistedRevision: 1, document: { deck: { id: document.deck.id } } })
    await clearRecoveryFromOpfs()
    await expect(restoreFromOpfs('deck:sample')).resolves.toBeNull()
  })
})
