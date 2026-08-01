import type { DeckDocument, Slide, Theme } from './schema'

export const defaultTheme: Theme = {
  fonts: { title: 'Georgia', body: 'Avenir Next', mono: 'IBM Plex Mono' },
  fontSizes: { title: 68, heading: 42, body: 28, caption: 20 },
  colors: { background: '#FFF8E9', text: '#20211D', muted: '#706F67', accent: '#E85538' },
  spacing: { page: 80, small: 16, medium: 32, large: 56 },
}

const title: Slide = { id: 'title', name: 'Opening signal', background: { token: 'color.background' }, elements: [
  { id: 'kicker', type: 'text', frame: { x: 88, y: 72, w: 720, h: 48 }, text: 'LOCAL-FIRST / GIT-NATIVE', fontSize: 20, fontWeight: 700, color: '#E85538' },
  { id: 'title', type: 'text', frame: { x: 88, y: 180, w: 1120, h: 220 }, text: 'Slides that live\nlike source code.', styleRef: 'slide-title', fontSize: 76, fontWeight: 700 },
  { id: 'rule', type: 'shape', frame: { x: 88, y: 470, w: 1424, h: 8 }, shape: 'rectangle', fill: '#20211D' },
  { id: 'subtitle', type: 'text', frame: { x: 88, y: 540, w: 920, h: 100 }, text: 'Visual editing. Plain JSON. Clean diffs.', fontSize: 34 },
  { id: 'number', type: 'text', frame: { x: 1330, y: 720, w: 180, h: 70 }, text: '001', fontSize: 54, fontWeight: 700, align: 'right' },
] }

const method: Slide = { id: 'method', name: 'Working model', elements: [
  { id: 'heading', type: 'text', frame: { x: 80, y: 64, w: 900, h: 90 }, text: 'A constrained scene graph', styleRef: 'slide-title', fontSize: 56, fontWeight: 700 },
  { id: 'card-1', type: 'shape', frame: { x: 80, y: 230, w: 420, h: 420 }, shape: 'rounded-rectangle', fill: '#E85538', radius: 24 },
  { id: 'card-1-text', type: 'text', frame: { x: 120, y: 278, w: 340, h: 250 }, text: '01\n\nOne slide,\none file.', fontSize: 38, fontWeight: 700, color: '#FFF8E9' },
  { id: 'card-2', type: 'shape', frame: { x: 590, y: 230, w: 420, h: 420 }, shape: 'rounded-rectangle', fill: '#20211D', radius: 24 },
  { id: 'card-2-text', type: 'text', frame: { x: 630, y: 278, w: 340, h: 250 }, text: '02\n\nInteger frames.\nStable IDs.', fontSize: 38, fontWeight: 700, color: '#FFF8E9' },
  { id: 'card-3', type: 'shape', frame: { x: 1100, y: 230, w: 420, h: 420 }, shape: 'rounded-rectangle', fill: '#DDD7C9', radius: 24 },
  { id: 'card-3-text', type: 'text', frame: { x: 1140, y: 278, w: 340, h: 250 }, text: '03\n\nSave only\nwhat changed.', fontSize: 38, fontWeight: 700 },
] }

export function createSampleDocument(): DeckDocument {
  return {
    deck: { schemaVersion: '0.1', id: 'plaindeck-starter', title: 'PlainDeck starter', canvas: { width: 1600, height: 900 }, theme: './theme.json', slides: ['./slides/001-title.json', './slides/002-method.json'] },
    slides: { './slides/001-title.json': structuredClone(title), './slides/002-method.json': structuredClone(method) },
    theme: structuredClone(defaultTheme),
  }
}
