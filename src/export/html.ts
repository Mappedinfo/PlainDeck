import type { DeckDocument } from 'plaindeck/core'
import { renderHtml } from 'plaindeck/render'
import { saveBlob } from './download'

export function exportHtml(document: DeckDocument): void {
  saveBlob(new Blob([renderHtml(document)], { type: 'text/html' }), `${document.deck.id}.html`)
}
