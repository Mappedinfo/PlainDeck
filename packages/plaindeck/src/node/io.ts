import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { createSavePlan } from '../core/save-plan.js'
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
  const plan = createSavePlan(document, changedPaths)
  for (const write of plan.writes) await atomicWrite(projectFile(root, write.path), write.content)
  for (const target of plan.deletions) await rm(projectFile(root, target), { force: true })
  return plan.targets
}
