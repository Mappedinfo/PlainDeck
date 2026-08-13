import { createDeckTemplate, getThemePreset, type DeckDocument } from 'plaindeck/core'

export const defaultTheme = getThemePreset('nature-editorial')!.theme

export function createSampleDocument(): DeckDocument {
  return createDeckTemplate('nature-methods', { title: '方法标题：一句话说清解决了什么', id: 'plaindeck-nature-methods', theme: 'nature-editorial' })
}
