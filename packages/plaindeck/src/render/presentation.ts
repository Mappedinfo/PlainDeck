import { resolveFooterSlot } from '../core/footer.js'
import type { DeckDocument, SlideElement } from '../core/schema.js'

export type PresentationStyle = Record<string, string | number | undefined>

export function horizontalAlignment(align?: 'left' | 'center' | 'right') {
  return align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
}

export function verticalAlignment(align?: 'top' | 'middle' | 'bottom') {
  return align === 'bottom' ? 'flex-end' : align === 'middle' ? 'center' : 'flex-start'
}

export function resolveSlideBackground(document: DeckDocument, path: string) {
  const background = document.slides[path]?.background
  if (background?.color) return background.color
  const token = background?.token?.replace(/^color\./, '') as keyof DeckDocument['theme']['colors'] | undefined
  return token && token in document.theme.colors ? document.theme.colors[token] : document.theme.colors.background
}

export function elementFrameStyle(element: SlideElement): PresentationStyle {
  return {
    position: 'absolute',
    left: element.frame.x,
    top: element.frame.y,
    width: element.frame.w,
    height: element.frame.h,
    opacity: element.opacity ?? 1,
    transform: `rotate(${element.rotation ?? 0}deg)`,
    transformOrigin: 'center',
    zIndex: element.zIndex ?? 'auto',
    boxSizing: 'border-box',
  }
}

export function textContentStyle(element: Extract<SlideElement, { type: 'text' }>, theme: DeckDocument['theme']): PresentationStyle {
  const title = element.styleRef === 'slide-title'
  return {
    width: '100%', height: '100%', display: 'flex',
    fontFamily: element.fontFamily ?? (title ? theme.fonts.title : theme.fonts.body),
    fontSize: element.fontSize ?? (title ? theme.fontSizes.title : theme.fontSizes.body),
    fontWeight: element.fontWeight ?? (title ? 700 : 400),
    color: element.color ?? theme.colors.text,
    textAlign: element.align ?? 'left',
    justifyContent: horizontalAlignment(element.align),
    alignItems: verticalAlignment(element.verticalAlign),
    whiteSpace: 'pre-wrap', lineHeight: 1.12, overflow: 'hidden', boxSizing: 'border-box',
  }
}

export function imageContentStyle(element: Extract<SlideElement, { type: 'image' }>): PresentationStyle {
  return { width: '100%', height: '100%', display: 'block', objectFit: element.fit === 'stretch' ? 'fill' : element.fit }
}

export function shapeContentStyle(element: Extract<SlideElement, { type: 'shape' }>): PresentationStyle {
  return {
    width: '100%', height: '100%', display: 'block', boxSizing: 'border-box', overflow: 'hidden',
    background: element.fill,
    borderColor: element.stroke ?? 'transparent',
    borderWidth: element.strokeWidth ?? 0,
    borderStyle: 'solid',
    borderRadius: element.shape === 'ellipse' ? '50%' : element.radius ?? 0,
  }
}

export function shapeLabelStyle(element: Extract<SlideElement, { type: 'shape' }>, theme: DeckDocument['theme']): PresentationStyle {
  return {
    display: 'flex', width: '100%', height: '100%', padding: 24, boxSizing: 'border-box',
    alignItems: verticalAlignment(element.verticalAlign ?? 'middle'),
    justifyContent: horizontalAlignment(element.align),
    fontFamily: element.fontFamily ?? theme.fonts.body,
    fontSize: element.fontSize ?? theme.fontSizes.body,
    fontWeight: element.fontWeight ?? 400,
    color: element.textColor ?? theme.colors.text,
    textAlign: element.align ?? 'left', whiteSpace: 'pre-wrap', lineHeight: 1.16, overflow: 'hidden',
  }
}

export function lineContentStyle(element: Extract<SlideElement, { type: 'line' }>): PresentationStyle {
  return {
    position: 'absolute', left: 0, right: 0, top: '50%', height: 0,
    color: element.color,
    borderTopWidth: element.strokeWidth,
    borderTopStyle: element.dash ? 'dashed' : 'solid',
    borderTopColor: element.color,
  }
}

export function slideStyle(document: DeckDocument, path: string): PresentationStyle {
  return {
    position: 'relative', width: document.deck.canvas.width, height: document.deck.canvas.height,
    overflow: 'hidden', flex: 'none', boxSizing: 'border-box',
    background: resolveSlideBackground(document, path),
    color: document.theme.colors.text,
    fontFamily: document.theme.fonts.body,
  }
}

export function footerPresentation(document: DeckDocument, path: string, date?: Date | string) {
  const footer = document.deck.footer
  if (!footer) return null
  const slide = document.slides[path]
  if (!slide) throw new Error(`页面不存在：${path}`)
  const context = {
    pageNumber: document.deck.slides.indexOf(path) + 1,
    pageCount: document.deck.slides.length,
    deckTitle: document.deck.title,
    slideName: slide.name ?? slide.id,
    date,
  }
  const values = [footer.left, footer.center, footer.right].map(slot => resolveFooterSlot(slot, context)) as [string, string, string]
  if (values.every(value => !value)) return null
  const style: PresentationStyle = {
    position: 'absolute', left: document.theme.spacing.page, right: document.theme.spacing.page, bottom: 24,
    zIndex: 2147483647, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24,
    fontFamily: document.theme.fonts.body, fontSize: footer.fontSize ?? document.theme.fontSizes.caption,
    lineHeight: 1, color: footer.color ?? document.theme.colors.muted, pointerEvents: 'none',
  }
  return { values, style }
}
