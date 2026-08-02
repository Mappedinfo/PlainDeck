import type { DeckDocument, SlideElement } from '../core/schema.js'

export interface HtmlRenderOptions {
  slidePaths?: string[]
  resolveAsset?: (src: string) => string
}

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const escapeAttribute = (value: string) => escapeHtml(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;')
const safeFont = (value: string) => value.replace(/[<>{};]/g, '')

function flexAlignment(align?: 'left' | 'center' | 'right') {
  return align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
}

function verticalAlignment(align?: 'top' | 'middle' | 'bottom') {
  return align === 'bottom' ? 'flex-end' : align === 'middle' ? 'center' : 'flex-start'
}

function elementHtml(element: SlideElement, theme: DeckDocument['theme'], resolveAsset: (src: string) => string): string {
  const frame = element.frame
  const base = `position:absolute;left:${frame.x}px;top:${frame.y}px;width:${frame.w}px;height:${frame.h}px;opacity:${element.opacity ?? 1};transform:rotate(${element.rotation ?? 0}deg);z-index:${element.zIndex ?? 'auto'};box-sizing:border-box;`
  if (element.type === 'text') {
    const titleStyle = element.styleRef === 'slide-title'
    return `<div style="${base}display:flex;font-family:${escapeAttribute(safeFont(titleStyle ? theme.fonts.title : theme.fonts.body))};font-size:${element.fontSize ?? (titleStyle ? theme.fontSizes.title : theme.fontSizes.body)}px;font-weight:${element.fontWeight ?? (titleStyle ? 700 : 400)};color:${escapeAttribute(element.color ?? theme.colors.text)};text-align:${element.align ?? 'left'};justify-content:${flexAlignment(element.align)};align-items:${verticalAlignment(element.verticalAlign)};white-space:pre-wrap;line-height:1.12;overflow:hidden">${escapeHtml(element.text)}</div>`
  }
  if (element.type === 'image') {
    if (element.src === 'placeholder:image') return `<div class="image-placeholder" style="${base}"><strong>IMAGE</strong><span>图片占位</span></div>`
    const src = resolveAsset(element.src)
    return `<img alt="${escapeAttribute(element.alt ?? '')}" src="${escapeAttribute(src)}" style="${base}object-fit:${element.fit === 'stretch' ? 'fill' : element.fit}"/>`
  }
  if (element.type === 'shape') {
    const radius = element.shape === 'ellipse' ? '50%' : `${element.radius ?? 0}px`
    const label = element.text ? `<span style="display:flex;width:100%;height:100%;padding:24px;align-items:${verticalAlignment(element.verticalAlign ?? 'middle')};justify-content:${flexAlignment(element.align)};font-size:${element.fontSize ?? theme.fontSizes.body}px;font-weight:${element.fontWeight ?? 400};color:${escapeAttribute(element.textColor ?? theme.colors.text)};text-align:${element.align ?? 'left'};white-space:pre-wrap;line-height:1.16;overflow:hidden">${escapeHtml(element.text)}</span>` : ''
    return `<div style="${base}background:${escapeAttribute(element.fill)};border:${element.strokeWidth ?? 0}px solid ${escapeAttribute(element.stroke ?? 'transparent')};border-radius:${radius};overflow:hidden">${label}</div>`
  }
  const arrow = element.arrowEnd ? `<span style="position:absolute;right:-1px;top:${-element.strokeWidth * 2 - 3}px;width:0;height:0;border-left:${element.strokeWidth * 4}px solid ${escapeAttribute(element.color)};border-top:${element.strokeWidth * 2 + 3}px solid transparent;border-bottom:${element.strokeWidth * 2 + 3}px solid transparent"></span>` : ''
  return `<div style="position:absolute;left:${frame.x}px;top:${frame.y + frame.h / 2}px;width:${frame.w}px;height:0;opacity:${element.opacity ?? 1};transform:rotate(${element.rotation ?? 0}deg);z-index:${element.zIndex ?? 'auto'};border-top:${element.strokeWidth}px ${element.dash ? 'dashed' : 'solid'} ${escapeAttribute(element.color)}">${arrow}</div>`
}

function slideBackground(document: DeckDocument, path: string) {
  const background = document.slides[path].background
  if (background?.color) return background.color
  const token = background?.token?.replace(/^color\./, '') as keyof DeckDocument['theme']['colors'] | undefined
  return token && token in document.theme.colors ? document.theme.colors[token] : document.theme.colors.background
}

export function renderHtml(document: DeckDocument, options: HtmlRenderOptions = {}): string {
  const { deck, theme } = document
  const paths = options.slidePaths ?? deck.slides
  const resolveAsset = options.resolveAsset ?? (src => src)
  for (const path of paths) if (!document.slides[path]) throw new Error(`页面不存在：${path}`)
  const slides = paths.map(path => {
    const slide = document.slides[path]
    const background = slideBackground(document, path)
    return `<section class="slide" data-slide-path="${escapeAttribute(path)}" aria-label="${escapeAttribute(slide.name ?? slide.id)}" style="background:${escapeAttribute(background)}">${slide.elements.map(element => elementHtml(element, theme, resolveAsset)).join('')}</section>`
  }).join('\n')
  const font = safeFont(theme.fonts.body)
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(deck.title)}</title><style>*{box-sizing:border-box}html,body{margin:0}body{background:#111;display:grid;gap:24px;place-items:center;padding:24px;font-family:${font}}.slide{position:relative;width:${deck.canvas.width}px;height:${deck.canvas.height}px;overflow:hidden;transform-origin:top center}.image-placeholder{display:grid;place-content:center;justify-items:center;gap:12px;border:3px dashed currentColor;background:repeating-linear-gradient(135deg,#00000005 0 12px,#0000000d 12px 24px);color:${escapeAttribute(theme.colors.text)};opacity:.52}.image-placeholder strong{font:700 24px ui-monospace,monospace;letter-spacing:.16em}.image-placeholder span{font-size:18px}@media print{body{display:block;padding:0;background:white}.slide{break-after:page;margin:0}}@page{size:${deck.canvas.width}px ${deck.canvas.height}px;margin:0}</style></head><body>${slides}<script>addEventListener('keydown',e=>{const s=[...document.querySelectorAll('.slide')];let i=s.findIndex(x=>x.getBoundingClientRect().top>=0);if(e.key==='ArrowRight'||e.key==='ArrowDown')s[Math.min(s.length-1,i+1)]?.scrollIntoView({behavior:'smooth'});if(e.key==='ArrowLeft'||e.key==='ArrowUp')s[Math.max(0,i-1)]?.scrollIntoView({behavior:'smooth'})})</script></body></html>`
}
