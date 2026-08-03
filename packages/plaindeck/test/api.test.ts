import { cp, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyOperations, canonicalJson, createDeckTemplate, createSavePlan, deckTemplatePresets, inspectDeck, loadDeck, resolveFooterSlot, saveDeck, themePresets, validateDeck } from '../src/index.js'

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

  it('keeps optional element animation and camera motion human-readable and schema-valid', () => {
    const document = createDeckTemplate('showcase')
    const slidePath = document.deck.slides[0]
    const element = document.slides[slidePath].elements[0]
    element.animation = { enter: 'fade-up', delayFrames: 12, durationFrames: 20 }
    document.slides[slidePath].motion = { camera: { fromScale: 1, toScale: 1.045, durationFrames: 180 } }
    expect(validateDeck(document)).toMatchObject({ valid: true, issues: [] })
    const serialized = canonicalJson(document.slides[slidePath])
    expect(serialized).toContain('"motion"')
    expect(serialized).toContain('"animation"')
    expect(serialized.indexOf('"enter"')).toBeLessThan(serialized.indexOf('"delayFrames"'))
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

  it('sets a document footer through the operation kernel and resolves automatic fields', () => {
    const original = createDeckTemplate('showcase')
    const footer = { left: { type: 'deck-title' }, center: { type: 'date' }, right: { type: 'page-of-count' }, fontSize: 16 } as const
    const result = applyOperations(original, [{ op: 'set-footer', footer }])
    expect(original.deck.footer).toBeUndefined()
    expect(result.document.deck.footer).toEqual(footer)
    expect(result.changedPaths).toEqual(['deck.json'])
    expect(inspectDeck(result.document).footer).toEqual(footer)
    expect(resolveFooterSlot(footer.right, { pageNumber: 2, pageCount: 5, deckTitle: 'Deck', slideName: 'Slide' })).toBe('2 / 5')
    expect(resolveFooterSlot(footer.center, { pageNumber: 2, pageCount: 5, deckTitle: 'Deck', slideName: 'Slide', date: '2026-08-03' })).toBe('2026-08-03')
    expect(applyOperations(result.document, [{ op: 'set-footer', footer: null }]).document.deck.footer).toBeUndefined()
  })

  it('duplicates and reorders slides and elements by stable IDs', async () => {
    const original = await loadDeck(starter)
    const slidePath = original.deck.slides[0]
    const [first, second] = original.slides[slidePath].elements
    const result = applyOperations(original, [
      { op: 'move-element', slide: slidePath, element: second.id, before: first.id },
      { op: 'move-slide', slide: original.deck.slides[4], before: original.deck.slides[0] },
      { op: 'duplicate-slide', slide: slidePath, id: 'intro-copy', name: 'Intro copy' },
    ])
    expect(result.document.slides[slidePath].elements.slice(0, 2).map(element => element.id)).toEqual([second.id, first.id])
    expect(result.document.deck.slides[0]).toBe(original.deck.slides[4])
    expect(result.document.deck.slides[2]).toBe('./slides/006-intro-copy.json')
    expect(result.document.slides['./slides/006-intro-copy.json']).toMatchObject({ id: 'intro-copy', name: 'Intro copy' })
    expect(result.changedPaths).toEqual([slidePath, 'deck.json', './slides/006-intro-copy.json'])
  })

  it('rejects invalid operations before any file write', async () => {
    const document = await loadDeck(starter)
    expect(() => applyOperations(document, [{ op: 'set-element', slide: './slides/001-intro.json', element: 'missing', patch: { text: 'x' } }])).toThrow('元素不存在')
    expect(() => applyOperations(document, [{ op: 'set-element', slide: './slides/001-intro.json', element: 'title', patch: { id: 'changed' } }])).toThrow('不允许修改')
    const oneSlide = structuredClone(document); oneSlide.deck.slides = [oneSlide.deck.slides[0]]; oneSlide.slides = { [oneSlide.deck.slides[0]]: oneSlide.slides[oneSlide.deck.slides[0]] }
    expect(() => applyOperations(oneSlide, [{ op: 'remove-slide', slide: oneSlide.deck.slides[0] }])).toThrow('最后一页')
    expect(() => applyOperations(document, [{ op: 'move-slide', slide: document.deck.slides[0], before: document.deck.slides[1], after: document.deck.slides[2] }])).toThrow('必须且只能')
    expect(() => applyOperations(document, [{ op: 'move-element', slide: document.deck.slides[0], element: 'title', before: 'missing' }])).toThrow('移动目标不存在')
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

  it('writes content before deck.json and deletes removed slides after the commit point', async () => {
    const original = await loadDeck(starter)
    const added = applyOperations(original, [{ op: 'add-slide', id: 'safe-commit', layout: 'blank' }])
    const addPlan = createSavePlan(added.document, added.changedPaths)
    expect(addPlan.writes.map(write => write.path)).toEqual(['./slides/006-safe-commit.json', 'deck.json'])

    const removedPath = original.deck.slides[0]
    const removed = applyOperations(original, [{ op: 'remove-slide', slide: removedPath }])
    const removePlan = createSavePlan(removed.document, removed.changedPaths)
    expect(removePlan.writes.map(write => write.path)).toEqual(['deck.json'])
    expect(removePlan.deletions).toEqual([removedPath])

    const root = await mkdtemp(join(tmpdir(), 'plaindeck-api-delete-'))
    await cp(starter, root, { recursive: true })
    await saveDeck(root, removed.document, removed.changedPaths)
    await expect(readFile(join(root, removedPath.replace(/^\.\//, '')), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
