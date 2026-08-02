import JSZip from 'jszip'
import { saveBlob } from '../export/download'
import type { DeckDocument } from 'plaindeck/core'
import { SlideSchema, ThemeSchema, assertDocument, canonicalJson, migrateDeck } from 'plaindeck/core'
import { themeCss } from './browserStorage'

export async function importZip(file: File): Promise<DeckDocument> {
  const zip = await JSZip.loadAsync(file)
  const read = async (path: string) => {
    const entry = zip.file(path.replace(/^\.\//, ''))
    if (!entry) throw new Error(`ZIP 中缺失：${path}`)
    return JSON.parse(await entry.async('text'))
  }
  const deck = migrateDeck(await read('deck.json'))
  const theme = ThemeSchema.parse(await read(deck.theme))
  const slides = Object.fromEntries(await Promise.all(deck.slides.map(async path => [path, SlideSchema.parse(await read(path))])))
  return assertDocument({ deck, theme, slides })
}

export async function exportZip(document: DeckDocument): Promise<void> {
  const zip = new JSZip()
  zip.file('deck.json', canonicalJson(document.deck))
  zip.file(document.deck.theme.replace(/^\.\//, ''), canonicalJson(document.theme))
  zip.file('theme.css', themeCss(document.theme))
  for (const path of document.deck.slides) zip.file(path.replace(/^\.\//, ''), canonicalJson(document.slides[path]))
  zip.folder('assets'); zip.folder('exports')
  zip.file('.gitignore', 'exports/*\n!exports/.gitkeep\n.DS_Store\n')
  saveBlob(await zip.generateAsync({ type: 'blob' }), `${document.deck.id}.zip`)
}
