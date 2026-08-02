import type { DeckDocument, Slide, Theme } from 'plaindeck/core'
import { DeckSchema, SlideSchema, ThemeSchema, assertDocument, migrateDeck, canonicalJson } from 'plaindeck/core'

export type DirectoryHandle = FileSystemDirectoryHandle
const baselines = new WeakMap<DirectoryHandle, Map<string, string>>()

type PermissionStateValue = 'granted' | 'denied' | 'prompt'
type WritableDirectoryHandle = FileSystemDirectoryHandle & {
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionStateValue>
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionStateValue>
}

async function fileHandle(root: DirectoryHandle, path: string, create = false): Promise<FileSystemFileHandle> {
  const parts = path.replace(/^\.\//, '').split('/')
  const name = parts.pop()
  if (!name) throw new Error(`无效路径：${path}`)
  let directory = root
  for (const part of parts) directory = await directory.getDirectoryHandle(part, { create })
  return directory.getFileHandle(name, { create })
}

async function readText(root: DirectoryHandle, path: string): Promise<string> {
  const handle = await fileHandle(root, path)
  return (await handle.getFile()).text()
}

async function readJson(root: DirectoryHandle, path: string): Promise<unknown> {
  return JSON.parse(await readText(root, path))
}

export async function readProject(root: DirectoryHandle): Promise<DeckDocument> {
  const baseline = new Map<string, string>()
  const deckText = await readText(root, 'deck.json'); baseline.set('deck.json', deckText)
  const deck = migrateDeck(JSON.parse(deckText))
  const themeText = await readText(root, deck.theme); baseline.set(deck.theme, themeText)
  const theme = ThemeSchema.parse(JSON.parse(themeText))
  const slides: Record<string, Slide> = {}
  for (const path of deck.slides) { const text = await readText(root, path); baseline.set(path, text); slides[path] = SlideSchema.parse(JSON.parse(text)) }
  baselines.set(root, baseline)
  return assertDocument({ deck: DeckSchema.parse(deck), slides, theme })
}

export async function writeText(root: DirectoryHandle, path: string, content: string): Promise<void> {
  const handle = await fileHandle(root, path, true)
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

async function writeChecked(root: DirectoryHandle, path: string, content: string): Promise<void> {
  const baseline = baselines.get(root)
  const expected = baseline?.get(path)
  if (expected !== undefined) {
    let current = ''
    try { current = await readText(root, path) } catch { throw new Error(`文件在外部被删除，已停止覆盖：${path}`) }
    if (current !== expected) throw new Error(`检测到外部修改，已停止自动保存：${path}`)
  }
  await writeText(root, path, content)
  const next = baselines.get(root) ?? new Map<string, string>(); next.set(path, content); baselines.set(root, next)
}

export async function writeProject(root: DirectoryHandle, document: DeckDocument, paths?: Set<string>): Promise<void> {
  const targets = paths ?? new Set(['deck.json', document.deck.theme, ...document.deck.slides])
  if (targets.has('deck.json')) await writeChecked(root, 'deck.json', canonicalJson(document.deck))
  if (targets.has(document.deck.theme)) await writeChecked(root, document.deck.theme, canonicalJson(document.theme))
  for (const path of document.deck.slides) if (targets.has(path)) await writeChecked(root, path, canonicalJson(document.slides[path]))
  if (!paths) {
    await root.getDirectoryHandle('assets', { create: true })
    await root.getDirectoryHandle('exports', { create: true })
    await writeText(root, 'theme.css', themeCss(document.theme))
    await writeText(root, '.gitignore', 'exports/*\n!exports/.gitkeep\n.DS_Store\n')
  }
}

export function themeCss(theme: Theme): string {
  return `:root {\n  --font-title: ${JSON.stringify(theme.fonts.title)};\n  --font-body: ${JSON.stringify(theme.fonts.body)};\n  --size-title: ${theme.fontSizes.title}px;\n  --size-body: ${theme.fontSizes.body}px;\n  --color-background: ${theme.colors.background};\n  --color-text: ${theme.colors.text};\n  --color-muted: ${theme.colors.muted};\n  --color-accent: ${theme.colors.accent};\n}\n\n.slide-title {\n  font-family: var(--font-title);\n  font-size: var(--size-title);\n  font-weight: 700;\n  line-height: 1.08;\n  color: var(--color-text);\n}\n`
}

export async function pickDirectory(): Promise<DirectoryHandle> {
  if (!('showDirectoryPicker' in window)) throw new Error('当前浏览器不支持原位目录访问，请使用 Chrome / Edge 或 ZIP 导入。')
  return window.showDirectoryPicker({ mode: 'readwrite' })
}

export async function verifyPermission(handle: DirectoryHandle, request = false): Promise<boolean> {
  const writable = handle as WritableDirectoryHandle
  const options = { mode: 'readwrite' } as const
  if (await writable.queryPermission(options) === 'granted') return true
  return request && await writable.requestPermission(options) === 'granted'
}

export async function snapshotToOpfs(document: DeckDocument): Promise<void> {
  if (!navigator.storage?.getDirectory) return
  const root = await navigator.storage.getDirectory()
  const handle = await root.getFileHandle('plaindeck-recovery.json', { create: true })
  const writable = await handle.createWritable()
  await writable.write(canonicalJson({ savedAt: new Date().toISOString(), document }))
  await writable.close()
}

export async function restoreFromOpfs(): Promise<{ savedAt: string; document: DeckDocument } | null> {
  try {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle('plaindeck-recovery.json')
    const parsed = JSON.parse(await (await handle.getFile()).text())
    return { savedAt: parsed.savedAt, document: parsed.document as DeckDocument }
  } catch { return null }
}

declare global {
  interface Window { showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle> }
}
