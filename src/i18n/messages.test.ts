import { describe, expect, it } from 'vitest'
import { en } from './messages.en'
import { zh } from './messages.zh'

function shape(value: unknown): string {
  if (typeof value === 'function') return `fn(${value.length})`
  if (Array.isArray(value)) return `[${value.map(shape).join('|')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([key, item]) => `${key}:${shape(item)}`).join(',')}}`
  return typeof value
}

describe('i18n dictionaries', () => {
  it('keeps every locale structurally identical to the canonical en dictionary', () => {
    expect(shape(zh)).toBe(shape(en))
  })

  it('renders localized sentences through interpolation', () => {
    expect(en.app.savedToAssetNotice('./assets/x.png')).toContain('./assets/x.png')
    expect(zh.errors.imageTooLarge(25, 'a.png')).toBe('图片超过 25 MB：a.png')
    expect(en.errors.imageTooLarge(25, 'a.png')).toBe('Image exceeds 25 MB: a.png')
  })
})
