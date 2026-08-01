import { z } from 'zod'

export const FrameSchema = z.object({
  x: z.number().int(), y: z.number().int(), w: z.number().int().positive(), h: z.number().int().positive(),
})

const ElementBase = z.object({
  id: z.string().min(1),
  frame: FrameSchema,
  opacity: z.number().min(0).max(1).optional(),
  rotation: z.number().optional(),
  zIndex: z.number().int().optional(),
})

export const TextElementSchema = ElementBase.extend({
  type: z.literal('text'),
  text: z.string(),
  styleRef: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).optional(),
  fit: z.enum(['none', 'shrink', 'clip']).optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
  fontWeight: z.number().int().min(100).max(900).optional(),
})

export const ImageElementSchema = ElementBase.extend({
  type: z.literal('image'),
  src: z.string().min(1),
  fit: z.enum(['contain', 'cover', 'stretch']).default('contain'),
  alt: z.string().optional(),
})

export const ShapeElementSchema = ElementBase.extend({
  type: z.literal('shape'),
  shape: z.enum(['rectangle', 'rounded-rectangle', 'ellipse']).default('rectangle'),
  fill: z.string().default('#E85538'),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  radius: z.number().nonnegative().optional(),
})

export const LineElementSchema = ElementBase.extend({
  type: z.literal('line'),
  color: z.string().default('#1F211D'),
  strokeWidth: z.number().positive().default(4),
  dash: z.boolean().optional(),
  arrowEnd: z.boolean().optional(),
})

export const ElementSchema = z.discriminatedUnion('type', [
  TextElementSchema, ImageElementSchema, ShapeElementSchema, LineElementSchema,
])

export const SlideSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  layoutRef: z.string().optional(),
  background: z.object({ token: z.string().optional(), color: z.string().optional() }).optional(),
  elements: z.array(ElementSchema),
})

export const ThemeSchema = z.object({
  fonts: z.object({ title: z.string(), body: z.string(), mono: z.string().optional() }),
  fontSizes: z.object({ title: z.number(), heading: z.number(), body: z.number(), caption: z.number() }),
  colors: z.object({ background: z.string(), text: z.string(), muted: z.string(), accent: z.string() }),
  spacing: z.object({ page: z.number(), small: z.number(), medium: z.number(), large: z.number() }),
})

export const DeckSchema = z.object({
  schemaVersion: z.literal('0.1'),
  id: z.string().min(1),
  title: z.string().min(1),
  canvas: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  theme: z.string().default('./theme.json'),
  slides: z.array(z.string()).min(1),
})

export type Frame = z.infer<typeof FrameSchema>
export type SlideElement = z.infer<typeof ElementSchema>
export type Slide = z.infer<typeof SlideSchema>
export type Theme = z.infer<typeof ThemeSchema>
export type Deck = z.infer<typeof DeckSchema>

export interface DeckDocument { deck: Deck; slides: Record<string, Slide>; theme: Theme }

export function assertDocument(input: unknown): DeckDocument {
  const raw = input as DeckDocument
  const deck = DeckSchema.parse(raw.deck)
  const theme = ThemeSchema.parse(raw.theme)
  const slides = Object.fromEntries(Object.entries(raw.slides).map(([path, slide]) => [path, SlideSchema.parse(slide)]))
  for (const path of deck.slides) if (!slides[path]) throw new Error(`页面文件缺失：${path}`)
  return { deck, slides, theme }
}
