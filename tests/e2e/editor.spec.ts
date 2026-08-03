import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const packageVersion = JSON.parse(readFileSync(new URL('../../packages/plaindeck/package.json', import.meta.url), 'utf8')).version as string

test('edits the sample deck and uses history', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('./')
  await expect(page.getByRole('banner').getByText('PlainDeck', { exact: true })).toBeVisible()
  await expect(page.getByTitle('PlainDeck core version')).toHaveText(`v${packageVersion}`)
  await expect(page.locator('.slide-thumb')).toHaveCount(5)
  await expect(page.locator('.canvas-label strong')).toHaveText('Cover')
  await expect(page.getByRole('link', { name: '在 GitHub 查看 PlainDeck 源码' })).toHaveAttribute('href', 'https://github.com/Mappedinfo/PlainDeck')
  await page.getByRole('button', { name: '添加文本' }).click()
  await expect(page.locator('.slide-element.selected')).toHaveCount(1)
  await page.getByRole('button', { name: '撤销' }).click()
  const added = page.locator('.canvas-workspace [data-element-id^="text-"]')
  await expect(added).toHaveCount(0)
  await page.getByRole('button', { name: '重做' }).click()
  await expect(added).toHaveCount(1)
  await page.screenshot({ path: '/tmp/plaindeck-e2e.png', fullPage: true })
  expect(errors).toEqual([])
})

test('inserts local images from file picker, clipboard, and canvas drop', async ({ page }) => {
  await page.goto('./')
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#ff5a4f"/></svg>'
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: '插入本地图片' }).click()
  await (await chooser).setFiles({ name: 'picker.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) })
  const imported = page.locator('.canvas-workspace .slide-element img')
  await expect(imported).toHaveCount(1)
  await expect(imported.first()).toHaveAttribute('src', /^data:image\/svg\+xml;base64,/)
  await expect(page.getByRole('status')).toContainText('已放入画板')

  await page.evaluate(source => {
    const transfer = new DataTransfer(); transfer.items.add(new File([source], 'clipboard.svg', { type: 'image/svg+xml' }))
    document.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: transfer }))
  }, svg)
  await expect(imported).toHaveCount(2)

  const canvas = page.locator('.canvas-workspace'); const box = await canvas.boundingBox()
  if (!box) throw new Error('Canvas bounds missing')
  await page.evaluate(({ source, x, y }) => {
    const transfer = new DataTransfer(); transfer.items.add(new File([source], 'dropped.svg', { type: 'image/svg+xml' }))
    const canvas = document.querySelector('.canvas-workspace')!
    canvas.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer, clientX: x, clientY: y }))
  }, { source: svg, x: box.x + box.width * .7, y: box.y + box.height * .6 })
  await expect(canvas).toHaveClass(/image-drop-active/)
  await page.screenshot({ path: '/tmp/plaindeck-image-drop.png', fullPage: true })
  await page.evaluate(({ source, x, y }) => {
    const transfer = new DataTransfer(); transfer.items.add(new File([source], 'dropped.svg', { type: 'image/svg+xml' }))
    const canvas = document.querySelector('.canvas-workspace')!
    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer, clientX: x, clientY: y }))
  }, { source: svg, x: box.x + box.width * .7, y: box.y + box.height * .6 })
  await expect(imported).toHaveCount(3)
  await expect(page.locator('.canvas-workspace .slide-element.selected img')).toHaveAttribute('alt', 'dropped.svg')
})

test('opens presentation and export surfaces', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '演示' }).click()
  await expect(page.getByRole('dialog', { name: '演示模式' })).toBeVisible()
  await page.getByRole('button', { name: /退出/ }).click()
  await page.getByRole('button', { name: '导出', exact: true }).click()
  await expect(page.getByText('Take the deck with you.')).toBeVisible()
})

test('renames the active artboard and updates the page list', async ({ page }) => {
  await page.goto('./')
  await page.locator('.canvas-name').dblclick()
  const input = page.getByRole('textbox', { name: '页面名称' })
  await input.fill('研究结论')
  await page.screenshot({ path: '/tmp/plaindeck-rename-artboard.png', fullPage: true })
  await input.press('Enter')

  await expect(page.locator('.canvas-name')).toHaveText('研究结论')
  await expect(page.locator('.slide-thumb.active .slide-name')).toHaveText('研究结论')
  await page.getByRole('button', { name: '撤销' }).click()
  await expect(page.locator('.canvas-name')).toHaveText('Cover')
  await expect(page.locator('.slide-thumb.active .slide-name')).toHaveText('Cover')
})

test('stages elements outside the canvas and recovers them from the element index', async ({ page }) => {
  await page.goto('./')
  const surface = page.locator('.canvas-workspace .editor-surface')
  const element = surface.locator('[data-element-id="accent-panel"]')
  const surfaceBox = await surface.boundingBox(); const elementBox = await element.boundingBox()
  if (!surfaceBox || !elementBox) throw new Error('Canvas or element bounds missing')

  await page.mouse.move(elementBox.x + elementBox.width / 2, elementBox.y + elementBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x - elementBox.width / 2 - 20, elementBox.y + elementBox.height / 2, { steps: 8 })
  await page.mouse.up()

  await expect(element).toHaveAttribute('data-canvas-placement', 'outside')
  await expect(element.locator('.off-canvas-fragment')).not.toHaveCount(0)
  await expect(page.locator('.element-row').filter({ hasText: 'accent-panel' })).toContainText('画布外')
  await expect(page.locator('.thumb-crop .output-surface').first()).toHaveCSS('overflow', 'hidden')

  await surface.click({ position: { x: surfaceBox.width * .65, y: surfaceBox.height * .5 } })
  await expect(element).not.toHaveClass(/selected/)
  await page.mouse.click(surfaceBox.x - 30, elementBox.y + elementBox.height / 2)
  await expect(element).toHaveClass(/selected/)
  await page.screenshot({ path: '/tmp/plaindeck-off-canvas-staging.png', fullPage: true })

  await page.getByRole('button', { name: '将 形状 · accent-panel 移回画布中心' }).click()
  await expect(element).toHaveAttribute('data-canvas-placement', 'inside')
  await expect(element.locator('.off-canvas-fragment')).toHaveCount(0)
  await expect(page.locator('.element-row').filter({ hasText: 'accent-panel' })).toContainText('画布内')
})

test('duplicates and reorders pages and layers through the shared operation kernel', async ({ page }) => {
  await page.goto('./')
  await page.getByTitle('复制页面').click()
  await expect(page.locator('.slide-thumb')).toHaveCount(6)
  await expect(page.locator('.slide-thumb').nth(1)).toHaveClass(/active/)
  await page.getByTitle('下移页面').click()
  await expect(page.locator('.slide-thumb').nth(2)).toHaveClass(/active/)

  await page.getByRole('button', { name: '添加矩形' }).click()
  const elements = page.locator('.canvas-workspace .slide-element')
  const selectedId = await page.locator('.canvas-workspace .slide-element.selected').getAttribute('data-element-id')
  await page.getByRole('button', { name: '后移图层' }).click()
  await expect(elements.nth((await elements.count()) - 2)).toHaveAttribute('data-element-id', selectedId!)
  await page.getByRole('button', { name: '前移图层' }).click()
  await expect(elements.last()).toHaveAttribute('data-element-id', selectedId!)
})

test('activates a waiting service worker before refreshing', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => {
    const applyUpdate = async (reloadPage?: boolean) => {
      document.documentElement.dataset.updateApplied = String(reloadPage)
    }
    window.dispatchEvent(new CustomEvent('plaindeck-update', { detail: applyUpdate }))
  })

  const updateNotice = page.locator('.update-toast')
  await expect(updateNotice).toBeVisible()
  await updateNotice.getByRole('button', { name: '刷新' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-update-applied', 'true')
  await expect(updateNotice).toBeHidden()
})

test('creates a layout page, changes its color style, and edits shape text', async ({ page }) => {
  await page.goto('./')
  const nightCitrus = page.locator('.theme-presets > button').filter({ hasText: '午夜柑橘' })
  await nightCitrus.click()
  await expect(nightCitrus).toHaveClass(/active/)
  await expect(page.locator('.canvas-workspace .slide-surface')).toHaveCSS('background-color', 'rgb(16, 23, 20)')
  await expect(page.locator('.canvas-workspace [data-element-id="accent-panel"] .shape-content')).toHaveCSS('background-color', 'rgb(216, 255, 82)')
  await page.getByRole('button', { name: '页面布局' }).click()
  const layoutPicker = page.getByRole('dialog', { name: '选择页面布局' })
  await expect(layoutPicker).toBeVisible()
  await page.screenshot({ path: '/tmp/plaindeck-layout-picker.png', fullPage: true })
  await layoutPicker.getByRole('button', { name: /图文并排/ }).click()

  await expect(page.locator('.slide-thumb')).toHaveCount(6)
  await expect(page.locator('.canvas-workspace .slide-surface')).toContainText('让图片承担一半表达')
  await expect(page.locator('.canvas-workspace .image-placeholder')).toBeVisible()

  await page.getByRole('button', { name: /深夜蓝图/ }).click()
  await expect(page.locator('.canvas-workspace .slide-surface')).toHaveCSS('background-color', 'rgb(17, 24, 32)')

  await page.getByRole('button', { name: '添加矩形' }).click()
  const selectedShape = page.locator('.canvas-workspace .slide-element.selected')
  await expect(selectedShape.locator('.shape-label')).toContainText('双击添加文字')
  const shapeText = page.locator('.inspector textarea')
  await shapeText.fill('形状也可以直接承载观点')
  await expect(selectedShape.locator('.shape-label')).toContainText('双击添加文字')
  await shapeText.blur()
  await expect(selectedShape.locator('.shape-label')).toContainText('形状也可以直接承载观点')
  await page.screenshot({ path: '/tmp/plaindeck-layout-theme-shape.png', fullPage: true })
})

test('presents the five-page onboarding story in order', async ({ page }) => {
  await page.goto('./')
  const expected = ['PlainDeck · Make the idea visible.', '每一页只负责一个值得记住的观点', '让叙事拥有清楚的骨架', '让视觉承担一半表达', '结束在决定']
  const thumbnails = page.locator('.slide-thumb')
  for (let index = 0; index < expected.length; index += 1) {
    await thumbnails.nth(index).click()
    await expect(page.locator('.canvas-workspace .slide-surface')).toContainText(expected[index])
    await page.locator('.canvas-workspace').screenshot({ path: `/tmp/plaindeck-slide-${index + 1}.png` })
  }
})
