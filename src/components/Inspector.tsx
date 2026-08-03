import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine, Image, LocateFixed, Minus, Search, Square, Type } from 'lucide-react'
import { themePresets, type SlideElement } from 'plaindeck/core'
import { useEffect, useState } from 'react'
import { centerFrame, framePlacement } from '../core/geometry'
import { useEditor } from '../store'

function Numeric({ label, value, min, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => {
    const next = Number(draft)
    if (draft.trim() && Number.isFinite(next) && (min === undefined || next >= min)) onChange(next)
    else setDraft(String(value))
  }
  return <label className="field compact"><span>{label}</span><input type="number" min={min} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setDraft(String(value)); event.currentTarget.blur() } }} /></label>
}

function DraftTextarea({ value, rows, label, placeholder, onCommit }: { value: string; rows: number; label: string; placeholder?: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return <label className="field"><span>{label}</span><textarea rows={rows} value={draft} placeholder={placeholder} onChange={event => setDraft(event.target.value)} onBlur={() => { if (draft !== value) onCommit(draft) }} /></label>
}

const typeNames: Record<SlideElement['type'], string> = { text: '文本', image: '图片', shape: '形状', line: '线条' }
const placementNames = { inside: '画布内', partial: '部分越界', outside: '画布外' } as const

function elementName(element: SlideElement) {
  const value = element.type === 'text' ? element.text : element.type === 'shape' ? element.text : element.type === 'image' ? element.alt : ''
  return value?.trim().replace(/\s+/g, ' ').slice(0, 28) || `${typeNames[element.type]} · ${element.id}`
}

function ElementIcon({ type }: { type: SlideElement['type'] }) {
  if (type === 'text') return <Type />
  if (type === 'image') return <Image />
  if (type === 'shape') return <Square />
  return <Minus />
}

export function Inspector() {
  const state = useEditor(); const slide = state.document.slides[state.activeSlidePath]
  const [elementQuery, setElementQuery] = useState('')
  useEffect(() => setElementQuery(''), [state.activeSlidePath])
  const selected = slide.elements.filter(element => state.selectedIds.includes(element.id)); const element = selected.length === 1 ? selected[0] : null
  const visibleElements = slide.elements.filter(item => `${item.id} ${typeNames[item.type]} ${elementName(item)}`.toLowerCase().includes(elementQuery.trim().toLowerCase()))
  const patch = (value: Partial<SlideElement>, label?: string) => element && state.updateElement(element.id, value, label)
  return <aside className="inspector">
    <div className="panel-heading"><span>INSPECTOR</span><strong>{selected.length ? `${selected.length} SELECTED` : 'PAGE'}</strong></div>
    <section className="element-index"><div className="section-heading"><h3>本页元素</h3><span>{slide.elements.length}</span></div><label className="element-search"><Search /><input aria-label="筛选本页元素" value={elementQuery} onChange={event => setElementQuery(event.target.value)} placeholder="名称或 ID" /></label><div className="element-list">
      {visibleElements.map(item => { const placement = framePlacement(item.frame, state.document.deck.canvas); const name = elementName(item); return <div className={`element-row ${state.selectedIds.includes(item.id) ? 'active' : ''}`} key={item.id}><button className="element-select" onClick={() => state.select([item.id])} title={`选择 ${name}`}><ElementIcon type={item.type} /><span><strong>{name}</strong><small className={placement}>{typeNames[item.type]} · {placementNames[placement]}</small></span></button><button className="element-center" aria-label={`将 ${name} 移回画布中心`} title="移回画布中心" onClick={() => { state.select([item.id]); state.updateElement(item.id, { frame: centerFrame(item.frame, state.document.deck.canvas) } as Partial<SlideElement>, '元素移回画布中心') }}><LocateFixed /></button></div> })}
      {!visibleElements.length && <p className="element-empty">没有匹配的元素</p>}
    </div><p className="element-index-hint">元素可暂放在画布外。点击条目编辑属性，使用定位按钮移回中心。</p></section>
    {!element && selected.length === 0 && <>
      <section><h3>DOCUMENT</h3><label className="field"><span>标题</span><input value={state.document.deck.title} readOnly /></label><div className="metric-grid"><div><span>WIDTH</span><strong>{state.document.deck.canvas.width}</strong></div><div><span>HEIGHT</span><strong>{state.document.deck.canvas.height}</strong></div></div></section>
      <section><h3>COLOR STYLES</h3><div className="theme-presets">{themePresets.map(preset => { const active = Object.entries(preset.colors).every(([key, value]) => state.document.theme.colors[key as keyof typeof preset.colors] === value); return <button key={preset.id} className={active ? 'active' : ''} onClick={() => state.applyTheme(preset.theme)} title={preset.description}><span className="theme-swatches">{Object.values(preset.colors).map(color => <i key={color} style={{ background: color }} />)}</span><strong>{preset.name}</strong><small>{preset.description}</small></button> })}</div></section>
      <section><h3>CUSTOM COLORS</h3>{(['background', 'text', 'muted', 'accent'] as const).map(key => <label className="color-field" key={key}><input type="color" value={state.document.theme.colors[key]} onChange={e => state.updateTheme({ [key]: e.target.value })} /><span>{key}</span><code>{state.document.theme.colors[key]}</code></label>)}</section>
      <section className="hint-card"><span>QUICK START</span><p>选择元素编辑属性，拖动右下角控制点改变尺寸。按住 Shift 可多选。</p></section>
    </>}
      {selected.length > 1 && <section><h3>ALIGNMENT</h3><div className="icon-grid">{([['left', ArrowLeftToLine], ['center', AlignCenter], ['right', ArrowRightToLine], ['top', ArrowUpToLine], ['middle', AlignCenter], ['bottom', ArrowDownToLine]] as const).map(([mode, Icon]) => <button key={mode} onClick={() => state.alignSelected(mode)} title={mode}><Icon /></button>)}</div><p className="muted-copy">选择了 {selected.length} 个元素</p></section>}
    {element && <>
      <section><h3>POSITION</h3><div className="four-grid"><Numeric label="X" value={element.frame.x} onChange={x => patch({ frame: { ...element.frame, x } } as Partial<SlideElement>)} /><Numeric label="Y" value={element.frame.y} onChange={y => patch({ frame: { ...element.frame, y } } as Partial<SlideElement>)} /><Numeric label="W" min={1} value={element.frame.w} onChange={w => patch({ frame: { ...element.frame, w } } as Partial<SlideElement>)} /><Numeric label="H" min={1} value={element.frame.h} onChange={h => patch({ frame: { ...element.frame, h } } as Partial<SlideElement>)} /></div></section>
      {element.type === 'text' && <section><h3>TYPOGRAPHY</h3><Numeric label="SIZE" min={1} value={element.fontSize ?? state.document.theme.fontSizes.body} onChange={fontSize => patch({ fontSize } as Partial<SlideElement>)} /><DraftTextarea label="内容" rows={5} value={element.text} onCommit={text => patch({ text } as Partial<SlideElement>, '编辑文字')} /><div className="icon-grid three"><button onClick={() => patch({ align: 'left' } as Partial<SlideElement>)}><AlignLeft /></button><button onClick={() => patch({ align: 'center' } as Partial<SlideElement>)}><AlignCenter /></button><button onClick={() => patch({ align: 'right' } as Partial<SlideElement>)}><AlignRight /></button></div></section>}
      {element.type === 'shape' && <><section><h3>SHAPE TEXT</h3><DraftTextarea label="内容" rows={4} value={element.text ?? ''} placeholder="输入形状内文字" onCommit={text => patch({ text } as Partial<SlideElement>, '编辑形状文字')} /><Numeric label="SIZE" min={1} value={element.fontSize ?? state.document.theme.fontSizes.body} onChange={fontSize => patch({ fontSize } as Partial<SlideElement>)} /><label className="color-field"><input type="color" value={element.textColor ?? state.document.theme.colors.text} onChange={e => patch({ textColor: e.target.value } as Partial<SlideElement>)} /><span>text</span><code>{element.textColor ?? state.document.theme.colors.text}</code></label><div className="icon-grid three"><button onClick={() => patch({ align: 'left' } as Partial<SlideElement>)} title="左对齐"><AlignLeft /></button><button onClick={() => patch({ align: 'center' } as Partial<SlideElement>)} title="居中"><AlignCenter /></button><button onClick={() => patch({ align: 'right' } as Partial<SlideElement>)} title="右对齐"><AlignRight /></button></div></section><section><h3>APPEARANCE</h3><label className="color-field"><input type="color" value={element.fill} onChange={e => patch({ fill: e.target.value } as Partial<SlideElement>)} /><span>fill</span><code>{element.fill}</code></label><Numeric label="RADIUS" min={0} value={element.radius ?? 0} onChange={radius => patch({ radius } as Partial<SlideElement>)} /></section></>}
      {element.type === 'image' && <section><h3>IMAGE</h3><label className="field"><span>路径 / URL</span><input value={element.src} onChange={e => patch({ src: e.target.value } as Partial<SlideElement>)} /></label><label className="field"><span>适配</span><select value={element.fit} onChange={e => patch({ fit: e.target.value as 'contain' | 'cover' | 'stretch' } as Partial<SlideElement>)}><option>contain</option><option>cover</option><option>stretch</option></select></label></section>}
      {element.type === 'line' && <section><h3>LINE</h3><Numeric label="WIDTH" min={1} value={element.strokeWidth} onChange={strokeWidth => patch({ strokeWidth } as Partial<SlideElement>)} /><label className="check-field"><input type="checkbox" checked={element.dash ?? false} onChange={e => patch({ dash: e.target.checked } as Partial<SlideElement>)} />虚线</label></section>}
    </>}
  </aside>
}
