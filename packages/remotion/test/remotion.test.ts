import { describe, expect, it } from 'vitest'
import { createDeckTemplate } from 'plaindeck'
import { elementAnimationStyle } from '../src/index.js'

describe('@mappedinfo/plaindeck-remotion', () => {
  it('turns readable animation metadata into deterministic frame styles', () => {
    const document = createDeckTemplate('showcase')
    const element = document.slides[document.deck.slides[0]].elements[0]
    element.animation = { enter: 'fade-up', delayFrames: 12, durationFrames: 20 }
    expect(elementAnimationStyle(element, 0)).toMatchObject({ opacity: 0, translate: '0px 34px' })
    const middle = elementAnimationStyle(element, 22)
    expect(Number(middle.opacity)).toBeGreaterThan(0)
    expect(Number(middle.opacity)).toBeLessThan(1)
    expect(elementAnimationStyle(element, 40)).toMatchObject({ opacity: 1, translate: '0px 0px' })
  })

  it('leaves unanimated elements untouched', () => {
    const document = createDeckTemplate('showcase')
    const element = document.slides[document.deck.slides[0]].elements[0]
    expect(elementAnimationStyle(element, 30)).toEqual({})
  })
})
