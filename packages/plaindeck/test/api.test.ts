import { cp, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyOperations, canonicalJson, inspectDeck, loadDeck, saveDeck, validateDeck } from '../src/index.js'

const starter = resolve('examples/starter')

describe('PlainDeck public API', () => {
  it('loads, validates, inspects, and canonicalizes the starter deck', async () => {
    const document = await loadDeck(starter)
    expect(validateDeck(document)).toMatchObject({ valid: true, issues: [] })
    expect(inspectDeck(document).slides).toHaveLength(5)
    expect(canonicalJson(document.deck)).toContain('"schemaVersion": "0.1"')
  })

  it('applies stable element and slide operations without mutating input', async () => {
    const original = await loadDeck(starter)
    const result = applyOperations(original, [
      { op: 'set-element', slide: './slides/001-intro.json', element: 'title', patch: { text: 'Agent title' } },
      { op: 'add-slide', id: 'agent-results', layout: 'image-right', name: 'Agent results' },
    ])
    expect(original.slides['./slides/001-intro.json'].elements.find(element => element.id === 'title')).not.toMatchObject({ text: 'Agent title' })
    expect(result.changedPaths).toEqual(['./slides/001-intro.json', 'deck.json', './slides/006-agent-results.json'])
    expect(result.document.deck.slides).toHaveLength(6)
  })

  it('rejects invalid operations before any file write', async () => {
    const document = await loadDeck(starter)
    expect(() => applyOperations(document, [{ op: 'set-element', slide: './slides/001-intro.json', element: 'missing', patch: { text: 'x' } }])).toThrow('元素不存在')
    expect(() => applyOperations(document, [{ op: 'set-element', slide: './slides/001-intro.json', element: 'title', patch: { id: 'changed' } }])).toThrow('不允许修改')
    const oneSlide = structuredClone(document); oneSlide.deck.slides = [oneSlide.deck.slides[0]]; oneSlide.slides = { [oneSlide.deck.slides[0]]: oneSlide.slides[oneSlide.deck.slides[0]] }
    expect(() => applyOperations(oneSlide, [{ op: 'remove-slide', slide: oneSlide.deck.slides[0] }])).toThrow('最后一页')
  })

  it('saves only changed paths', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-api-'))
    await cp(starter, root, { recursive: true })
    const originalOtherSlide = await readFile(join(root, 'slides/002-three-ways.json'), 'utf8')
    const result = applyOperations(await loadDeck(root), [{ op: 'rename-slide', slide: './slides/001-intro.json', name: 'Renamed by Agent' }])
    await saveDeck(root, result.document, result.changedPaths)
    expect(await readFile(join(root, 'slides/001-intro.json'), 'utf8')).toContain('Renamed by Agent')
    expect(await readFile(join(root, 'slides/002-three-ways.json'), 'utf8')).toBe(originalOtherSlide)
  })
})
