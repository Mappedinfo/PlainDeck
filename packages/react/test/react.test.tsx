import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDeckTemplate, renderHtml } from 'plaindeck'
import { PlainDeckSlide } from '../src/index.js'

describe('@mappedinfo/plaindeck-react', () => {
  it('renders the same presentation geometry and typography as HTML output', () => {
    const document = createDeckTemplate('showcase', { theme: 'studio-cobalt' })
    const slidePath = document.deck.slides[0]
    const text = document.slides[slidePath].elements.find(element => element.type === 'text')
    if (!text || text.type !== 'text') throw new Error('Text fixture missing')
    const reactMarkup = renderToStaticMarkup(<PlainDeckSlide document={document} slidePath={slidePath} />)
    const htmlMarkup = renderHtml(document, { mode: 'document', slidePaths: [slidePath] })
    for (const token of [`data-element-id="${text.id}"`, `left:${text.frame.x}px`, `font-size:${text.fontSize}px`, `font-family:${document.theme.fonts.title}`]) {
      expect(reactMarkup).toContain(token)
      expect(htmlMarkup).toContain(token)
    }
    expect(reactMarkup).toContain('class="plaindeck-slide slide"')
  })
})
