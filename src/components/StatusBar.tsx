import { CloudOff, GitBranch, Github, Minus, Palette, Plus } from 'lucide-react'
import { useEditor, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../store'

export function StatusBar() {
  const { document, zoom, setZoom, saveState, directory, error } = useEditor()
  const label = saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '已保存' : saveState === 'dirty' ? '有未保存更改' : saveState === 'error' ? '保存失败' : '演示项目'
  return <footer className="statusbar">
    <span className={`save-pill ${saveState}`}><i />{label}</span>
    {error && <span className="status-error" title={error}>{error}</span>}
    <span><GitBranch /> {directory ? 'LOCAL DIRECTORY' : 'MEMORY / ZIP'}</span>
    <span><CloudOff /> LOCAL-FIRST</span>
    <a className="source-link" href="https://github.com/Mappedinfo/PlainDeck" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看 PlainDeck 源码" title="GitHub · Mappedinfo/PlainDeck"><Github /> SOURCE</a>
    <a className="source-link palette-lab-link" href="https://mappedinfo.github.io/palette-lab/" target="_blank" rel="noreferrer" aria-label="打开色卡实验室配色档案" title="配色来自 色卡实验室 Palette Lab · 15 色 / 8 组搭配"><Palette /> PALETTE LAB</a>
    <span className="status-spacer" />
    <span>{document.deck.canvas.width} × {document.deck.canvas.height}</span>
    <button onClick={() => setZoom(zoom - ZOOM_STEP)}><Minus /></button><input aria-label="画布缩放" type="range" min={ZOOM_MIN * 100} max={ZOOM_MAX * 100} step={ZOOM_STEP * 100} value={zoom * 100} onChange={e => setZoom(Number(e.target.value) / 100)} /><button onClick={() => setZoom(zoom + ZOOM_STEP)}><Plus /></button><strong>{Math.round(zoom * 100)}%</strong>
  </footer>
}
