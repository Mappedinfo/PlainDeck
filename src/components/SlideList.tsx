import { ChevronDown, ChevronUp, Copy, LayoutTemplate, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { layoutPresets, type LayoutPresetId } from 'plaindeck/core'
import { useEditor } from '../store'
import { SlideSurface } from './SlideSurface'

function LayoutDiagram({ id }: { id: LayoutPresetId }) {
  return <div className={`layout-diagram layout-${id}`} aria-hidden="true">
    {id !== 'blank' && <i className="diagram-title" />}
    {id === 'title-body' && <><i className="diagram-accent" /><i className="diagram-copy" /><i className="diagram-copy short" /></>}
    {id === 'section' && <><i className="diagram-subtitle" /><i className="diagram-edge" /></>}
    {id === 'statement' && <><i className="diagram-statement" /><i className="diagram-index" /></>}
    {id === 'metric' && <><i className="diagram-metric" /><i className="diagram-metric-copy" /></>}
    {id === 'two-column' && <><i className="diagram-column left" /><i className="diagram-column right" /></>}
    {id === 'image-right' && <><i className="diagram-copy left" /><i className="diagram-image" /></>}
    {id === 'three-cards' && <div className="diagram-cards"><i /><i /><i /></div>}
    {id === 'blank' && <span>+</span>}
  </div>
}

export function SlideList() {
  const [choosingLayout, setChoosingLayout] = useState(false)
  const { document, activeSlidePath, setActiveSlide, addSlide, duplicateSlide, deleteSlide, moveSlide } = useEditor()
  return <aside className="slide-panel">
    <div className="panel-heading"><span>PAGES</span><strong>{String(document.deck.slides.length).padStart(2, '0')}</strong></div>
    <div className="slide-list">
      {document.deck.slides.map((path, index) => <button key={path} className={`slide-thumb ${path === activeSlidePath ? 'active' : ''}`} onClick={() => setActiveSlide(path)}>
        <span className="slide-number">{String(index + 1).padStart(3, '0')}</span>
        <div className="thumb-crop"><SlideSurface slide={document.slides[path]} interactive={false} zoom={.1125} /></div>
        <span className="slide-name">{document.slides[path].name ?? document.slides[path].id}</span>
      </button>)}
    </div>
    <div className="slide-actions">
      <button onClick={() => addSlide()} title="新建空白页"><Plus /></button>
      <button onClick={() => setChoosingLayout(value => !value)} title="从布局新建页面" aria-label="页面布局"><LayoutTemplate /></button>
      <button onClick={duplicateSlide} title="复制页面"><Copy /></button>
      <button onClick={deleteSlide} title="删除页面" disabled={document.deck.slides.length <= 1}><Trash2 /></button>
      <span />
      <button onClick={() => moveSlide(-1)} title="上移页面"><ChevronUp /></button>
      <button onClick={() => moveSlide(1)} title="下移页面"><ChevronDown /></button>
    </div>
    {choosingLayout && <div className="layout-picker" role="dialog" aria-label="选择页面布局">
      <div className="layout-picker-heading"><div><span>LAYOUT STATION</span><strong>选择新页面骨架</strong></div><button onClick={() => setChoosingLayout(false)} aria-label="关闭布局选择"><X /></button></div>
      <div className="layout-grid">{layoutPresets.map(preset => <button key={preset.id} onClick={() => { addSlide(preset.id); setChoosingLayout(false) }}>
        <LayoutDiagram id={preset.id} /><strong>{preset.name}</strong><small>{preset.description}</small>
      </button>)}</div>
    </div>}
  </aside>
}
