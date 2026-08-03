import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileArchive, FileCode2, Printer, X } from 'lucide-react'
import { Toolbar } from './components/Toolbar'
import { SlideList } from './components/SlideList'
import { SlideSurface } from './components/SlideSurface'
import { Inspector } from './components/Inspector'
import { StatusBar } from './components/StatusBar'
import { SlideNameEditor } from './components/SlideNameEditor'
import { createSampleDocument } from './core/sample'
import { moveFrame } from './core/geometry'
import { blobToDataUrl, fitImageFrame, hasTransferredImages, imageDimensions, imageFiles, transferredImageFiles, validateImageFile } from './core/imageImport'
import { createSaveLoop } from './core/saveLoop'
import { useEditor } from './store'
import { exportHtml } from './export/html'
import { waitForPrintResources } from './export/print'
import { exportZip, importZip } from './storage/zipStorage'
import { clearRecoveryFromOpfs, initializeProject, pickDirectory, projectFingerprint, readProject, restoreFromOpfs, snapshotToOpfs, verifyPermission, writeImageAsset, writeProject } from './storage/browserStorage'

type ApplyUpdate = (reloadPage?: boolean) => Promise<void>

function Presentation({ onClose }: { onClose: () => void }) {
  const { document, activeSlidePath } = useEditor(); const initial = Math.max(0, document.deck.slides.indexOf(activeSlidePath)); const [index, setIndex] = useState(initial)
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); if (['ArrowRight', 'ArrowDown', ' '].includes(event.key)) setIndex(i => Math.min(document.deck.slides.length - 1, i + 1)); if (['ArrowLeft', 'ArrowUp'].includes(event.key)) setIndex(i => Math.max(0, i - 1)) }; addEventListener('keydown', key); return () => removeEventListener('keydown', key) }, [document.deck.slides.length, onClose])
  const scale = Math.min(window.innerWidth / document.deck.canvas.width, window.innerHeight / document.deck.canvas.height) * .94
  return <div className="presentation" role="dialog" aria-label="演示模式"><button className="presentation-close" onClick={onClose}><X /> 退出</button><div className="presentation-stage" style={{ width: document.deck.canvas.width * scale, height: document.deck.canvas.height * scale }}><SlideSurface slide={document.slides[document.deck.slides[index]]} interactive={false} zoom={scale} /></div><div className="presentation-nav"><button onClick={() => setIndex(i => Math.max(0, i - 1))}><ChevronLeft /></button><span>{index + 1} / {document.deck.slides.length}</span><button onClick={() => setIndex(i => Math.min(document.deck.slides.length - 1, i + 1))}><ChevronRight /></button></div></div>
}

function ExportDialog({ onClose }: { onClose: () => void }) {
  const editor = useEditor(); const { document, directory } = editor
  const action = async (type: 'html' | 'zip' | 'pdf') => {
    try { if (type === 'html') await exportHtml(document, directory); if (type === 'zip') await exportZip(document, directory); if (type === 'pdf') { await waitForPrintResources(globalThis.document.querySelector('.print-deck') ?? globalThis.document); window.print() } onClose() }
    catch (error) { editor.setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="export-dialog" onMouseDown={e => e.stopPropagation()}><div><span className="eyebrow">PORTABLE OUTPUT</span><button onClick={onClose}><X /></button></div><h2>Take the deck with you.</h2><p>原始项目始终留在本地。导出不会改变源文件。</p><button className="export-choice" onClick={() => action('html')}><FileCode2 /><span><strong>Standalone HTML</strong><small>浏览器播放与分享</small></span><Download /></button><button className="export-choice" onClick={() => action('pdf')}><Printer /><span><strong>Print / PDF</strong><small>使用浏览器分页打印</small></span><Download /></button><button className="export-choice" onClick={() => action('zip')}><FileArchive /><span><strong>Project ZIP</strong><small>Firefox / Safari 回退与迁移</small></span><Download /></button></div></div>
}

export default function App() {
  const state = useEditor(); const [present, setPresent] = useState(false); const [exporting, setExporting] = useState(false); const [updateReady, setUpdateReady] = useState(false); const [draggingImage, setDraggingImage] = useState(false); const [imageNotice, setImageNotice] = useState(''); const [recovery, setRecovery] = useState<Awaited<ReturnType<typeof restoreFromOpfs>>>(null); const zipRef = useRef<HTMLInputElement>(null); const imageRef = useRef<HTMLInputElement>(null); const canvasRef = useRef<HTMLElement>(null); const applyUpdateRef = useRef<ApplyUpdate>(null); const saveLoopRef = useRef<ReturnType<typeof createSaveLoop> | null>(null)
  const fitCanvas = useCallback(() => {
    const workspace = canvasRef.current
    if (!workspace) return
    const { width, height } = useEditor.getState().document.deck.canvas
    const zoom = Math.min((workspace.clientWidth - 116) / width, (workspace.clientHeight - 140) / height, .9)
    useEditor.getState().setZoom(zoom)
  }, [])
  const insertImages = useCallback(async (files: File[], point?: { x: number; y: number }) => {
    if (!files.length) return
    try {
      for (const [index, file] of files.entries()) {
        validateImageFile(file)
        const editor = useEditor.getState(); const dimensions = await imageDimensions(file)
        let src: string
        if (editor.directory) {
          if (!await verifyPermission(editor.directory, true)) throw new Error('未授予图片资源写入权限。')
          src = await writeImageAsset(editor.directory, file)
        } else src = await blobToDataUrl(file)
        const offsetPoint = point ? { x: point.x + index * 28, y: point.y + index * 28 } : undefined
        editor.addImage(src, fitImageFrame(dimensions, editor.document.deck.canvas, offsetPoint), file.name || '粘贴的图片')
        setImageNotice(editor.directory ? `已放入画板并保存到 ${src}` : '已放入画板 · 当前演示项目中以内嵌图片保存')
      }
    } catch (error) { useEditor.getState().setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }, [])
  const canvasPoint = useCallback((clientX: number, clientY: number) => {
    const surface = canvasRef.current?.querySelector('.canvas-sized > .slide-surface')
    if (!(surface instanceof HTMLElement)) return undefined
    const rect = surface.getBoundingClientRect(); const canvas = useEditor.getState().document.deck.canvas
    return { x: (clientX - rect.left) * canvas.width / rect.width, y: (clientY - rect.top) * canvas.height / rect.height }
  }, [])
  if (!saveLoopRef.current) saveLoopRef.current = createSaveLoop({
    hasPending: () => useEditor.getState().dirtyRevisions.size > 0,
    saveOnce: async () => {
      const current = useEditor.getState(); const captured = new Map(current.dirtyRevisions); const paths = new Set(captured.keys()); const document = structuredClone(current.document); const directory = current.directory
      current.setSaveState('saving')
      await snapshotToOpfs({ document, projectFingerprint: projectFingerprint(document, directory), revision: current.revision, persistedRevision: current.persistedRevision })
      if (directory) {
        if (!await verifyPermission(directory)) throw new Error('目录写入权限已失效，请重新打开目录。')
        await writeProject(directory, document, paths)
      }
      useEditor.getState().clearDirty(captured)
      if (directory && !useEditor.getState().dirtyRevisions.size) await clearRecoveryFromOpfs()
    },
    onError: error => { useEditor.getState().setSaveState('error', error instanceof Error ? error.message : String(error)) },
  })
  const save = useCallback(() => saveLoopRef.current!.request(), [])

  useEffect(() => { if (state.saveState !== 'dirty') return; const timer = setTimeout(save, 700); return () => clearTimeout(timer) }, [state.document, state.saveState, save])
  useEffect(() => { const update = (event: Event) => { const applyUpdate = (event as CustomEvent<ApplyUpdate>).detail; if (typeof applyUpdate !== 'function') return; applyUpdateRef.current = applyUpdate; setUpdateReady(true) }; addEventListener('plaindeck-update', update); return () => removeEventListener('plaindeck-update', update) }, [])
  useEffect(() => { restoreFromOpfs().then(setRecovery).catch(() => undefined) }, [])
  useEffect(() => { if (!imageNotice) return; const timer = setTimeout(() => setImageNotice(''), 2600); return () => clearTimeout(timer) }, [imageNotice])
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const files = event.clipboardData ? transferredImageFiles(event.clipboardData) : []
      if (!files.length) return; event.preventDefault(); void insertImages(files)
    }
    addEventListener('paste', paste); return () => removeEventListener('paste', paste)
  }, [insertImages])
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
      if (event.key.startsWith('Arrow') && editor.selectedIds.length === 1) { event.preventDefault(); const slide = editor.document.slides[editor.activeSlidePath]; const element = slide.elements.find(item => item.id === editor.selectedIds[0]); if (!element) return; const amount = event.shiftKey ? 8 : 1; const dx = event.key === 'ArrowRight' ? amount : event.key === 'ArrowLeft' ? -amount : 0; const dy = event.key === 'ArrowDown' ? amount : event.key === 'ArrowUp' ? -amount : 0; editor.updateElement(element.id, { frame: moveFrame(element.frame, dx, dy, editor.document.deck.canvas, 1) } as never, '键盘微调') }
    }
    addEventListener('keydown', key); return () => removeEventListener('keydown', key)
  }, [save])

  const openDirectory = async () => {
    try { const handle = await pickDirectory(); if (!await verifyPermission(handle, true)) throw new Error('未授予目录写入权限。'); state.setSaveState('saving'); const document = await readProject(handle); state.setDocument(document, handle); setRecovery(await restoreFromOpfs(projectFingerprint(document, handle))) }
    catch (error) { if ((error as DOMException).name !== 'AbortError') state.setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }
  const newProject = async () => {
    try { const handle = await pickDirectory(); if (!await verifyPermission(handle, true)) throw new Error('未授予目录写入权限。'); const document = createSampleDocument(); await initializeProject(handle, document); await clearRecoveryFromOpfs(); setRecovery(null); state.setDocument(document, handle) }
    catch (error) { if ((error as DOMException).name !== 'AbortError') state.setSaveState('error', error instanceof Error ? error.message : String(error)) }
  }
  const loadZip = async (file?: File) => { if (!file) return; try { state.setDocument(await importZip(file), null) } catch (error) { state.setSaveState('error', error instanceof Error ? error.message : String(error)) } }
  const activeSlide = state.document.slides[state.activeSlidePath]
  return <div className="app-shell">
    <Toolbar onOpen={openDirectory} onNew={newProject} onImportZip={() => zipRef.current?.click()} onAddImage={() => imageRef.current?.click()} onExport={() => setExporting(true)} onPresent={() => setPresent(true)} onSave={save} />
    <input ref={zipRef} hidden type="file" accept=".zip,application/zip" onChange={e => loadZip(e.target.files?.[0])} />
    <input ref={imageRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" multiple onChange={e => { void insertImages(imageFiles(e.target.files ?? [])); e.currentTarget.value = '' }} />
    <main className="workspace"><SlideList /><section ref={canvasRef} className={`canvas-workspace ${draggingImage ? 'image-drop-active' : ''}`} onDragEnter={event => { if (hasTransferredImages(event.dataTransfer)) setDraggingImage(true) }} onDragOver={event => { if (hasTransferredImages(event.dataTransfer)) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingImage(false) }} onDrop={event => { const files = transferredImageFiles(event.dataTransfer); setDraggingImage(false); if (!files.length) return; event.preventDefault(); void insertImages(files, canvasPoint(event.clientX, event.clientY)) }} onDoubleClick={e => { if (e.currentTarget === e.target) fitCanvas() }}><div className="canvas-label"><span>ARTBOARD</span><SlideNameEditor key={state.activeSlidePath} name={activeSlide.name ?? activeSlide.id} onCommit={state.renameSlide} /></div><div className="canvas-scroller"><div className="canvas-sized" style={{ width: state.document.deck.canvas.width * state.zoom, height: state.document.deck.canvas.height * state.zoom }}><SlideSurface slide={activeSlide} zoom={state.zoom} /></div></div><div className="image-drop-overlay"><strong>DROP IMAGE</strong><span>释放以放入当前画板</span></div><div className="canvas-coordinate">X 0000&nbsp;&nbsp; Y 0000</div></section><Inspector /></main>
    <StatusBar />
    <div className="print-deck">{state.document.deck.slides.map(path => <div className="print-page" key={path}><SlideSurface slide={state.document.slides[path]} interactive={false} zoom={1} /></div>)}</div>
    {present && <Presentation onClose={() => setPresent(false)} />}{exporting && <ExportDialog onClose={() => setExporting(false)} />}
    {recovery && <div className="recovery-toast"><strong>发现未保存的恢复快照</strong><span>{new Date(recovery.savedAt).toLocaleString()}</span><div><button onClick={() => { setRecovery(null); void clearRecoveryFromOpfs() }}>丢弃</button><button onClick={() => { state.restoreDocument(recovery.document, recovery.revision); setRecovery(null) }}>恢复</button></div></div>}
    {imageNotice && <div className="image-toast" role="status">{imageNotice}</div>}
    {updateReady && <div className="update-toast">新版本已就绪。保存后刷新以更新。<button onClick={() => { const applyUpdate = applyUpdateRef.current; if (!applyUpdate) return; setUpdateReady(false); void applyUpdate(true).catch(() => setUpdateReady(true)) }}>刷新</button></div>}
  </div>
}
