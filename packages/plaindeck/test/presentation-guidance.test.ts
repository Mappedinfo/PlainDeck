import { describe, expect, it } from 'vitest'
import { auditPresentation, createDeckTemplate, createPresentationGuidance, PresentationBriefSchema, PROJECT_PATHS, type SlideElement } from '../src/core/index.js'

const text = (value: string, overrides: Partial<Extract<SlideElement, { type: 'text' }>> = {}): SlideElement => ({
  id: 'title', type: 'text', text: value, styleRef: 'slide-title', fontSize: 40,
  frame: { x: 80, y: 60, w: 1200, h: 100 }, ...overrides,
})

function fixture(elements: SlideElement[]) {
  const document = createDeckTemplate('blank')
  const path = document.deck.slides[0]
  document.slides[path].elements = elements
  return document
}

describe('presentation guidance', () => {
  it('produces the same offline brief and affirmative workflow in both languages', () => {
    for (const locale of ['zh', 'en'] as const) {
      const guidance = createPresentationGuidance({ locale, audience: 'faculty', purpose: 'Choose a method', keyMessage: 'Shared themes preserve consistency', minutes: 12, evidenceDepth: 'detailed' })
      expect(guidance.brief).toMatchObject({ audience: 'faculty', minutes: 12, evidenceDepth: 'detailed' })
      expect(guidance.prompt).toContain('Shared themes preserve consistency')
      expect(guidance.prompt).toContain('Choose a method')
      expect(guidance.principles.find(step => step.id === 'affirmative-claim')?.detail).toContain('A')
      expect(guidance.workflow.map(step => step.id)).toEqual(['brief', 'evidence', 'storyboard', 'build', 'check', 'revise'])
      expect(guidance.slidePlanFields).toEqual(expect.arrayContaining(['claim', 'source', 'visualRelationship', 'claimBoundary', 'seconds']))
    }
  })

  it('validates shared input and returns independent guidance values', () => {
    expect(PresentationBriefSchema.parse({})).toMatchObject({ audience: 'general', minutes: 10, evidenceDepth: 'supported' })
    for (const minutes of [0, -1, 241, NaN, Infinity]) expect(() => createPresentationGuidance({ minutes })).toThrow()
    expect(() => PresentationBriefSchema.parse({ audience: 'unknown' })).toThrow()
    expect(() => PresentationBriefSchema.parse({ keyMessage: 'x'.repeat(2001) })).toThrow()
    const first = createPresentationGuidance()
    first.principles[0].title = 'mutated'
    first.workflow[0].detail = 'mutated'
    expect(createPresentationGuidance().principles[0].title).not.toBe('mutated')
    expect(createPresentationGuidance().workflow[0].detail).not.toBe('mutated')
  })

  it('flags contrast detours with stable locations without rewriting scientific negatives', () => {
    const document = fixture([
      text('这不是一个装饰工具，而是可编辑的工作流。'),
      text('This is not about decoration, but about evidence.', { id: 'body' }),
      text('No significant effect was observed.', { id: 'negative-result' }),
      text('没有观察到显著差异。', { id: 'negative-result-zh' }),
      text('不是字越多越好，而是要清楚。', { id: 'hidden', opacity: 0 }),
    ])
    const before = JSON.stringify(document)
    const result = auditPresentation(document)
    expect(result.kind).toBe('advisory')
    expect(result.issues.filter(issue => issue.code === 'contrast-detour').map(issue => issue.elementId)).toEqual(['title', 'body'])
    expect(result.issues[0]).toMatchObject({ slidePath: document.deck.slides[0], slideIndex: 1 })
    expect(result.issues[0].suggestion).not.toContain('装饰')
    expect(JSON.stringify(document)).toBe(before)
  })

  it('reports geometry, pending evidence and small text while retaining manual checks', () => {
    const document = fixture([
      text('结果'),
      text('TODO', { id: 'body', fontSize: 14, frame: { x: 1590, y: 40, w: 100, h: 100 } }),
      text('Citation', { id: 'source', fontSize: 14 }),
    ])
    const result = auditPresentation(document, { locale: 'en' })
    expect(result.issues.map(issue => issue.code)).toEqual(expect.arrayContaining(['topic-title', 'outside-canvas', 'small-text', 'placeholder']))
    expect(result.issues.some(issue => issue.elementId === 'source')).toBe(false)
    expect(result.manualChecks.join(' ')).toContain('even when automated checks report no issues')
    const clean = auditPresentation(fixture([text('A shared theme keeps slides consistent')]))
    expect(clean.issues).toEqual([])
    expect(clean.manualChecks.length).toBeGreaterThan(0)
    expect(clean).not.toHaveProperty('score')
  })

  it('scales text guidance by audience and detects repeated layout and dense tables', () => {
    const document = fixture([text('证据支持这个判断'), text('证'.repeat(180), { id: 'body' })])
    expect(auditPresentation(document).issues.some(issue => issue.code === 'dense-slide')).toBe(true)
    expect(auditPresentation(document, { audience: 'archive' }).issues.some(issue => issue.code === 'dense-slide')).toBe(false)
    const mixed = fixture([text('AI' + '证'.repeat(180), { id: 'body' })])
    expect(auditPresentation(mixed).issues.some(issue => issue.code === 'dense-slide')).toBe(true)
    const slide = document.slides[document.deck.slides[0]]
    slide.layoutRef = 'statement'
    for (const n of [2, 3]) {
      const path = `${PROJECT_PATHS.slidesDir}00${n}-test.json`
      document.deck.slides.push(path)
      document.slides[path] = { ...structuredClone(slide), id: `slide-${n}` }
    }
    slide.elements.push({ id: 'table', type: 'table', cells: Array.from({ length: 14 }, () => ['Method', '12']), headerRows: 1, style: 'rules', frame: { x: 80, y: 180, w: 1200, h: 500 } })
    const result = auditPresentation(document)
    expect(result.issues.find(issue => issue.code === 'layout-repetition')?.slideIndex).toBe(3)
    expect(result.issues.find(issue => issue.code === 'dense-table')?.elementId).toBe('table')
  })

  it('marks built-in sample metrics and uses affirmative template guidance', () => {
    for (const lang of ['zh', 'en'] as const) {
      const pitch = createDeckTemplate('pitch', { lang })
      const pitchText = JSON.stringify(pitch)
      expect(pitchText).not.toContain('3×')
      expect(auditPresentation(pitch).issues.some(issue => issue.code === 'placeholder')).toBe(true)
      const nature = createDeckTemplate('nature-methods', { lang })
      expect(auditPresentation(nature).issues.some(issue => issue.code === 'contrast-detour')).toBe(false)
      expect(JSON.stringify(nature)).toContain(lang === 'zh' ? '示例数据' : 'Illustrative data')
    }
  })
})
