import { CloudOff, GitBranch, Github, Minus, Palette, Plus } from 'lucide-react'
import { useEditor, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../store'
import { useT } from '../i18n'

export function StatusBar() {
  const { document, zoom, setZoom, saveState, directory, error } = useEditor()
  const { t } = useT()
  const label = saveState === 'saving' ? t.statusBar.saving : saveState === 'saved' ? t.statusBar.saved : saveState === 'dirty' ? t.statusBar.dirty : saveState === 'error' ? t.statusBar.error : t.statusBar.demo
  return <footer className="statusbar">
    <span className={`save-pill ${saveState}`}><i />{label}</span>
    {error && <span className="status-error" title={error}>{error}</span>}
    <span><GitBranch /> {directory ? 'LOCAL DIRECTORY' : 'MEMORY / ZIP'}</span>
    <span><CloudOff /> LOCAL-FIRST</span>
    <a className="source-link" href="https://github.com/Mappedinfo/PlainDeck" target="_blank" rel="noreferrer" aria-label={t.statusBar.githubAria} title={t.statusBar.githubTitle}><Github /> SOURCE</a>
    <a className="source-link palette-lab-link" href="https://mappedinfo.github.io/palette-lab/" target="_blank" rel="noreferrer" aria-label={t.statusBar.paletteAria} title={t.statusBar.paletteTitle}><Palette /> PALETTE LAB</a>
    <span className="status-spacer" />
    <span>{document.deck.canvas.width} × {document.deck.canvas.height}</span>
    <button onClick={() => setZoom(zoom - ZOOM_STEP)}><Minus /></button><input aria-label={t.statusBar.zoomAria} type="range" min={ZOOM_MIN * 100} max={ZOOM_MAX * 100} step={ZOOM_STEP * 100} value={zoom * 100} onChange={e => setZoom(Number(e.target.value) / 100)} /><button onClick={() => setZoom(zoom + ZOOM_STEP)}><Plus /></button><strong>{Math.round(zoom * 100)}%</strong>
  </footer>
}
