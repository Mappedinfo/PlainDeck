import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileArchive, FileCode2, Printer, X } from 'lucide-react'
import { Toolbar } from './components/Toolbar'
import { SlideList } from './components/SlideList'
import { SlideSurface } from './components/SlideSurface'
import { Inspector } from './components/Inspector'
import { StatusBar } from './components/StatusBar'
import { createSampleDocument } from './core/sample'
import { useEditor } from './store'
import { exportHtml } from './export/html'
import { exportZip, importZip } from './storage/zipStorage'
import { pickDirectory, readProject, restoreFromOpfs, snapshotToOpfs, verifyPermission, writeProject } from './storage/browserStorage'

type ApplyUpdate = (reloadPage?: boolean) => Promise<void>

function Presentation({ onClose }: { onClose: () => void }) {
  const { document, activeSlidePath } = useEditor(); const initial = Math.max(0, document.deck.slides.indexOf(activeSlidePath)); const [index, setIndex] = useState(initial)
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); if (['ArrowRight', 'ArrowDown', ' '].includes(event.key)) setIndex(i => Math.min(document.deck.slides.length - 1, i + 1)); if (['ArrowLeft', 'ArrowUp'].includes(event.key)) setIndex(i => Math.max(0, i - 1)) }; addEventListener('keydown', key); return () => removeEventListener('keydown', key) }, [document.deck.slides.length, onClose])
  const scale = Math.min(window.innerWidth / document.deck.canvas.width, window.innerHeight / document.deck.canvas.height) * .94
  return <div className="presentation" role="dialog" aria-label="演示模式"><button className="presentation-close" onClick={onClose}><X /> 退出</button><div className="presentation-stage" style={{ width: document.deck.canvas.width * scale, height: document.deck.canvas.height * scale }}><SlideSurface slide={document.slides[document.deck.slides[index]]} interactive={false} zoom={scale} /></div><div className="presentation-nav"><button onClick={() => setIndex(i => Math.max(0, i - 1))}><ChevronLeft /></button><span>{index + 1} / {document.deck.slides.length}</span><button onClick={() => setIndex(i => Math.min(document.deck.slides.length - 1, i + 1))}><ChevronRight /></button></div></div>
}

function ExportDialog({ onClose }: { onClose: () => void }) {
  const { document } = useEditor()
  const action = async (type: 'html' | 'zip' | 'pdf') => { if (type === 'html') exportHtml(document); if (type === 'zip') await exportZip(document); if (type === 'pdf') setTimeout(() => window.print(), 100); onClose() }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="export-dialog" onMouseDown={e => e.stopPropagation()}><div><span className="eyebrow">PORTABLE OUTPUT</span><button onClick={onClose}><X /></button></div><h2>Take the deck with you.</h2><p>原始项目始终留在本地。导出不会改变源文件。</p><button className="export-choice" onClick={() => action('html')}><FileCode2 /><span><strong>Standalone HTML</strong><small>浏览器播放与分享</small></span><Download /></button><button className="export-choice" onClick={() => action('pdf')}><Printer /><span><strong>Print / PDF</strong><small>使用浏览器分页打印</small></span><Download /></button><button className="export-choice" onClick={() => action('zip')}><FileArchive /><span><strong>Project ZIP</strong><small>Firefox / Safari 回退与迁移</small></span><Download /></button></div></div>
}

export default function App() {
  const state = useEditor(); const [present, setPresent] = useState(false); const [exporting, setExporting] = useState(false); const [updateReady, setUpdateReady] = useState(false); const [recovery, setRecovery] = useState<Awaited<ReturnType<typeof restoreFromOpfs>>>(null); const fileRef = useRef<HTMLInputElement>(null); const canvasRef = useRef<HTMLElement>(null); const applyUpdateRef = useRef<ApplyUpdate>(null)
  const fitCanvas = useCallback(() => {
    const workspace = canvasRef.current
    if (!workspace) return
    const { width, height } = useEditor.getState().document.deck.canvas
    const zoom = Math.min((workspace.clientWidth - 116) / width, (workspace.clientHeight - 140) / height, .9)
    useEditor.getState().setZoom(zoom)
  }, [])
  const save = useCallback(async () => {
    const current = useEditor.getState(); if (!current.dirtyPaths.size && current.saveState !== 'demo') return
    const paths = new Set(current.dirtyPaths); current.setSaveState('saving')
    try {
      await snapshotToOpfs(current.document)
      if (current.directory) { if (!await verifyPermission(current.directory)) throw new Error('目录写入权限已失效，请重新打开目录。'); await writeProject(current.directory, current.document, paths) }
      current.clearDirty(paths)
    } catch (error) { current.setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }, [])

  useEffect(() => { if (state.saveState !== 'dirty') return; const timer = setTimeout(save, 700); return () => clearTimeout(timer) }, [state.document, state.saveState, save])
  useEffect(() => { const update = (event: Event) => { const applyUpdate = (event as CustomEvent<ApplyUpdate>).detail; if (typeof applyUpdate !== 'function') return; applyUpdateRef.current = applyUpdate; setUpdateReady(true) }; addEventListener('plaindeck-update', update); return () => removeEventListener('plaindeck-update', update) }, [])
  useEffect(() => { restoreFromOpfs().then(setRecovery).catch(() => undefined) }, [])
  useEffect(() => { const observer = new ResizeObserver(fitCanvas); if (canvasRef.current) observer.observe(canvasRef.current); fitCanvas(); return () => observer.disconnect() }, [fitCanvas, state.document.deck.canvas.width, state.document.deck.canvas.height])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return
      const editor = useEditor.getState(); const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? editor.redo() : editor.undo() }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); editor.redo() }
      if (mod && event.key.toLowerCase() === 'd') { event.preventDefault(); editor.duplicateSelected() }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); save() }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); editor.removeSelected() }
      if (event.key.startsWith('Arrow') && editor.selectedIds.length === 1) { event.preventDefault(); const slide = editor.document.slides[editor.activeSlidePath]; const element = slide.elements.find(item => item.id === editor.selectedIds[0]); if (!element) return; const amount = event.shiftKey ? 8 : 1; editor.updateElement(element.id, { frame: { ...element.frame, x: element.frame.x + (event.key === 'ArrowRight' ? amount : event.key === 'ArrowLeft' ? -amount : 0), y: element.frame.y + (event.key === 'ArrowDown' ? amount : event.key === 'ArrowUp' ? -amount : 0) } } as never, '键盘微调') }
    }
    addEventListener('keydown', key); return () => removeEventListener('keydown', key)
  }, [save])

  const openDirectory = async () => {
    try { const handle = await pickDirectory(); if (!await verifyPermission(handle, true)) throw new Error('未授予目录写入权限。'); state.setSaveState('saving'); state.setDocument(await readProject(handle), handle) }
    catch (error) { if ((error as DOMException).name !== 'AbortError') state.setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }
  const newProject = async () => {
    try { const handle = await pickDirectory(); if (!await verifyPermission(handle, true)) throw new Error('未授予目录写入权限。'); const document = createSampleDocument(); await writeProject(handle, document); state.setDocument(document, handle) }
    catch (error) { if ((error as DOMException).name !== 'AbortError') state.setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }
  const loadZip = async (file?: File) => { if (!file) return; try { state.setDocument(await importZip(file), null) } catch (error) { state.setSaveState('error', error instanceof Error ? error.message : String(error)) } }
  const activeSlide = state.document.slides[state.activeSlidePath]
  return <div className="app-shell">
    <Toolbar onOpen={openDirectory} onNew={newProject} onImportZip={() => fileRef.current?.click()} onExport={() => setExporting(true)} onPresent={() => setPresent(true)} onSave={save} />
    <input ref={fileRef} hidden type="file" accept=".zip,application/zip" onChange={e => loadZip(e.target.files?.[0])} />
    <main className="workspace"><SlideList /><section ref={canvasRef} className="canvas-workspace" onDoubleClick={e => { if (e.currentTarget === e.target) fitCanvas() }}><div className="canvas-label"><span>ARTBOARD</span><strong>{activeSlide.name ?? activeSlide.id}</strong></div><div className="canvas-scroller"><div className="canvas-sized" style={{ width: state.document.deck.canvas.width * state.zoom, height: state.document.deck.canvas.height * state.zoom }}><SlideSurface slide={activeSlide} zoom={state.zoom} /></div></div><div className="canvas-coordinate">X 0000&nbsp;&nbsp; Y 0000</div></section><Inspector /></main>
    <StatusBar />
    <div className="print-deck">{state.document.deck.slides.map(path => <div className="print-page" key={path}><SlideSurface slide={state.document.slides[path]} interactive={false} zoom={1} /></div>)}</div>
    {present && <Presentation onClose={() => setPresent(false)} />}{exporting && <ExportDialog onClose={() => setExporting(false)} />}
    {recovery && <div className="recovery-toast"><strong>发现恢复快照</strong><span>{new Date(recovery.savedAt).toLocaleString()}</span><div><button onClick={() => setRecovery(null)}>忽略</button><button onClick={() => { state.setDocument(recovery.document); setRecovery(null) }}>恢复</button></div></div>}
    {updateReady && <div className="update-toast">新版本已就绪。保存后刷新以更新。<button onClick={() => { const applyUpdate = applyUpdateRef.current; if (!applyUpdate) return; setUpdateReady(false); void applyUpdate(true).catch(() => setUpdateReady(true)) }}>刷新</button></div>}
  </div>
}
