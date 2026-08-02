import { CloudOff, GitBranch, Github, Minus, Plus } from 'lucide-react'
import { useEditor } from '../store'

export function StatusBar() {
  const { document, zoom, setZoom, saveState, directory, error } = useEditor()
  const label = saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '已保存' : saveState === 'dirty' ? '有未保存更改' : saveState === 'error' ? '保存失败' : '演示项目'
  return <footer className="statusbar">
    <span className={`save-pill ${saveState}`}><i />{label}</span>
    {error && <span className="status-error" title={error}>{error}</span>}
    <span><GitBranch /> {directory ? 'LOCAL DIRECTORY' : 'MEMORY / ZIP'}</span>
    <span><CloudOff /> LOCAL-FIRST</span>
    <a className="source-link" href="https://github.com/Mappedinfo/PlainDeck" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看 PlainDeck 源码" title="GitHub · Mappedinfo/PlainDeck"><Github /> SOURCE</a>
    <span className="status-spacer" />
    <span>{document.deck.canvas.width} × {document.deck.canvas.height}</span>
    <button onClick={() => setZoom(zoom - .05)}><Minus /></button><input aria-label="画布缩放" type="range" min="20" max="125" value={zoom * 100} onChange={e => setZoom(Number(e.target.value) / 100)} /><button onClick={() => setZoom(zoom + .05)}><Plus /></button><strong>{Math.round(zoom * 100)}%</strong>
  </footer>
}
