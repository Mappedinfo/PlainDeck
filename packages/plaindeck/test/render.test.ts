import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyOperations, loadDeck, prepareDocumentAssets, renderPdf, renderPng } from '../src/index.js'
import { renderHtml } from '../src/render/index.js'

describe('PlainDeck renderer', () => {
  it('renders shape text, image placeholders, backgrounds, and escaped text', async () => {
    const document = await loadDeck(resolve('examples/starter'))
    document.slides[document.deck.slides[0]].background = { token: 'color.accent' }
    const result = applyOperations(document, [
      { op: 'add-slide', id: 'render-fixture', layout: 'three-cards', name: 'Render <check>' },
      { op: 'add-element', slide: './slides/001-intro.json', element: { id: 'placeholder', type: 'image', frame: { x: 0, y: 0, w: 100, h: 100 }, src: 'placeholder:image', fit: 'contain' } },
      { op: 'add-element', slide: './slides/001-intro.json', element: { id: 'arrow', type: 'line', frame: { x: 0, y: 120, w: 100, h: 20 }, color: '#123456', strokeWidth: 4, arrowEnd: true } },
    ])
    const html = renderHtml(result.document)
    expect(html).toContain('双击编辑卡片文字')
    expect(html).toContain('图片占位')
    expect(html).toContain('Render &lt;check&gt;')
    expect(html).toContain('#FFF8E9')
    expect(html).toContain('style="background:#E85538"')
    expect(html).toContain('border-left:16px solid #123456')
  })

  it('embeds local assets and blocks remote assets by default', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-assets-'))
    await writeFile(join(root, 'local.png'), Buffer.from('89504e470d0a1a0a', 'hex'))
    const document = await loadDeck(resolve('examples/starter'))
    document.slides[document.deck.slides[0]].elements.push(
      { id: 'local', type: 'image', frame: { x: 0, y: 0, w: 10, h: 10 }, src: './local.png', fit: 'contain' },
      { id: 'remote', type: 'image', frame: { x: 10, y: 0, w: 10, h: 10 }, src: 'https://example.com/image.png', fit: 'contain' },
    )
    const prepared = await prepareDocumentAssets(document, { projectPath: root })
    const images = prepared.document.slides[prepared.document.deck.slides[0]].elements.filter(element => element.type === 'image')
    expect(images.find(element => element.id === 'local')).toMatchObject({ src: expect.stringMatching(/^data:image\/png;base64,/) })
    expect(images.find(element => element.id === 'remote')).toMatchObject({ src: 'placeholder:image' })
    expect(prepared.warnings).toHaveLength(1)
  })
})

describe.runIf(process.env.PLAINDECK_BROWSER_TESTS === '1')('Playwright renderer', () => {
  it('renders exact-size PNG and a multi-page PDF', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plaindeck-render-'))
    const document = await loadDeck(resolve('examples/starter'))
    const png = join(root, 'slide.png')
    const pdf = join(root, 'deck.pdf')
    await renderPng(document, { output: png, projectPath: resolve('examples/starter'), slide: 1 })
    await renderPdf(document, { output: pdf, projectPath: resolve('examples/starter') })
    const pngBytes = await readFile(png)
    expect(pngBytes.subarray(1, 4).toString()).toBe('PNG')
    expect(pngBytes.readUInt32BE(16)).toBe(1600)
    expect(pngBytes.readUInt32BE(20)).toBe(900)
    const pdfBytes = await readFile(pdf)
    expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF')
    expect(pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(document.deck.slides.length)
  }, 60_000)
})
