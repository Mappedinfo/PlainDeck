import { z } from 'zod'
import { createLayoutElements, layoutPresets } from './presets.js'
import { ElementSchema, assertDocument, type DeckDocument, type SlideElement } from './schema.js'

const LayoutIdSchema = z.enum(['blank', 'title-body', 'section', 'two-column', 'image-right', 'three-cards'])
const SlidePathSchema = z.string().startsWith('./slides/').endsWith('.json')
const ColorPatchSchema = z.object({
  background: z.string().optional(), text: z.string().optional(), muted: z.string().optional(), accent: z.string().optional(),
}).strict()

export const DeckOperationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('set-element'), slide: SlidePathSchema, element: z.string().min(1), patch: z.record(z.unknown()) }).strict(),
  z.object({ op: z.literal('add-element'), slide: SlidePathSchema, element: ElementSchema }).strict(),
  z.object({ op: z.literal('remove-element'), slide: SlidePathSchema, element: z.string().min(1) }).strict(),
  z.object({ op: z.literal('add-slide'), layout: LayoutIdSchema.default('blank'), name: z.string().min(1).optional(), after: SlidePathSchema.optional(), id: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional() }).strict(),
  z.object({ op: z.literal('rename-slide'), slide: SlidePathSchema, name: z.string().trim().min(1) }).strict(),
  z.object({ op: z.literal('remove-slide'), slide: SlidePathSchema }).strict(),
  z.object({ op: z.literal('set-theme'), patch: ColorPatchSchema }).strict(),
])

export const DeckOperationsSchema = z.array(DeckOperationSchema).min(1)
export type DeckOperation = z.infer<typeof DeckOperationSchema>

export interface ApplyOperationsResult {
  document: DeckDocument
  changedPaths: string[]
}

function requireSlide(document: DeckDocument, path: string) {
  const slide = document.slides[path]
  if (!slide || !document.deck.slides.includes(path)) throw new Error(`页面不存在：${path}`)
  return slide
}

function uniqueSlidePath(document: DeckDocument, id: string) {
  let sequence = document.deck.slides.length + 1
  while (document.slides[`./slides/${String(sequence).padStart(3, '0')}-${id}.json`]) sequence += 1
  return `./slides/${String(sequence).padStart(3, '0')}-${id}.json`
}

export function applyOperations(input: DeckDocument, rawOperations: unknown): ApplyOperationsResult {
  const operations = DeckOperationsSchema.parse(rawOperations)
  const document = structuredClone(input)
  const changed = new Set<string>()

  for (const operation of operations) {
    if (operation.op === 'set-element') {
      const slide = requireSlide(document, operation.slide)
      const index = slide.elements.findIndex(element => element.id === operation.element)
      if (index < 0) throw new Error(`元素不存在：${operation.slide}#${operation.element}`)
      if ('id' in operation.patch || 'type' in operation.patch) throw new Error('set-element 不允许修改元素 id 或 type。')
      const current = slide.elements[index]
      const patch = operation.patch as Partial<SlideElement>
      slide.elements[index] = {
        ...current,
        ...patch,
        frame: patch.frame ? { ...current.frame, ...patch.frame } : current.frame,
      } as SlideElement
      changed.add(operation.slide)
    } else if (operation.op === 'add-element') {
      const slide = requireSlide(document, operation.slide)
      if (slide.elements.some(element => element.id === operation.element.id)) throw new Error(`元素 ID 已存在：${operation.element.id}`)
      slide.elements.push(structuredClone(operation.element))
      changed.add(operation.slide)
    } else if (operation.op === 'remove-element') {
      const slide = requireSlide(document, operation.slide)
      const index = slide.elements.findIndex(element => element.id === operation.element)
      if (index < 0) throw new Error(`元素不存在：${operation.slide}#${operation.element}`)
      slide.elements.splice(index, 1)
      changed.add(operation.slide)
    } else if (operation.op === 'add-slide') {
      const id = operation.id ?? `slide-${globalThis.crypto.randomUUID().slice(0, 8)}`
      if (Object.values(document.slides).some(slide => slide.id === id)) throw new Error(`页面 ID 已存在：${id}`)
      const path = uniqueSlidePath(document, id)
      const preset = layoutPresets.find(item => item.id === operation.layout)
      if (!preset) throw new Error(`未知布局：${operation.layout}`)
      const afterIndex = operation.after ? document.deck.slides.indexOf(operation.after) : document.deck.slides.length - 1
      if (operation.after && afterIndex < 0) throw new Error(`页面不存在：${operation.after}`)
      document.deck.slides.splice(afterIndex + 1, 0, path)
      document.slides[path] = { id, name: operation.name ?? preset.name, layoutRef: operation.layout, elements: createLayoutElements(operation.layout, document.theme) }
      changed.add('deck.json'); changed.add(path)
    } else if (operation.op === 'rename-slide') {
      requireSlide(document, operation.slide).name = operation.name.trim()
      changed.add(operation.slide)
    } else if (operation.op === 'remove-slide') {
      if (document.deck.slides.length === 1) throw new Error('不能删除最后一页。')
      requireSlide(document, operation.slide)
      document.deck.slides = document.deck.slides.filter(path => path !== operation.slide)
      delete document.slides[operation.slide]
      changed.add('deck.json'); changed.add(operation.slide)
    } else {
      document.theme.colors = { ...document.theme.colors, ...operation.patch }
      changed.add(document.deck.theme)
    }
  }

  return { document: assertDocument(document), changedPaths: [...changed] }
}
