import { describe, expect, it } from 'vitest'
import { applyOperations, createDeckTemplate, errorMessage, PlainDeckError } from '../src/index.js'

describe('structured bilingual errors', () => {
  it('exposes a stable code plus zh/en sentences while keeping zh as .message', () => {
    try {
      createDeckTemplate('nope' as never)
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(PlainDeckError)
      const deckError = error as PlainDeckError
      expect(deckError.code).toBe('unknown-template')
      expect(deckError.message).toMatch(/未知模板/)
      expect(deckError.for('en')).toMatch(/Unknown template/)
    }
  })

  it('localizes operation kernel failures on request', () => {
    const document = createDeckTemplate('showcase')
    try {
      applyOperations(document, [{ op: 'remove-slide', slide: './slides/999-nope.json' }])
      expect.unreachable()
    } catch (error) {
      expect(errorMessage(error, 'en')).toMatch(/Slide not found/)
      expect(errorMessage(error, 'zh')).toMatch(/页面不存在/)
      expect(errorMessage(error)).toMatch(/页面不存在/)
    }
  })
})
