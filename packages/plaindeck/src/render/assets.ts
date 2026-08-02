import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import type { DeckDocument } from '../core/schema.js'

const mimeTypes: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
}

export interface PrepareAssetsOptions {
  projectPath?: string
  allowNetwork?: boolean
}

export async function prepareDocumentAssets(input: DeckDocument, options: PrepareAssetsOptions = {}) {
  const document = structuredClone(input)
  const warnings: string[] = []
  const root = resolve(options.projectPath ?? '.')
  for (const path of document.deck.slides) {
    for (const element of document.slides[path].elements) {
      if (element.type !== 'image' || element.src === 'placeholder:image' || element.src.startsWith('data:')) continue
      if (/^https?:\/\//i.test(element.src)) {
        if (!options.allowNetwork) {
          warnings.push(`已阻止外部图片：${element.src}`)
          element.src = 'placeholder:image'
        }
        continue
      }
      try {
        if (isAbsolute(element.src)) throw new Error('不允许绝对资源路径')
        const assetPath = resolve(root, element.src.replace(/^\.\//, ''))
        const inside = relative(root, assetPath)
        if (inside.startsWith('..') || isAbsolute(inside)) throw new Error('资源路径越界')
        const mime = mimeTypes[extname(assetPath).toLowerCase()]
        if (!mime) throw new Error('不支持的图片格式')
        element.src = `data:${mime};base64,${(await readFile(assetPath)).toString('base64')}`
      } catch (error) {
        warnings.push(`${element.src}：${error instanceof Error ? error.message : String(error)}`)
        element.src = 'placeholder:image'
      }
    }
  }
  return { document, warnings }
}
