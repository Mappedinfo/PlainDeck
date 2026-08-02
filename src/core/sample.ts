import { createDeckTemplate, getThemePreset, type DeckDocument } from 'plaindeck/core'

export const defaultTheme = getThemePreset('studio-cobalt')!.theme

export function createSampleDocument(): DeckDocument {
  return createDeckTemplate('showcase', { title: 'PlainDeck · Make the idea visible.', id: 'plaindeck-showcase', theme: 'studio-cobalt' })
}
