import { describe, expect, it } from 'vitest'
import { canonicalJson } from 'plaindeck/core'

describe('canonicalJson', () => {
  it('uses stable key order, two spaces, and LF', () => {
    expect(canonicalJson({ title: 'Deck', id: 'deck', schemaVersion: '0.1' })).toBe('{\n  "schemaVersion": "0.1",\n  "id": "deck",\n  "title": "Deck"\n}\n')
  })
  it('omits undefined properties', () => expect(canonicalJson({ id: 'a', opacity: undefined })).not.toContain('opacity'))
})
