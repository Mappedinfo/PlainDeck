import { createLayoutElements } from './presets.js'
import type { SlideElement, Theme } from './schema.js'

const BASE_CANVAS = { width: 1600, height: 900 }

export interface PaperFigureContent {
  kicker?: string
  figLabel?: string
  title?: string
  caption?: string
  notesLabel?: string
  notes?: string[]
  image?: { src: string; alt?: string }
}

const setTextEl = (elements: SlideElement[], id: string, text: string | undefined, patch: Record<string, unknown> = {}) => {
  const element = elements.find((candidate) => candidate.id === id)
  if (element && element.type === 'text' && text != null) Object.assign(element, { text, ...patch })
}

/**
 * Fill the paper-figure preset with real content. The preset is authored on
 * the 1600×900 design base and scaled to the target canvas inside
 * createLayoutElements, so every element frame handled here is already in
 * canvas coordinates. Callers must never set preset frames themselves —
 * alignment between the notes column, rail, and caption is owned here.
 * Unused note slots are dropped; a single note extends down the rail so
 * long KEY POINT text keeps a readable size.
 */
export function fillPaperFigure(content: PaperFigureContent, theme: Theme, canvas = BASE_CANVAS): SlideElement[] {
  const elements = createLayoutElements('paper-figure', theme, canvas)
  setTextEl(elements, 'kicker', content.kicker)
  setTextEl(elements, 'fig-label', content.figLabel)
  setTextEl(elements, 'title', content.title, { fit: 'fill' })
  setTextEl(elements, 'caption', content.caption, { fit: 'fill' })
  setTextEl(elements, 'notes-label', content.notesLabel)
  const notes = content.notes ?? []
  const dropped: string[] = []
  for (let index = 0; index < 3; index += 1) {
    const numberId = `note-${index + 1}-number`
    const textId = `note-${index + 1}`
    if (index < notes.length) {
      setTextEl(elements, textId, notes[index], { fit: 'fill' })
    } else {
      dropped.push(numberId, textId)
    }
  }
  const remaining = elements.filter((element) => !dropped.includes(element.id))
  if (notes.length === 1) {
    const note = remaining.find((element) => element.id === 'note-1')
    const rail = remaining.find((element) => element.id === 'rail-rule')
    if (note && rail && note.type === 'text') {
      const bottom = rail.frame.y + rail.frame.h
      note.frame = { ...note.frame, h: Math.max(note.frame.h, bottom - note.frame.y - 16) }
    }
  }
  if (content.image) {
    const figure = remaining.find((element) => element.id === 'figure')
    if (figure && figure.type === 'image') Object.assign(figure, { src: content.image.src, alt: content.image.alt ?? '' })
  }
  return remaining
}
