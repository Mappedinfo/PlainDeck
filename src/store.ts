import { create } from 'zustand'
import { applyDocumentTheme, type DeckDocument, type SlideElement, type Theme } from 'plaindeck/core'
import { createSampleDocument } from './core/sample'
import { createLayoutElements, layoutPresets, type LayoutPresetId } from 'plaindeck/core'
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
  removeSelected(): void
  duplicateSelected(): void
  addSlide(layoutId?: LayoutPresetId): void
  duplicateSlide(): void
  deleteSlide(): void
  moveSlide(direction: -1 | 1): void
  reorderLayer(direction: -1 | 1): void
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

export const useEditor = create<EditorState>((set, get) => ({
  document: initialDocument, activeSlidePath: initialDocument.deck.slides[0], selectedIds: [], zoom: .58,
  saveState: 'demo', error: null, directory: null, dirtyPaths: new Set(), past: [], future: [],
  setDocument: (document, directory = null) => set({ document, directory, activeSlidePath: document.deck.slides[0], selectedIds: [], past: [], future: [], dirtyPaths: new Set(), saveState: directory ? 'saved' : 'demo', error: null }),
  setActiveSlide: activeSlidePath => set({ activeSlidePath, selectedIds: [] }),
  renameSlide: name => {
    const state = get(); const next = name.trim(); const slide = state.document.slides[state.activeSlidePath]
    if (!next || next === (slide.name ?? slide.id)) return
    const document = clone(state.document); document.slides[state.activeSlidePath].name = next
    state.commitDocument(document, '重命名页面', [state.activeSlidePath])
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
    const state = get(); const document = clone(state.document); const slide = document.slides[state.activeSlidePath]
    const index = slide.elements.findIndex(element => element.id === id); if (index < 0) return
    slide.elements[index] = { ...slide.elements[index], ...patch } as SlideElement
    state.commitDocument(document, label, [state.activeSlidePath])
  },
  addElement: type => {
    const state = get(); const document = clone(state.document); const slide = document.slides[state.activeSlidePath]
    let element: SlideElement
    if (type === 'text') element = { id: uid('text'), type, frame: { x: 160, y: 160, w: 600, h: 120 }, text: '双击编辑文字', fontSize: 36 }
    else if (type === 'image') element = { id: uid('image'), type, frame: { x: 200, y: 200, w: 560, h: 360 }, src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200', fit: 'cover', alt: 'placeholder' }
    else if (type === 'shape') element = { id: uid('shape'), type, frame: { x: 240, y: 220, w: 420, h: 240 }, shape: 'rounded-rectangle', fill: state.document.theme.colors.accent, radius: 24, text: '双击添加文字', textColor: state.document.theme.colors.background, fontSize: 30, fontWeight: 700, align: 'center', verticalAlign: 'middle' }
    else element = { id: uid('line'), type, frame: { x: 240, y: 360, w: 560, h: 8 }, color: state.document.theme.colors.text, strokeWidth: 4 }
    slide.elements.push(element); state.commitDocument(document, `添加${type}`, [state.activeSlidePath]); set({ selectedIds: [element.id] })
  },
  removeSelected: () => {
    const state = get(); if (!state.selectedIds.length) return; const document = clone(state.document)
    document.slides[state.activeSlidePath].elements = document.slides[state.activeSlidePath].elements.filter(e => !state.selectedIds.includes(e.id))
    state.commitDocument(document, '删除元素', [state.activeSlidePath]); set({ selectedIds: [] })
  },
  duplicateSelected: () => {
    const state = get(); const document = clone(state.document); const slide = document.slides[state.activeSlidePath]; const ids: string[] = []
    slide.elements.filter(e => state.selectedIds.includes(e.id)).forEach(e => { const copy = clone(e); copy.id = uid(e.type); copy.frame.x += 32; copy.frame.y += 32; slide.elements.push(copy); ids.push(copy.id) })
    if (!ids.length) return; state.commitDocument(document, '复制元素', [state.activeSlidePath]); set({ selectedIds: ids })
  },
  addSlide: (layoutId = 'blank') => {
    const state = get(); const document = clone(state.document); const id = uid('slide'); const path = `./slides/${String(document.deck.slides.length + 1).padStart(3, '0')}-${id}.json`
    const presetName = layoutPresets.find(preset => preset.id === layoutId)?.name ?? '空白页'
    document.deck.slides.push(path); document.slides[path] = { id, name: presetName, layoutRef: layoutId, elements: createLayoutElements(layoutId, document.theme) }
    state.commitDocument(document, `新建页面 · ${presetName}`, ['deck.json', path]); set({ activeSlidePath: path, selectedIds: [] })
  },
  duplicateSlide: () => {
    const state = get(); const document = clone(state.document); const source = document.slides[state.activeSlidePath]; const id = uid(source.id); const path = `./slides/${String(document.deck.slides.length + 1).padStart(3, '0')}-${id}.json`; const copy = clone(source); copy.id = id; copy.name = `${source.name ?? source.id} copy`; copy.elements.forEach(e => e.id = uid(e.type))
    const index = document.deck.slides.indexOf(state.activeSlidePath); document.deck.slides.splice(index + 1, 0, path); document.slides[path] = copy
    state.commitDocument(document, '复制页面', ['deck.json', path]); set({ activeSlidePath: path, selectedIds: [] })
  },
  deleteSlide: () => {
    const state = get(); if (state.document.deck.slides.length <= 1) return; const document = clone(state.document); const index = document.deck.slides.indexOf(state.activeSlidePath); document.deck.slides.splice(index, 1); delete document.slides[state.activeSlidePath]
    state.commitDocument(document, '删除页面', ['deck.json']); set({ activeSlidePath: document.deck.slides[Math.max(0, index - 1)], selectedIds: [] })
  },
  moveSlide: direction => {
    const state = get(); const document = clone(state.document); const index = document.deck.slides.indexOf(state.activeSlidePath); const next = Math.max(0, Math.min(document.deck.slides.length - 1, index + direction)); if (next === index) return
    ;[document.deck.slides[index], document.deck.slides[next]] = [document.deck.slides[next], document.deck.slides[index]]; state.commitDocument(document, '页面排序', ['deck.json'])
  },
  reorderLayer: direction => {
    const state = get(); if (state.selectedIds.length !== 1) return; const document = clone(state.document); const elements = document.slides[state.activeSlidePath].elements; const index = elements.findIndex(e => e.id === state.selectedIds[0]); const next = Math.max(0, Math.min(elements.length - 1, index + direction)); if (index < 0 || next === index) return
    ;[elements[index], elements[next]] = [elements[next], elements[index]]; state.commitDocument(document, direction > 0 ? '前移图层' : '后移图层', [state.activeSlidePath])
  },
  updateTheme: patch => { const state = get(); const theme = { ...state.document.theme, colors: { ...state.document.theme.colors, ...patch } }; state.commitDocument(applyDocumentTheme(state.document, theme), '修改主题', ['theme.json', ...state.document.deck.slides]) },
  applyTheme: theme => { const state = get(); state.commitDocument(applyDocumentTheme(state.document, theme), '应用主题', ['theme.json', ...state.document.deck.slides]) },
  undo: () => set(state => { const entry = state.past.at(-1); if (!entry) return state; return { document: clone(entry.document), past: state.past.slice(0, -1), future: [{ document: clone(state.document), label: entry.label }, ...state.future].slice(0, 100), dirtyPaths: new Set(['deck.json', 'theme.json', ...state.document.deck.slides]), saveState: 'dirty' } }),
  redo: () => set(state => { const entry = state.future[0]; if (!entry) return state; return { document: clone(entry.document), future: state.future.slice(1), past: [...state.past, { document: clone(state.document), label: entry.label }].slice(-100), dirtyPaths: new Set(['deck.json', 'theme.json', ...state.document.deck.slides]), saveState: 'dirty' } }),
  clearDirty: paths => set(state => { const dirtyPaths = new Set(state.dirtyPaths); paths.forEach(path => dirtyPaths.delete(path)); return { dirtyPaths, saveState: dirtyPaths.size ? 'dirty' : state.directory ? 'saved' : 'demo' } }),
}))
