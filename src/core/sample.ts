import { createDeckTemplate, getThemePreset, type DeckDocument } from 'plaindeck/core'

export const defaultTheme = getThemePreset('night-citrus')!.theme

export function createSampleDocument(): DeckDocument {
  return createDeckTemplate('paper-reading', { title: '论文标题：一句话说清核心贡献', id: 'plaindeck-paper-reading', theme: 'night-citrus' })
}
