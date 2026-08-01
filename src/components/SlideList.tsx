import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react'
import { useEditor } from '../store'
import { SlideSurface } from './SlideSurface'

export function SlideList() {
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
      <button onClick={addSlide} title="新建页面"><Plus /></button>
      <button onClick={duplicateSlide} title="复制页面"><Copy /></button>
      <button onClick={deleteSlide} title="删除页面" disabled={document.deck.slides.length <= 1}><Trash2 /></button>
      <span />
      <button onClick={() => moveSlide(-1)} title="上移页面"><ChevronUp /></button>
      <button onClick={() => moveSlide(1)} title="下移页面"><ChevronDown /></button>
    </div>
  </aside>
}
