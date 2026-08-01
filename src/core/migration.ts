import { DeckSchema, type Deck } from './schema'

export interface Migration { from: string; to: string; migrate: (input: unknown) => unknown }
export const migrations: Migration[] = []

export function migrateDeck(input: unknown): Deck {
  let current = input as Record<string, unknown>
  const seen = new Set<string>()
  while (current.schemaVersion !== '0.1') {
    const version = String(current.schemaVersion ?? 'unknown')
    if (seen.has(version)) throw new Error(`迁移循环：${version}`)
    seen.add(version)
    const migration = migrations.find(item => item.from === version)
    if (!migration) throw new Error(`不支持的 schema 版本：${version}`)
    current = migration.migrate(current) as Record<string, unknown>
  }
  return DeckSchema.parse(current)
}
