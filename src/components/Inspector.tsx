import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, Image, LocateFixed, Minus, Search, Square, Table2, Type } from 'lucide-react'
import { parseTableCells, tableCellsToTsv, themePresets, type DeckFooter, type ElementAnimation, type FooterSlot, type SlideElement, type TableStyle } from 'plaindeck/core'
import { useState } from 'react'
import { centerFrame, framePlacement } from '../core/geometry'
import { useEditor } from '../store'

function Numeric({ label, value, min, step, onChange }: { label: string; value: number; min?: number; step?: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  const [draftSource, setDraftSource] = useState(value)
  if (draftSource !== value) { setDraftSource(value); setDraft(String(value)) }
  const commit = () => {
    const next = Number(draft)
    if (draft.trim() && Number.isFinite(next) && (min === undefined || next >= min)) onChange(next)
    else setDraft(String(value))
  }
  return <label className="field compact"><span>{label}</span><input type="number" min={min} step={step} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setDraft(String(value)); event.currentTarget.blur() } }} /></label>
}

function DraftTextarea({ value, rows, label, placeholder, onCommit }: { value: string; rows: number; label: string; placeholder?: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [draftSource, setDraftSource] = useState(value)
  if (draftSource !== value) { setDraftSource(value); setDraft(value) }
  return <label className="field"><span>{label}</span><textarea rows={rows} value={draft} placeholder={placeholder} onChange={event => setDraft(event.target.value)} onBlur={() => { if (draft !== value) onCommit(draft) }} /></label>
}

function TableGridEditor({ element, onCommit }: { element: Extract<SlideElement, { type: 'table' }>; onCommit: (cells: string[][]) => void }) {
  const value = tableCellsToTsv(element.cells)
  const [draft, setDraft] = useState(value); const [error, setError] = useState('')
  const [draftSource, setDraftSource] = useState(value)
  if (draftSource !== value) { setDraftSource(value); setDraft(value); setError('') }
  const commit = () => {
    if (draft === value) return
    try { const cells = parseTableCells(draft); onCommit(cells); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
  }
  return <><label className="field"><span>单元格（Tab 分列）</span><textarea rows={8} value={draft} spellCheck={false} onChange={event => setDraft(event.target.value)} onBlur={commit} /></label>{error && <p className="table-grid-error">{error}</p>}</>
}

const typeNames: Record<SlideElement['type'], string> = { text: '文本', image: '图片', shape: '形状', line: '线条', table: '表格' }
const placementNames = { inside: '画布内', partial: '部分越界', outside: '画布外' } as const
const entranceOptions: Array<{ value: ElementAnimation['enter']; label: string }> = [
  { value: 'none', label: '无动画' }, { value: 'fade', label: '淡入' }, { value: 'fade-up', label: '向上淡入' },
  { value: 'fade-down', label: '向下淡入' }, { value: 'fade-left', label: '向左淡入' },
  { value: 'fade-right', label: '向右淡入' }, { value: 'scale', label: '缩放淡入' },
]

function elementName(element: SlideElement) {
  const value = element.type === 'text' ? element.text : element.type === 'shape' ? element.text : element.type === 'image' ? element.alt : element.type === 'table' ? element.cells[0]?.join(' / ') : ''
  return value?.trim().replace(/\s+/g, ' ').slice(0, 28) || `${typeNames[element.type]} · ${element.id}`
}

function ElementIcon({ type }: { type: SlideElement['type'] }) {
  if (type === 'text') return <Type />
  if (type === 'image') return <Image />
  if (type === 'shape') return <Square />
  if (type === 'table') return <Table2 />
  return <Minus />
}

const footerOptions: Array<{ type: FooterSlot['type']; label: string }> = [
  { type: 'none', label: '不显示' },
  { type: 'text', label: '自定义文字' },
  { type: 'date', label: '自动日期' },
  { type: 'page', label: '当前页码' },
  { type: 'page-count', label: '总页数' },
  { type: 'page-of-count', label: '页码 / 总页数' },
  { type: 'deck-title', label: '文档标题' },
  { type: 'slide-name', label: '页面名称' },
]

const defaultFooter: DeckFooter = {
  left: { type: 'slide-name' },
  center: { type: 'date' },
  right: { type: 'page-of-count' },
}

function slotForType(type: FooterSlot['type'], current: FooterSlot): FooterSlot {
  return type === 'text' ? { type, text: current.type === 'text' ? current.text : '' } : { type } as FooterSlot
}

function FooterEditor() {
  const state = useEditor(); const footer = state.document.deck.footer
  const updateSlot = (position: 'left' | 'center' | 'right', slot: FooterSlot) => footer && state.updateFooter({ ...footer, [position]: slot })
  return <section className="footer-editor"><div className="section-heading"><h3>页脚</h3><label className="footer-toggle"><input type="checkbox" checked={Boolean(footer)} onChange={event => state.updateFooter(event.target.checked ? defaultFooter : null)} /><span>{footer ? '已启用' : '关闭'}</span></label></div>
    {footer ? <><div className="footer-slot-list">{(['left', 'center', 'right'] as const).map(position => { const slot = footer[position]; const label = position === 'left' ? '左' : position === 'center' ? '中' : '右'; return <div className="footer-slot" key={position}><span>{label}</span><select aria-label={`${label}侧页脚`} value={slot.type} onChange={event => updateSlot(position, slotForType(event.target.value as FooterSlot['type'], slot))}>{footerOptions.map(option => <option value={option.type} key={option.type}>{option.label}</option>)}</select>{slot.type === 'text' && <input key={slot.text} aria-label={`${label}侧页脚文字`} defaultValue={slot.text} placeholder="输入页脚文字" onBlur={event => { if (event.target.value !== slot.text) updateSlot(position, { type: 'text', text: event.target.value }) }} />}</div> })}</div><div className="footer-style"><Numeric label="字号" min={1} value={footer.fontSize ?? state.document.theme.fontSizes.caption} onChange={fontSize => state.updateFooter({ ...footer, fontSize })} /><label className="footer-color"><input aria-label="页脚颜色" type="color" value={footer.color ?? state.document.theme.colors.muted} onChange={event => state.updateFooter({ ...footer, color: event.target.value })} /><span>颜色</span></label></div><p className="element-index-hint">自动日期在显示或导出时生成；页码会随页面排序自动更新。</p></> : <p className="element-index-hint">启用后可为左、中、右分别设置文字、日期、页码或页面信息。</p>}
  </section>
}

export function Inspector() {
  const state = useEditor(); const slide = state.document.slides[state.activeSlidePath]
  const [elementQuery, setElementQuery] = useState('')
  const [querySource, setQuerySource] = useState(state.activeSlidePath)
  if (querySource !== state.activeSlidePath) { setQuerySource(state.activeSlidePath); setElementQuery('') }
  const selected = slide.elements.filter(element => state.selectedIds.includes(element.id)); const element = selected.length === 1 ? selected[0] : null
  const visibleElements = slide.elements.filter(item => `${item.id} ${typeNames[item.type]} ${elementName(item)}`.toLowerCase().includes(elementQuery.trim().toLowerCase()))
  const patch = (value: Partial<SlideElement>, label?: string) => element && state.updateElement(element.id, value, label)
  return <aside className="inspector">
    <div className="panel-heading"><span>INSPECTOR</span><strong>{selected.length ? `${selected.length} SELECTED` : 'PAGE'}</strong></div>
    <section className="element-index"><div className="section-heading"><h3>本页元素</h3><span>{slide.elements.length}</span></div><label className="element-search"><Search /><input aria-label="筛选本页元素" value={elementQuery} onChange={event => setElementQuery(event.target.value)} placeholder="名称或 ID" /></label><div className="element-list">
      {visibleElements.map(item => { const placement = framePlacement(item.frame, state.document.deck.canvas); const name = elementName(item); return <div className={`element-row ${state.selectedIds.includes(item.id) ? 'active' : ''}`} key={item.id}><button className="element-select" onClick={() => state.select([item.id])} title={`选择 ${name}`}><ElementIcon type={item.type} /><span><strong>{name}</strong><small className={placement}>{typeNames[item.type]} · {placementNames[placement]}</small></span></button><button className="element-center" aria-label={`将 ${name} 移回画布中心`} title="移回画布中心" onClick={() => { state.select([item.id]); state.updateElement(item.id, { frame: centerFrame(item.frame, state.document.deck.canvas) } as Partial<SlideElement>, '元素移回画布中心') }}><LocateFixed /></button></div> })}
      {!visibleElements.length && <p className="element-empty">没有匹配的元素</p>}
    </div><p className="element-index-hint">元素可暂放在画布外。点击条目编辑属性，使用定位按钮移回中心。</p></section>
    <FooterEditor />
    {!element && selected.length === 0 && <>
      <section><h3>DOCUMENT</h3><label className="field"><span>标题</span><input value={state.document.deck.title} readOnly /></label><div className="metric-grid"><div><span>WIDTH</span><strong>{state.document.deck.canvas.width}</strong></div><div><span>HEIGHT</span><strong>{state.document.deck.canvas.height}</strong></div></div></section>
      <section><div className="section-heading"><h3>页面镜头</h3><label className="footer-toggle"><input type="checkbox" checked={Boolean(slide.motion?.camera)} onChange={event => state.updateSlideMotion(event.target.checked ? { camera: { fromScale: 1, toScale: 1.045, durationFrames: 180 } } : null)} /><span>{slide.motion?.camera ? '已启用' : '静态'}</span></label></div>{slide.motion?.camera && <div className="four-grid"><Numeric label="起始缩放" min={.1} step={.01} value={slide.motion.camera.fromScale} onChange={fromScale => state.updateSlideMotion({ camera: { ...slide.motion!.camera!, fromScale } })} /><Numeric label="结束缩放" min={.1} step={.01} value={slide.motion.camera.toScale} onChange={toScale => state.updateSlideMotion({ camera: { ...slide.motion!.camera!, toScale } })} /><Numeric label="延迟帧" min={0} value={slide.motion.camera.delayFrames ?? 0} onChange={delayFrames => state.updateSlideMotion({ camera: { ...slide.motion!.camera!, delayFrames } })} /><Numeric label="持续帧" min={1} value={slide.motion.camera.durationFrames ?? 180} onChange={durationFrames => state.updateSlideMotion({ camera: { ...slide.motion!.camera!, durationFrames } })} /></div>}<p className="element-index-hint">镜头参数写入当前页面 JSON；普通 Web/PDF 保持静态，Remotion 按帧播放。</p></section>
      <section><h3>COLOR STYLES</h3><div className="theme-presets">{themePresets.map(preset => { const active = Object.entries(preset.colors).every(([key, value]) => state.document.theme.colors[key as keyof typeof preset.colors] === value); return <button key={preset.id} className={active ? 'active' : ''} onClick={() => state.applyTheme(preset.theme)} title={preset.description}><span className="theme-swatches">{Object.values(preset.colors).map(color => <i key={color} style={{ background: color }} />)}</span><strong>{preset.name}</strong><small>{preset.description}</small></button> })}</div><a className="palette-lab-link" href="https://mappedinfo.github.io/palette-lab/" target="_blank" rel="noreferrer" title="15 色 · 8 组搭配 · 对比度档案">主题配色来自 色卡实验室 Palette Lab ↗</a></section>
      <section><h3>CUSTOM COLORS</h3>{(['background', 'text', 'muted', 'accent'] as const).map(key => <label className="color-field" key={key}><input type="color" value={state.document.theme.colors[key]} onChange={e => state.updateTheme({ [key]: e.target.value })} /><span>{key}</span><code>{state.document.theme.colors[key]}</code></label>)}</section>
      <section className="hint-card"><span>QUICK START</span><p>选择元素编辑属性，拖动右下角控制点改变尺寸。按住 Shift 可多选。</p></section>
    </>}
      {selected.length > 1 && <section><h3>ALIGNMENT</h3><div className="icon-grid">{([['left', ArrowLeftToLine], ['center', AlignCenter], ['right', ArrowRightToLine], ['top', ArrowUpToLine], ['middle', AlignCenter], ['bottom', ArrowDownToLine]] as const).map(([mode, Icon]) => <button key={mode} onClick={() => state.alignSelected(mode)} title={mode}><Icon /></button>)}</div><p className="muted-copy">选择了 {selected.length} 个元素</p></section>}
    {element && <>
      <section><h3>POSITION</h3><div className="four-grid"><Numeric label="X" value={element.frame.x} onChange={x => patch({ frame: { ...element.frame, x } } as Partial<SlideElement>)} /><Numeric label="Y" value={element.frame.y} onChange={y => patch({ frame: { ...element.frame, y } } as Partial<SlideElement>)} /><Numeric label="W" min={1} value={element.frame.w} onChange={w => patch({ frame: { ...element.frame, w } } as Partial<SlideElement>)} /><Numeric label="H" min={1} value={element.frame.h} onChange={h => patch({ frame: { ...element.frame, h } } as Partial<SlideElement>)} /></div></section>
      <section><h3>进入动画</h3><label className="field"><span>方式</span><select aria-label="元素进入动画" value={element.animation?.enter ?? 'none'} onChange={event => { const enter = event.target.value as ElementAnimation['enter']; patch({ animation: enter === 'none' ? undefined : { enter, delayFrames: element.animation?.delayFrames ?? 0, durationFrames: element.animation?.durationFrames ?? 18 } } as Partial<SlideElement>, '修改元素动画') }}>{entranceOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>{element.animation && element.animation.enter !== 'none' && <div className="metric-grid"><Numeric label="延迟帧" min={0} value={element.animation.delayFrames ?? 0} onChange={delayFrames => patch({ animation: { ...element.animation!, delayFrames } } as Partial<SlideElement>, '修改动画延迟')} /><Numeric label="持续帧" min={1} value={element.animation.durationFrames ?? 18} onChange={durationFrames => patch({ animation: { ...element.animation!, durationFrames } } as Partial<SlideElement>, '修改动画时长')} /></div>}<p className="element-index-hint">动画是可选 JSON 元数据，不影响静态 HTML、PNG 或 PDF。</p></section>
      {element.type === 'text' && <section><h3>TYPOGRAPHY</h3><Numeric label="SIZE" min={1} value={element.fontSize ?? state.document.theme.fontSizes.body} onChange={fontSize => patch({ fontSize } as Partial<SlideElement>)} /><DraftTextarea label="内容" rows={5} value={element.text} onCommit={text => patch({ text } as Partial<SlideElement>, '编辑文字')} /><div className="icon-grid three"><button onClick={() => patch({ align: 'left' } as Partial<SlideElement>)}><AlignLeft /></button><button onClick={() => patch({ align: 'center' } as Partial<SlideElement>)}><AlignCenter /></button><button onClick={() => patch({ align: 'right' } as Partial<SlideElement>)}><AlignRight /></button></div></section>}
      {element.type === 'shape' && <><section><h3>SHAPE TEXT</h3><DraftTextarea label="内容" rows={4} value={element.text ?? ''} placeholder="输入形状内文字" onCommit={text => patch({ text } as Partial<SlideElement>, '编辑形状文字')} /><Numeric label="SIZE" min={1} value={element.fontSize ?? state.document.theme.fontSizes.body} onChange={fontSize => patch({ fontSize } as Partial<SlideElement>)} /><label className="color-field"><input type="color" value={element.textColor ?? state.document.theme.colors.text} onChange={e => patch({ textColor: e.target.value } as Partial<SlideElement>)} /><span>text</span><code>{element.textColor ?? state.document.theme.colors.text}</code></label><div className="icon-grid three"><button onClick={() => patch({ align: 'left' } as Partial<SlideElement>)} title="左对齐"><AlignLeft /></button><button onClick={() => patch({ align: 'center' } as Partial<SlideElement>)} title="居中"><AlignCenter /></button><button onClick={() => patch({ align: 'right' } as Partial<SlideElement>)} title="右对齐"><AlignRight /></button></div></section><section><h3>APPEARANCE</h3><label className="color-field"><input type="color" value={element.fill} onChange={e => patch({ fill: e.target.value } as Partial<SlideElement>)} /><span>fill</span><code>{element.fill}</code></label><Numeric label="RADIUS" min={0} value={element.radius ?? 0} onChange={radius => patch({ radius } as Partial<SlideElement>)} /></section></>}
      {element.type === 'image' && <section><h3>IMAGE</h3><label className="field"><span>路径 / URL</span><input value={element.src} onChange={e => patch({ src: e.target.value } as Partial<SlideElement>)} /></label><label className="field"><span>适配</span><select value={element.fit} onChange={e => patch({ fit: e.target.value as 'contain' | 'cover' | 'stretch' } as Partial<SlideElement>)}><option>contain</option><option>cover</option><option>stretch</option></select></label></section>}
      {element.type === 'table' && <><section><h3>TABLE DATA</h3><TableGridEditor element={element} onCommit={cells => patch({ cells } as Partial<SlideElement>, '批量编辑表格')} /><p className="element-index-hint">第一行为表头。也可在画布上双击表格，再直接编辑单元格。</p></section><section><h3>TABLE STYLE</h3><label className="field"><span>样式</span><select value={element.style} onChange={event => patch({ style: event.target.value as TableStyle } as Partial<SlideElement>, '修改表格样式')}><option value="rules">Nature rules</option><option value="grid">Compact grid</option><option value="stripes">Quiet stripes</option></select></label><Numeric label="字号" min={1} value={element.fontSize ?? state.document.theme.fontSizes.body} onChange={fontSize => patch({ fontSize } as Partial<SlideElement>)} /><Numeric label="内边距" min={0} value={element.cellPadding ?? 18} onChange={cellPadding => patch({ cellPadding } as Partial<SlideElement>)} /><Numeric label="表头行" min={0} value={element.headerRows} onChange={headerRows => patch({ headerRows: Math.min(headerRows, element.cells.length) } as Partial<SlideElement>)} /><label className="color-field"><input type="color" value={element.accentColor ?? state.document.theme.colors.accent} onChange={event => patch({ accentColor: event.target.value } as Partial<SlideElement>)} /><span>accent</span><code>{element.accentColor ?? state.document.theme.colors.accent}</code></label></section></>}
      {element.type === 'line' && <section><h3>LINE</h3><Numeric label="WIDTH" min={1} value={element.strokeWidth} onChange={strokeWidth => patch({ strokeWidth } as Partial<SlideElement>)} /><label className="check-field"><input type="checkbox" checked={element.dash ?? false} onChange={e => patch({ dash: e.target.checked } as Partial<SlideElement>)} />虚线</label></section>}
    </>}
  </aside>
}
