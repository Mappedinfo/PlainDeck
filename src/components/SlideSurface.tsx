import { Image as ImageIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Frame, Slide, SlideElement } from 'plaindeck/core'
import { resizeFrame, snap } from '../core/geometry'
import { useEditor } from '../store'
import { resolveAssetUrl } from '../storage/browserStorage'

interface SurfaceProps { slide: Slide; interactive?: boolean; zoom: number }

function ElementView({ element, interactive, zoom }: { element: SlideElement; interactive: boolean; zoom: number }) {
  const { document, directory, selectedIds, select, updateElement } = useEditor()
  const selected = selectedIds.includes(element.id)
  const [draft, setDraft] = useState<Frame | null>(null)
  const [editing, setEditing] = useState(false)
  const [imageSrc, setImageSrc] = useState(element.type === 'image' && !element.src.startsWith('./assets/') ? element.src : '')
  const sourcePath = element.type === 'image' ? element.src : ''
  const start = useRef<{ x: number; y: number; frame: Frame; mode: 'move' | 'resize' } | null>(null)
  const frame = draft ?? element.frame

  useEffect(() => setDraft(null), [element.frame.x, element.frame.y, element.frame.w, element.frame.h])
  useEffect(() => {
    if (!sourcePath) return
    if (!sourcePath.startsWith('./assets/') || !directory) { setImageSrc(sourcePath); return }
    let active = true; setImageSrc('')
    resolveAssetUrl(directory, sourcePath).then(url => { if (active) setImageSrc(url) }).catch(() => { if (active) setImageSrc(sourcePath) })
    return () => { active = false }
  }, [directory, sourcePath])

  const begin = (event: React.PointerEvent, mode: 'move' | 'resize') => {
    if (!interactive || editing) return
    event.stopPropagation(); (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    if (!selected) select(event.shiftKey ? [...selectedIds, element.id] : [element.id])
    start.current = { x: event.clientX, y: event.clientY, frame: { ...frame }, mode }
  }
  const move = (event: React.PointerEvent) => {
    if (!start.current) return
    const dx = (event.clientX - start.current.x) / zoom; const dy = (event.clientY - start.current.y) / zoom
    if (start.current.mode === 'move') setDraft({ ...start.current.frame, x: snap(start.current.frame.x + dx), y: snap(start.current.frame.y + dy) })
    else setDraft(resizeFrame(start.current.frame, dx, dy, document.deck.canvas))
  }
  const end = () => {
    if (!start.current || !draft) { start.current = null; return }
    updateElement(element.id, { frame: draft } as Partial<SlideElement>, start.current.mode === 'move' ? '移动元素' : '缩放元素')
    start.current = null; setDraft(null)
  }

  const style: React.CSSProperties = { left: frame.x, top: frame.y, width: frame.w, height: frame.h, opacity: element.opacity ?? 1, transform: `rotate(${element.rotation ?? 0}deg)`, zIndex: element.zIndex }
  const finishTextEditing = (event: React.FocusEvent<HTMLElement>, text: string) => {
    setEditing(false)
    if (event.currentTarget.innerText !== text) updateElement(element.id, { text: event.currentTarget.innerText } as Partial<SlideElement>, element.type === 'shape' ? '编辑形状文字' : '编辑文字')
  }
  const content = element.type === 'text'
    ? <div className={`text-content editable-content ${element.styleRef ?? ''}`} style={{ fontSize: element.fontSize, fontWeight: element.fontWeight, color: element.color, textAlign: element.align, justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start', alignItems: element.verticalAlign === 'middle' ? 'center' : element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start' }} contentEditable={interactive && editing} suppressContentEditableWarning onBlur={e => finishTextEditing(e, element.text)}><span>{element.text}</span></div>
    : element.type === 'image' ? element.src === 'placeholder:image' ? <div className="image-placeholder"><ImageIcon /><strong>IMAGE</strong><span>在右侧属性中设置图片路径</span></div> : imageSrc ? <img src={imageSrc} alt={element.alt ?? ''} draggable={false} style={{ objectFit: element.fit === 'stretch' ? 'fill' : element.fit }} onError={event => event.currentTarget.classList.add('broken-image')} /> : <div className="image-loading"><ImageIcon /><span>载入本地图片…</span></div>
    : element.type === 'shape' ? <div className="shape-content" style={{ background: element.fill, borderColor: element.stroke, borderWidth: element.strokeWidth, borderRadius: element.shape === 'ellipse' ? '50%' : element.radius }}><div className="shape-label editable-content" style={{ fontSize: element.fontSize, fontWeight: element.fontWeight, color: element.textColor, textAlign: element.align, justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start', alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center' }} contentEditable={interactive && editing} suppressContentEditableWarning onBlur={e => finishTextEditing(e, element.text ?? '')}><span>{element.text ?? ''}</span></div></div>
    : <div className={`line-content ${element.dash ? 'dashed' : ''} ${element.arrowEnd ? 'arrow' : ''}`} style={{ borderColor: element.color, borderTopWidth: element.strokeWidth }} />

  return <div className={`slide-element ${selected && interactive ? 'selected' : ''}`} style={style} data-element-id={element.id} onPointerDown={e => begin(e, 'move')} onPointerMove={move} onPointerUp={end} onDoubleClick={e => { if (interactive && (element.type === 'text' || element.type === 'shape')) { e.stopPropagation(); setEditing(true); requestAnimationFrame(() => (e.currentTarget.querySelector('.editable-content') as HTMLElement)?.focus()) } }}>
    {content}
    {selected && interactive && !editing && <button className="resize-handle" aria-label="缩放元素" onPointerDown={e => begin(e, 'resize')} onPointerMove={move} onPointerUp={end} />}
  </div>
}

export function SlideSurface({ slide, interactive = true, zoom }: SurfaceProps) {
  const { document, select } = useEditor()
  const background = slide.background?.color ?? document.theme.colors.background
  const cssVars = { '--deck-font-title': document.theme.fonts.title, '--deck-font-body': document.theme.fonts.body, '--deck-title-size': `${document.theme.fontSizes.title}px`, '--deck-text': document.theme.colors.text } as React.CSSProperties
  return <div className="slide-surface" style={{ width: document.deck.canvas.width, height: document.deck.canvas.height, background, transform: `scale(${zoom})`, ...cssVars }} onPointerDown={() => interactive && select([])}>
    {slide.elements.map(element => <ElementView key={element.id} element={element} interactive={interactive} zoom={zoom} />)}
  </div>
}
