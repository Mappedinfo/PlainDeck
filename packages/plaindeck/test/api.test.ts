import { cp, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyOperations, canonicalJson, createDeckTemplate, deckTemplatePresets, inspectDeck, loadDeck, saveDeck, themePresets, validateDeck } from '../src/index.js'

const starter = resolve('examples/starter')

describe('PlainDeck public API', () => {
  it('creates every built-in template with a valid theme and stable slide paths', () => {
    for (const template of deckTemplatePresets) {
      const document = createDeckTemplate(template.id, { title: `Test ${template.id}`, theme: 'night-citrus' })
      expect(validateDeck(document)).toMatchObject({ valid: true, issues: [] })
      expect(document.deck.slides).toHaveLength(template.slideCount)
      expect(document.deck.slides).toEqual(document.deck.slides.map((_, index) => expect.stringMatching(new RegExp(`^\\./slides/${String(index + 1).padStart(3, '0')}-`))))
      expect(document.theme.colors).toEqual(themePresets.find(theme => theme.id === 'night-citrus')?.colors)
    }
  })

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

  it('recolors theme-bound template elements through set-theme', () => {
    const original = createDeckTemplate('showcase', { theme: 'studio-cobalt' })
    const result = applyOperations(original, [{ op: 'set-theme', patch: { background: '#101714', accent: '#D8FF52' } }])
    const cover = result.document.slides['./slides/001-cover.json']
    expect(cover.background).toEqual({ color: '#101714' })
    expect(cover.elements.find(element => element.id === 'accent-panel')).toMatchObject({ type: 'shape', fill: '#D8FF52' })
    expect(original.slides['./slides/001-cover.json'].background).toEqual({ color: '#F2F0E8' })
    expect(result.changedPaths).toEqual(['./theme.json', ...result.document.deck.slides])
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
