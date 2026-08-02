import { assertDocument, type DeckDocument } from './schema.js'
import { canonicalJson } from './serializer.js'

export interface SavePlanWrite {
  path: string
  content: string
}

export interface SavePlan {
  targets: string[]
  writes: SavePlanWrite[]
  deletions: string[]
}

const slidePathPattern = /^\.\/slides\/[^/]+\.json$/

export function createSavePlan(input: DeckDocument, changedPaths?: Iterable<string>): SavePlan {
  const document = assertDocument(input)
  const targets = [...new Set(changedPaths ?? ['deck.json', document.deck.theme, ...document.deck.slides])]
  const currentPaths = new Set(['deck.json', document.deck.theme, ...document.deck.slides])

  for (const target of targets) {
    if (!currentPaths.has(target) && !(slidePathPattern.test(target) && !document.slides[target])) {
      throw new Error(`不允许写入未知项目路径：${target}`)
    }
  }

  const contentTargets = targets.filter(path => path !== 'deck.json' && currentPaths.has(path))
  const writes = contentTargets.map(path => ({
    path,
    content: canonicalJson(path === document.deck.theme ? document.theme : document.slides[path]),
  }))
  if (targets.includes('deck.json')) writes.push({ path: 'deck.json', content: canonicalJson(document.deck) })

  return {
    targets,
    writes,
    deletions: targets.filter(path => slidePathPattern.test(path) && !document.slides[path]),
  }
}
