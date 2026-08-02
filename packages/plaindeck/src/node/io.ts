import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { canonicalJson } from '../core/serializer.js'
import { migrateDeck } from '../core/migration.js'
import { DeckSchema, SlideSchema, ThemeSchema, assertDocument, type DeckDocument, type Slide } from '../core/schema.js'

function projectFile(root: string, file: string) {
  if (isAbsolute(file)) throw new Error(`项目路径必须是相对路径：${file}`)
  const resolvedRoot = resolve(root)
  const resolvedFile = resolve(resolvedRoot, file.replace(/^\.\//, ''))
  const inside = relative(resolvedRoot, resolvedFile)
  if (inside.startsWith('..') || isAbsolute(inside)) throw new Error(`项目路径越界：${file}`)
  return resolvedFile
}

async function readJson(root: string, file: string) {
  return JSON.parse(await readFile(projectFile(root, file), 'utf8')) as unknown
}

export async function loadDeck(projectPath: string): Promise<DeckDocument> {
  const root = resolve(projectPath)
  const deck = migrateDeck(await readJson(root, 'deck.json'))
  const theme = ThemeSchema.parse(await readJson(root, deck.theme))
  const slides: Record<string, Slide> = {}
  for (const path of deck.slides) slides[path] = SlideSchema.parse(await readJson(root, path))
  return assertDocument({ deck: DeckSchema.parse(deck), theme, slides })
}

async function atomicWrite(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.plaindeck-${process.pid}-${Date.now()}.tmp`
  await writeFile(temporary, content, 'utf8')
  await rename(temporary, path)
}

export async function saveDeck(projectPath: string, input: DeckDocument, changedPaths?: Iterable<string>): Promise<string[]> {
  const document = assertDocument(input)
  const root = resolve(projectPath)
  const targets = [...new Set(changedPaths ?? ['deck.json', document.deck.theme, ...document.deck.slides])]
  const allowed = new Set(['deck.json', document.deck.theme, ...document.deck.slides])

  for (const target of targets) {
    if (target.startsWith('./slides/') && !document.slides[target]) continue
    if (!allowed.has(target)) throw new Error(`不允许写入未知项目路径：${target}`)
    const value = target === 'deck.json' ? document.deck : target === document.deck.theme ? document.theme : document.slides[target]
    await atomicWrite(projectFile(root, target), canonicalJson(value))
  }
  for (const target of targets) {
    if (target.startsWith('./slides/') && !document.slides[target]) await rm(projectFile(root, target), { force: true })
  }
  return targets
}
