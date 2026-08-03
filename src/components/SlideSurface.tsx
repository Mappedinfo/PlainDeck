import { Image as ImageIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PlainDeckElementContent, PlainDeckFooter } from '@plaindeck/react'
import { type Frame, type Slide, type SlideElement } from 'plaindeck/core'
import { elementFrameStyle, slideStyle } from 'plaindeck/render'
import { framePlacement, moveFrame, resizeFrame } from '../core/geometry'
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
  const canvas = document.deck.canvas
  const placement = framePlacement(frame, canvas)

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
    if (start.current.mode === 'move') setDraft(moveFrame(start.current.frame, dx, dy, canvas))
    else setDraft(resizeFrame(start.current.frame, dx, dy, canvas))
  }
  const end = () => {
    if (!start.current || !draft) { start.current = null; return }
    updateElement(element.id, { frame: draft } as Partial<SlideElement>, start.current.mode === 'move' ? '移动元素' : '缩放元素')
    start.current = null; setDraft(null)
  }

  const style = elementFrameStyle({ ...element, frame } as SlideElement) as React.CSSProperties
  const outsideFragments: React.CSSProperties[] = []
  if (interactive && placement !== 'inside') {
    const leftWidth = Math.min(frame.w, Math.max(0, -frame.x))
    const rightStart = Math.max(0, canvas.width - frame.x)
    const rightWidth = Math.max(0, frame.w - rightStart)
    const middleLeft = Math.max(0, -frame.x)
    const middleRight = Math.min(frame.w, canvas.width - frame.x)
    const middleWidth = Math.max(0, middleRight - middleLeft)
    const topHeight = Math.min(frame.h, Math.max(0, -frame.y))
    const bottomStart = Math.max(0, canvas.height - frame.y)
    const bottomHeight = Math.max(0, frame.h - bottomStart)
    if (leftWidth) outsideFragments.push({ left: 0, top: 0, width: leftWidth, height: frame.h })
    if (rightWidth) outsideFragments.push({ left: rightStart, top: 0, width: rightWidth, height: frame.h })
    if (middleWidth && topHeight) outsideFragments.push({ left: middleLeft, top: 0, width: middleWidth, height: topHeight })
    if (middleWidth && bottomHeight) outsideFragments.push({ left: middleLeft, top: bottomStart, width: middleWidth, height: bottomHeight })
  }
  const currentText = element.type === 'text' || element.type === 'shape' ? element.text ?? '' : ''
  const content = element.type === 'image' && element.src !== 'placeholder:image' && !imageSrc
    ? <div className="image-loading"><ImageIcon /><span>载入本地图片…</span></div>
    : <PlainDeckElementContent element={element} theme={document.theme} editable={interactive && editing} onTextCommit={text => { setEditing(false); if (text !== currentText) updateElement(element.id, { text } as Partial<SlideElement>, element.type === 'shape' ? '编辑形状文字' : '编辑文字') }} onImageError={event => event.currentTarget.classList.add('broken-image')} resolveAsset={() => imageSrc || sourcePath} placeholder={<><ImageIcon /><strong>IMAGE</strong><span>在右侧属性中设置图片路径</span></>} />

  return <div className={`slide-element ${selected && interactive ? 'selected' : ''} ${interactive && placement !== 'inside' ? 'off-canvas' : ''}`} style={style} data-element-id={element.id} data-canvas-placement={placement} onPointerDown={e => begin(e, 'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onDoubleClick={e => { if (interactive && (element.type === 'text' || element.type === 'shape')) { e.stopPropagation(); setEditing(true); requestAnimationFrame(() => (e.currentTarget.querySelector('.editable-content') as HTMLElement)?.focus()) } }}>
    {content}
    {outsideFragments.map((fragment, index) => <i className="off-canvas-fragment" style={fragment} key={index} />)}
    {selected && interactive && !editing && <button className="resize-handle" aria-label="缩放元素" onPointerDown={e => begin(e, 'resize')} onPointerMove={move} onPointerUp={end} />}
  </div>
}

export function SlideSurface({ slide, interactive = true, zoom }: SurfaceProps) {
  const { document, select } = useEditor()
  const slidePath = document.deck.slides.find(path => document.slides[path].id === slide.id)
  if (!slidePath) throw new Error(`页面未登记：${slide.id}`)
  return <div className={`slide-surface ${interactive ? 'editor-surface' : 'output-surface'}`} style={{ ...(slideStyle(document, slidePath) as React.CSSProperties), position: 'absolute', left: 0, top: 0, overflow: interactive ? 'visible' : 'hidden', transform: `scale(${zoom})` }} onPointerDown={() => interactive && select([])}>
    {slide.elements.map(element => <ElementView key={element.id} element={element} interactive={interactive} zoom={zoom} />)}
    <PlainDeckFooter document={document} slidePath={slidePath} />
  </div>
}
