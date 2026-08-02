import { create } from 'zustand'
import { applyOperations, layoutPresets, type DeckDocument, type DeckOperation, type LayoutPresetId, type SlideElement, type Theme } from 'plaindeck/core'
import { createSampleDocument } from './core/sample'
import { alignmentPatch } from './core/geometry'
import type { DirectoryHandle } from './storage/browserStorage'

type SaveState = 'demo' | 'dirty' | 'saving' | 'saved' | 'error'
interface Snapshot { document: DeckDocument; label: string }

interface EditorState {
  document: DeckDocument
  activeSlidePath: string
  selectedIds: string[]
  zoom: number
  saveState: SaveState
  error: string | null
  directory: DirectoryHandle | null
  dirtyPaths: Set<string>
  past: Snapshot[]
  future: Snapshot[]
  setDocument(document: DeckDocument, directory?: DirectoryHandle | null): void
  setActiveSlide(path: string): void
  renameSlide(name: string): void
  select(ids: string[]): void
  setZoom(zoom: number): void
  setSaveState(state: SaveState, error?: string | null): void
  updateElement(id: string, patch: Partial<SlideElement>, label?: string): void
  addElement(type: SlideElement['type']): void
  addImage(src: string, frame: SlideElement['frame'], alt?: string): string
  removeSelected(): void
  duplicateSelected(): void
  addSlide(layoutId?: LayoutPresetId): void
  duplicateSlide(): void
  deleteSlide(): void
  moveSlide(direction: -1 | 1): void
  reorderLayer(direction: -1 | 1): void
  alignSelected(mode: Parameters<typeof alignmentPatch>[1]): void
  updateTheme(patch: Partial<Theme['colors']>): void
  applyTheme(theme: Theme): void
  commitDocument(document: DeckDocument, label: string, dirtyPaths: string[]): void
  undo(): void
  redo(): void
  clearDirty(paths: Set<string>): void
}

const clone = <T,>(value: T): T => structuredClone(value)
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`
const initialDocument = createSampleDocument()

function commitOperations(state: EditorState, operations: DeckOperation[], label: string) {
  const result = applyOperations(state.document, operations)
  state.commitDocument(result.document, label, result.changedPaths)
  return result
}

export const useEditor = create<EditorState>((set, get) => ({
  document: initialDocument, activeSlidePath: initialDocument.deck.slides[0], selectedIds: [], zoom: .58,
  saveState: 'demo', error: null, directory: null, dirtyPaths: new Set(), past: [], future: [],
  setDocument: (document, directory = null) => set({ document, directory, activeSlidePath: document.deck.slides[0], selectedIds: [], past: [], future: [], dirtyPaths: new Set(), saveState: directory ? 'saved' : 'demo', error: null }),
  setActiveSlide: activeSlidePath => set({ activeSlidePath, selectedIds: [] }),
  renameSlide: name => {
    const state = get(); const next = name.trim(); const slide = state.document.slides[state.activeSlidePath]
    if (!next || next === (slide.name ?? slide.id)) return
    commitOperations(state, [{ op: 'rename-slide', slide: state.activeSlidePath, name: next }], '重命名页面')
  },
  select: selectedIds => set({ selectedIds }),
  setZoom: zoom => set({ zoom: Math.min(1.25, Math.max(.2, zoom)) }),
  setSaveState: (saveState, error = null) => set({ saveState, error }),
  commitDocument: (document, label, paths) => set(state => ({
    document, saveState: 'dirty', future: [],
    past: [...state.past, { document: clone(state.document), label }].slice(-100),
    dirtyPaths: new Set([...state.dirtyPaths, ...paths]),
  })),
  updateElement: (id, patch, label = '修改元素') => {
    const state = get(); const slide = state.document.slides[state.activeSlidePath]
    if (!slide.elements.some(element => element.id === id)) return
    commitOperations(state, [{ op: 'set-element', slide: state.activeSlidePath, element: id, patch }], label)
  },
  addElement: type => {
    const state = get()
    let element: SlideElement
    if (type === 'text') element = { id: uid('text'), type, frame: { x: 160, y: 160, w: 600, h: 120 }, text: '双击编辑文字', fontSize: 36 }
    else if (type === 'image') element = { id: uid('image'), type, frame: { x: 200, y: 200, w: 560, h: 360 }, src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200', fit: 'cover', alt: 'placeholder' }
    else if (type === 'shape') element = { id: uid('shape'), type, frame: { x: 240, y: 220, w: 420, h: 240 }, shape: 'rounded-rectangle', fill: state.document.theme.colors.accent, radius: 24, text: '双击添加文字', textColor: state.document.theme.colors.background, fontSize: 30, fontWeight: 700, align: 'center', verticalAlign: 'middle' }
    else element = { id: uid('line'), type, frame: { x: 240, y: 360, w: 560, h: 8 }, color: state.document.theme.colors.text, strokeWidth: 4 }
    commitOperations(state, [{ op: 'add-element', slide: state.activeSlidePath, element }], `添加${type}`); set({ selectedIds: [element.id] })
  },
  addImage: (src, frame, alt = '') => {
    const state = get(); const id = uid('image')
    const element: SlideElement = { id, type: 'image', frame, src, fit: 'contain', alt }
    commitOperations(state, [{ op: 'add-element', slide: state.activeSlidePath, element }], '插入本地图片'); set({ selectedIds: [id] }); return id
  },
  removeSelected: () => {
    const state = get(); if (!state.selectedIds.length) return
    commitOperations(state, state.selectedIds.map(element => ({ op: 'remove-element', slide: state.activeSlidePath, element })), '删除元素'); set({ selectedIds: [] })
  },
  duplicateSelected: () => {
    const state = get(); const slide = state.document.slides[state.activeSlidePath]; const ids: string[] = []
    const operations = slide.elements.filter(element => state.selectedIds.includes(element.id)).map(element => {
      const copy = clone(element); copy.id = uid(element.type); copy.frame.x += 32; copy.frame.y += 32; ids.push(copy.id)
      return { op: 'add-element', slide: state.activeSlidePath, element: copy } as const
    })
    if (!operations.length) return; commitOperations(state, operations, '复制元素'); set({ selectedIds: ids })
  },
  addSlide: (layoutId = 'blank') => {
    const state = get(); const id = uid('slide')
    const presetName = layoutPresets.find(preset => preset.id === layoutId)?.name ?? '空白页'
    const result = commitOperations(state, [{ op: 'add-slide', id, layout: layoutId, name: presetName }], `新建页面 · ${presetName}`)
    const path = result.changedPaths.find(item => item.startsWith('./slides/')); if (path) set({ activeSlidePath: path, selectedIds: [] })
  },
  duplicateSlide: () => {
    const state = get(); const source = state.document.slides[state.activeSlidePath]; const id = uid(source.id)
    const result = commitOperations(state, [{ op: 'duplicate-slide', slide: state.activeSlidePath, id, name: `${source.name ?? source.id} copy` }], '复制页面')
    const path = result.changedPaths.find(item => item.startsWith('./slides/')); if (path) set({ activeSlidePath: path, selectedIds: [] })
  },
  deleteSlide: () => {
    const state = get(); if (state.document.deck.slides.length <= 1) return; const index = state.document.deck.slides.indexOf(state.activeSlidePath)
    const result = commitOperations(state, [{ op: 'remove-slide', slide: state.activeSlidePath }], '删除页面')
    set({ activeSlidePath: result.document.deck.slides[Math.max(0, index - 1)], selectedIds: [] })
  },
  moveSlide: direction => {
    const state = get(); const paths = state.document.deck.slides; const index = paths.indexOf(state.activeSlidePath); const next = Math.max(0, Math.min(paths.length - 1, index + direction)); if (next === index) return
    const placement = direction < 0 ? { before: paths[next] } : { after: paths[next] }
    commitOperations(state, [{ op: 'move-slide', slide: state.activeSlidePath, ...placement }], '页面排序')
  },
  reorderLayer: direction => {
    const state = get(); if (state.selectedIds.length !== 1) return; const elements = state.document.slides[state.activeSlidePath].elements; const index = elements.findIndex(element => element.id === state.selectedIds[0]); const next = Math.max(0, Math.min(elements.length - 1, index + direction)); if (index < 0 || next === index) return
    const placement = direction < 0 ? { before: elements[next].id } : { after: elements[next].id }
    commitOperations(state, [{ op: 'move-element', slide: state.activeSlidePath, element: state.selectedIds[0], ...placement }], direction > 0 ? '前移图层' : '后移图层')
  },
  alignSelected: mode => {
    const state = get(); const slide = state.document.slides[state.activeSlidePath]
    const selected = slide.elements.filter(element => state.selectedIds.includes(element.id)); if (selected.length < 2) return
    const patches = alignmentPatch(selected.map(element => element.frame), mode)
    const operations = selected.map((element, index) => ({ op: 'set-element', slide: state.activeSlidePath, element: element.id, patch: { frame: { ...element.frame, ...patches[index] } } }) as const)
    commitOperations(state, operations, `对齐 ${mode}`)
  },
  updateTheme: patch => { const state = get(); commitOperations(state, [{ op: 'set-theme', patch }], '修改主题') },
  applyTheme: theme => { const state = get(); commitOperations(state, [{ op: 'set-theme', theme }], '应用主题') },
  undo: () => set(state => { const entry = state.past.at(-1); if (!entry) return state; return { document: clone(entry.document), past: state.past.slice(0, -1), future: [{ document: clone(state.document), label: entry.label }, ...state.future].slice(0, 100), dirtyPaths: new Set(['deck.json', state.document.deck.theme, ...state.document.deck.slides]), saveState: 'dirty' } }),
  redo: () => set(state => { const entry = state.future[0]; if (!entry) return state; return { document: clone(entry.document), future: state.future.slice(1), past: [...state.past, { document: clone(state.document), label: entry.label }].slice(-100), dirtyPaths: new Set(['deck.json', state.document.deck.theme, ...state.document.deck.slides]), saveState: 'dirty' } }),
  clearDirty: paths => set(state => { const dirtyPaths = new Set(state.dirtyPaths); paths.forEach(path => dirtyPaths.delete(path)); return { dirtyPaths, saveState: dirtyPaths.size ? 'dirty' : state.directory ? 'saved' : 'demo' } }),
}))
