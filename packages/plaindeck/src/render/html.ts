import type { DeckDocument, SlideElement } from '../core/schema.js'
import { resolveFooterSlot } from '../core/footer.js'

export interface HtmlRenderOptions {
  slidePaths?: string[]
  resolveAsset?: (src: string) => string
  mode?: 'presentation' | 'document'
  date?: Date | string
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

function footerHtml(document: DeckDocument, path: string, date?: Date | string) {
  const footer = document.deck.footer
  if (!footer) return ''
  const slide = document.slides[path]
  const context = {
    pageNumber: document.deck.slides.indexOf(path) + 1,
    pageCount: document.deck.slides.length,
    deckTitle: document.deck.title,
    slideName: slide.name ?? slide.id,
    date,
  }
  const values = [footer.left, footer.center, footer.right].map(slot => resolveFooterSlot(slot, context))
  if (values.every(value => !value)) return ''
  const color = footer.color ?? document.theme.colors.muted
  const base = `position:absolute;left:${document.theme.spacing.page}px;right:${document.theme.spacing.page}px;bottom:24px;z-index:2147483647;display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;font-family:${escapeAttribute(safeFont(document.theme.fonts.body))};font-size:${footer.fontSize ?? document.theme.fontSizes.caption}px;line-height:1;color:${escapeAttribute(color)};pointer-events:none`
  const cell = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap'
  return `<footer class="slide-footer" style="${base}"><span style="${cell}">${escapeHtml(values[0])}</span><span style="${cell};text-align:center">${escapeHtml(values[1])}</span><span style="${cell};text-align:right">${escapeHtml(values[2])}</span></footer>`
}

export function renderHtml(document: DeckDocument, options: HtmlRenderOptions = {}): string {
  const { deck, theme } = document
  const paths = options.slidePaths ?? deck.slides
  const resolveAsset = options.resolveAsset ?? (src => src)
  for (const path of paths) if (!document.slides[path]) throw new Error(`页面不存在：${path}`)
  const slides = paths.map(path => {
    const slide = document.slides[path]
    const background = slideBackground(document, path)
    return `<section class="slide" data-slide-path="${escapeAttribute(path)}" aria-label="${escapeAttribute(slide.name ?? slide.id)}" style="background:${escapeAttribute(background)}">${slide.elements.map(element => elementHtml(element, theme, resolveAsset)).join('')}${footerHtml(document, path, options.date)}</section>`
  }).join('\n')
  const font = safeFont(theme.fonts.body)
  const mode = options.mode ?? 'presentation'
  const content = mode === 'presentation'
    ? `<main class="deck-stage" aria-live="polite">${slides}</main><footer class="player-bar"><div class="player-meta"><strong>${escapeHtml(deck.title)}</strong><span id="slide-name"></span></div><div class="player-progress"><i id="progress"></i></div><div class="player-actions"><span id="counter">1 / ${paths.length}</span><button type="button" data-action="prev" aria-label="上一页">←</button><button type="button" data-action="next" aria-label="下一页">→</button><button type="button" data-action="fullscreen" aria-label="全屏播放">⛶</button></div></footer>`
    : slides
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${escapeHtml(deck.title)}</title><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%}body{font-family:${font};background:#0b0e0d}.slide{position:relative;width:${deck.canvas.width}px;height:${deck.canvas.height}px;overflow:hidden;transform-origin:top left;flex:none}.image-placeholder{display:grid;place-content:center;justify-items:center;gap:12px;border:3px dashed currentColor;background:repeating-linear-gradient(135deg,#00000005 0 12px,#0000000d 12px 24px);color:${escapeAttribute(theme.colors.text)};opacity:.52}.image-placeholder strong{font:700 24px ui-monospace,monospace;letter-spacing:.16em}.image-placeholder span{font-size:18px}body[data-mode="document"]{display:grid;gap:24px;place-items:center;padding:24px;background:#111}body[data-mode="presentation"]{height:100vh;overflow:hidden;color:#f4f1e8;background:radial-gradient(circle at 50% -20%,#27322f 0,#111715 42%,#080b0a 100%)}body[data-mode="presentation"]:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.2;background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(to bottom,#000,transparent 72%)}.deck-stage{position:fixed;inset:20px 20px 82px;display:grid;place-items:center}.deck-stage .slide{display:none;box-shadow:0 28px 80px #000a}.deck-stage .slide.is-active{display:block;animation:slide-in .48s cubic-bezier(.2,.8,.2,1)}.player-bar{position:fixed;left:24px;right:24px;bottom:18px;height:48px;display:grid;grid-template-columns:minmax(240px,1fr) minmax(140px,34vw) minmax(240px,1fr);align-items:center;gap:22px;color:#f4f1e8}.player-meta{min-width:0;display:grid;gap:2px}.player-meta strong,.player-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.player-meta strong{font-size:12px;letter-spacing:.02em}.player-meta span{font:10px ui-monospace,monospace;color:#96a29d}.player-progress{height:2px;background:#ffffff25;overflow:hidden}.player-progress i{display:block;width:0;height:100%;background:${escapeAttribute(theme.colors.accent)};transition:width .28s ease}.player-actions{display:flex;justify-content:flex-end;align-items:center;gap:7px}.player-actions span{margin-right:8px;font:11px ui-monospace,monospace;color:#a9b3af}.player-actions button{width:34px;height:34px;border:1px solid #ffffff30;background:#151b19;color:#f4f1e8;border-radius:50%;cursor:pointer}.player-actions button:hover,.player-actions button:focus-visible{border-color:${escapeAttribute(theme.colors.accent)};color:${escapeAttribute(theme.colors.accent)};outline:none}@keyframes slide-in{from{opacity:0;transform:translateY(12px) scale(var(--deck-scale,1))}to{opacity:1;transform:translateY(0) scale(var(--deck-scale,1))}}@media(max-width:720px){.player-bar{grid-template-columns:1fr auto}.player-progress{display:none}.player-meta strong{font-size:10px}.player-actions{gap:4px}}@media(prefers-reduced-motion:reduce){.deck-stage .slide.is-active{animation:none}.player-progress i{transition:none}}@media print{body,body[data-mode]{display:block!important;padding:0!important;background:white!important;overflow:visible!important;height:auto!important}.deck-stage{display:block;position:static}.deck-stage .slide,.slide{display:block!important;break-after:page;margin:0;transform:none!important;box-shadow:none!important;animation:none!important}.player-bar{display:none}}@page{size:${deck.canvas.width}px ${deck.canvas.height}px;margin:0}</style></head><body data-mode="${mode}">${content}<script>(()=>{const body=document.body;if(body.dataset.mode!=="presentation")return;const slides=[...document.querySelectorAll(".slide")];const stage=document.querySelector(".deck-stage");const counter=document.querySelector("#counter");const progress=document.querySelector("#progress");const name=document.querySelector("#slide-name");let index=0;const fit=()=>{const scale=Math.min((innerWidth-40)/${deck.canvas.width},(innerHeight-102)/${deck.canvas.height},1);stage.style.width=String(${deck.canvas.width}*scale)+"px";stage.style.height=String(${deck.canvas.height}*scale)+"px";stage.style.left="50%";stage.style.top="20px";stage.style.right="auto";stage.style.bottom="auto";stage.style.transform="translateX(-50%)";for(const slide of slides){slide.style.setProperty("--deck-scale",String(scale));slide.style.transform="scale("+scale+")"}};const show=value=>{index=Math.max(0,Math.min(slides.length-1,value));slides.forEach((slide,i)=>{slide.classList.toggle("is-active",i===index);slide.setAttribute("aria-hidden",String(i!==index))});counter.textContent=String(index+1)+" / "+String(slides.length);progress.style.width=String((index+1)/slides.length*100)+"%";name.textContent=slides[index]?.getAttribute("aria-label")||"";fit()};addEventListener("resize",fit);addEventListener("keydown",event=>{if(["ArrowRight","ArrowDown","PageDown"," "].includes(event.key)){event.preventDefault();show(index+1)}if(["ArrowLeft","ArrowUp","PageUp"].includes(event.key)){event.preventDefault();show(index-1)}if(event.key==="Home")show(0);if(event.key==="End")show(slides.length-1);if(event.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.()});document.querySelector("[data-action=prev]")?.addEventListener("click",()=>show(index-1));document.querySelector("[data-action=next]")?.addEventListener("click",()=>show(index+1));document.querySelector("[data-action=fullscreen]")?.addEventListener("click",()=>document.documentElement.requestFullscreen?.());show(0)})()</script></body></html>`
}
