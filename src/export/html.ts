import type { DeckDocument, SlideElement } from '../core/schema'
import { saveBlob } from './download'

const esc = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function elementHtml(element: SlideElement): string {
  const f = element.frame
  const base = `position:absolute;left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;opacity:${element.opacity ?? 1};transform:rotate(${element.rotation ?? 0}deg);box-sizing:border-box;`
  if (element.type === 'text') return `<div style="${base}font-size:${element.fontSize ?? 28}px;font-weight:${element.fontWeight ?? 400};color:${element.color ?? 'var(--text)'};text-align:${element.align ?? 'left'};white-space:pre-wrap;overflow:hidden">${esc(element.text)}</div>`
  if (element.type === 'image') return `<img alt="${esc(element.alt ?? '')}" src="${esc(element.src)}" style="${base}object-fit:${element.fit === 'stretch' ? 'fill' : element.fit}"/>`
  if (element.type === 'shape') return `<div style="${base}background:${element.fill};border:${element.strokeWidth ?? 0}px solid ${element.stroke ?? 'transparent'};border-radius:${element.shape === 'ellipse' ? '50%' : element.radius ?? 0}px"></div>`
  return `<div style="${base}height:0;border-top:${element.strokeWidth}px ${element.dash ? 'dashed' : 'solid'} ${element.color};top:${f.y + f.h / 2}px"></div>`
}

export function exportHtml(document: DeckDocument): void {
  const { deck, theme } = document
  const slides = deck.slides.map(path => `<section class="slide">${document.slides[path].elements.map(elementHtml).join('')}</section>`).join('\n')
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(deck.title)}</title><style>:root{--text:${theme.colors.text}}*{box-sizing:border-box}body{margin:0;background:#111;display:grid;gap:24px;place-items:center;padding:24px;font-family:${JSON.stringify(theme.fonts.body)}}.slide{position:relative;width:${deck.canvas.width}px;height:${deck.canvas.height}px;background:${theme.colors.background};overflow:hidden;transform-origin:top center}@media print{body{display:block;padding:0;background:white}.slide{break-after:page;margin:0}}@page{size:${deck.canvas.width}px ${deck.canvas.height}px;margin:0}</style></head><body>${slides}<script>addEventListener('keydown',e=>{const s=[...document.querySelectorAll('.slide')];let i=s.findIndex(x=>x.getBoundingClientRect().top>=0);if(e.key==='ArrowRight'||e.key==='ArrowDown')s[Math.min(s.length-1,i+1)].scrollIntoView({behavior:'smooth'});if(e.key==='ArrowLeft'||e.key==='ArrowUp')s[Math.max(0,i-1)].scrollIntoView({behavior:'smooth'})})</script></body></html>`
  saveBlob(new Blob([html], { type: 'text/html' }), `${deck.id}.html`)
}
