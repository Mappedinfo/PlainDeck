import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine } from 'lucide-react'
import { alignmentPatch } from '../core/geometry'
import type { SlideElement } from '../core/schema'
import { useEditor } from '../store'

const Numeric = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => <label className="field compact"><span>{label}</span><input type="number" value={value} onChange={e => onChange(Number(e.target.value))} /></label>

export function Inspector() {
  const state = useEditor(); const slide = state.document.slides[state.activeSlidePath]
  const selected = slide.elements.filter(element => state.selectedIds.includes(element.id)); const element = selected.length === 1 ? selected[0] : null
  const patch = (value: Partial<SlideElement>, label?: string) => element && state.updateElement(element.id, value, label)
  const align = (mode: Parameters<typeof alignmentPatch>[1]) => {
    if (selected.length < 2) return; const patches = alignmentPatch(selected.map(item => item.frame), mode)
    const document = structuredClone(state.document); const target = document.slides[state.activeSlidePath]
    selected.forEach((item, i) => { const index = target.elements.findIndex(e => e.id === item.id); target.elements[index].frame = { ...target.elements[index].frame, ...patches[i] } })
    state.commitDocument(document, `对齐 ${mode}`, [state.activeSlidePath])
  }
  return <aside className="inspector">
    <div className="panel-heading"><span>INSPECTOR</span><strong>{selected.length ? `${selected.length} SELECTED` : 'PAGE'}</strong></div>
    {!element && selected.length === 0 && <>
      <section><h3>DOCUMENT</h3><label className="field"><span>标题</span><input value={state.document.deck.title} readOnly /></label><div className="metric-grid"><div><span>WIDTH</span><strong>{state.document.deck.canvas.width}</strong></div><div><span>HEIGHT</span><strong>{state.document.deck.canvas.height}</strong></div></div></section>
      <section><h3>THEME COLORS</h3>{(['background', 'text', 'muted', 'accent'] as const).map(key => <label className="color-field" key={key}><input type="color" value={state.document.theme.colors[key]} onChange={e => state.updateTheme({ [key]: e.target.value })} /><span>{key}</span><code>{state.document.theme.colors[key]}</code></label>)}</section>
      <section className="hint-card"><span>QUICK START</span><p>选择元素编辑属性，拖动右下角控制点改变尺寸。按住 Shift 可多选。</p></section>
    </>}
    {selected.length > 1 && <section><h3>ALIGNMENT</h3><div className="icon-grid">{([['left', ArrowLeftToLine], ['center', AlignCenter], ['right', ArrowRightToLine], ['top', ArrowUpToLine], ['middle', AlignCenter], ['bottom', ArrowDownToLine]] as const).map(([mode, Icon]) => <button key={mode} onClick={() => align(mode)} title={mode}><Icon /></button>)}</div><p className="muted-copy">选择了 {selected.length} 个元素</p></section>}
    {element && <>
      <section><h3>POSITION</h3><div className="four-grid"><Numeric label="X" value={element.frame.x} onChange={x => patch({ frame: { ...element.frame, x } } as Partial<SlideElement>)} /><Numeric label="Y" value={element.frame.y} onChange={y => patch({ frame: { ...element.frame, y } } as Partial<SlideElement>)} /><Numeric label="W" value={element.frame.w} onChange={w => patch({ frame: { ...element.frame, w } } as Partial<SlideElement>)} /><Numeric label="H" value={element.frame.h} onChange={h => patch({ frame: { ...element.frame, h } } as Partial<SlideElement>)} /></div></section>
      {element.type === 'text' && <section><h3>TYPOGRAPHY</h3><Numeric label="SIZE" value={element.fontSize ?? state.document.theme.fontSizes.body} onChange={fontSize => patch({ fontSize } as Partial<SlideElement>)} /><label className="field"><span>内容</span><textarea rows={5} value={element.text} onChange={e => patch({ text: e.target.value } as Partial<SlideElement>, '编辑文字')} /></label><div className="icon-grid three"><button onClick={() => patch({ align: 'left' } as Partial<SlideElement>)}><AlignLeft /></button><button onClick={() => patch({ align: 'center' } as Partial<SlideElement>)}><AlignCenter /></button><button onClick={() => patch({ align: 'right' } as Partial<SlideElement>)}><AlignRight /></button></div></section>}
      {element.type === 'shape' && <section><h3>APPEARANCE</h3><label className="color-field"><input type="color" value={element.fill} onChange={e => patch({ fill: e.target.value } as Partial<SlideElement>)} /><span>fill</span><code>{element.fill}</code></label><Numeric label="RADIUS" value={element.radius ?? 0} onChange={radius => patch({ radius } as Partial<SlideElement>)} /></section>}
      {element.type === 'image' && <section><h3>IMAGE</h3><label className="field"><span>路径 / URL</span><input value={element.src} onChange={e => patch({ src: e.target.value } as Partial<SlideElement>)} /></label><label className="field"><span>适配</span><select value={element.fit} onChange={e => patch({ fit: e.target.value as 'contain' | 'cover' | 'stretch' } as Partial<SlideElement>)}><option>contain</option><option>cover</option><option>stretch</option></select></label></section>}
      {element.type === 'line' && <section><h3>LINE</h3><Numeric label="WIDTH" value={element.strokeWidth} onChange={strokeWidth => patch({ strokeWidth } as Partial<SlideElement>)} /><label className="check-field"><input type="checkbox" checked={element.dash ?? false} onChange={e => patch({ dash: e.target.checked } as Partial<SlideElement>)} />虚线</label></section>}
    </>}
  </aside>
}
