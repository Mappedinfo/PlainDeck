import { expect, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { createDeckTemplate, PROJECT_PATHS } from 'plaindeck/core'

test.use({ locale: 'zh-CN' })

async function expectFittedEditor(page: Page) {
  await expect.poll(async () => page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>('.canvas-scroller')!
    const canvas = document.querySelector<HTMLElement>('.canvas-sized')!.getBoundingClientRect()
    const viewport = scroller.getBoundingClientRect()
    const style = getComputedStyle(scroller)
    const thumb = document.querySelector('.thumb-crop .slide-surface')!.getBoundingClientRect()
    const crop = document.querySelector('.thumb-crop')!.getBoundingClientRect()
    const list = document.querySelector<HTMLElement>('.slide-list')!
    const shell = document.querySelector('.workspace')!.getBoundingClientRect()
    return {
      canvasFits: canvas.width > 0 && canvas.height > 0 && canvas.left >= viewport.left && canvas.top >= viewport.top && canvas.right <= viewport.right - parseFloat(style.paddingRight) + 1 && canvas.bottom <= viewport.bottom - parseFloat(style.paddingBottom) + 1,
      thumbnailFits: Math.abs(thumb.width - crop.width) < .3 && Math.abs(thumb.height - crop.height) < .3,
      sidebarFits: list.scrollWidth <= list.clientWidth,
      workspaceFits: shell.left >= 0 && shell.right <= innerWidth + 1,
    }
  })).toEqual({ canvasFits: true, thumbnailFits: true, sidebarFits: true, workspaceFits: true })
}

test('keeps the complete canvas and thumbnails fitted while resizing to small viewports', async ({ page }) => {
  await page.goto('./')
  for (const viewport of [{ width: 1440, height: 900 }, { width: 900, height: 700 }, { width: 620, height: 500 }, { width: 510, height: 432 }, { width: 360, height: 640 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await expectFittedEditor(page)
    if (viewport.width === 510) await page.screenshot({ path: '/tmp/plaindeck-responsive-510.png', animations: 'disabled' })
  }
  // Manual zoom continues to work, and resizing recalculates the fit.
  const initialWidth = (await page.locator('.canvas-sized').boundingBox())!.width
  await page.getByRole('slider', { name: '画布缩放' }).press('ArrowRight')
  await expect.poll(async () => (await page.locator('.canvas-sized').boundingBox())!.width).toBeGreaterThan(initialWidth)
  await page.setViewportSize({ width: 360, height: 432 })
  await expectFittedEditor(page)
  await expect.poll(async () => Number(await page.getByRole('slider', { name: '画布缩放' }).inputValue())).toBeLessThan(20)
})

test('fits custom portrait and wide canvases without cropping their thumbnails', async ({ page }) => {
  await page.setViewportSize({ width: 510, height: 432 })
  await page.goto('./')
  for (const canvas of [{ width: 900, height: 1600 }, { width: 2400, height: 600 }]) {
    const document = createDeckTemplate('blank')
    document.deck.canvas = canvas
    document.slides[document.deck.slides[0]].elements = []
    const zip = new JSZip()
    zip.file(PROJECT_PATHS.deck, JSON.stringify(document.deck))
    zip.file(document.deck.theme, JSON.stringify(document.theme))
    for (const path of document.deck.slides) zip.file(path, JSON.stringify(document.slides[path]))
    await page.locator('input[type="file"][accept=".zip,application/zip"]').setInputFiles({ name: 'custom-canvas.zip', mimeType: 'application/zip', buffer: await zip.generateAsync({ type: 'nodebuffer' }) })
    await expect(page.locator('.slide-thumb')).toHaveCount(1)
    await expectFittedEditor(page)
    const crop = (await page.locator('.thumb-crop').boundingBox())!
    expect(crop.width / crop.height).toBeCloseTo(canvas.width / canvas.height, 2)
  }
})

test('keeps save and zoom controls visible and exposes secondary status details on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 510, height: 432 })
  await page.goto('./')
  const footer = page.locator('.statusbar')
  await expect(footer.locator('.save-pill')).toContainText('演示项目')
  const details = footer.getByRole('button', { name: '项目信息与链接' })
  await expect(details).toBeVisible()
  await details.click()
  await expect(footer.getByRole('link', { name: '在 GitHub 查看 PlainDeck 源码' })).toBeVisible()
  await expect(footer).toContainText('1600 × 900')
  await page.keyboard.press('Escape')
  await expect(details).toBeFocused()
  for (const width of [510, 360]) {
    await page.setViewportSize({ width, height: 432 })
    await expectFittedEditor(page)
    const bounds = (await footer.boundingBox())!
    for (const selector of ['.save-pill', '.status-more', '.status-zoom']) {
      const element = (await footer.locator(selector).boundingBox())!
      expect(element.x).toBeGreaterThanOrEqual(bounds.x)
      expect(element.x + element.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
      expect(element.y + element.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1)
    }
    expect(await footer.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
  await page.locator('input[type="file"][accept=".zip,application/zip"]').setInputFiles({ name: 'broken.zip', mimeType: 'application/zip', buffer: Buffer.from('invalid zip') })
  await expect(footer.locator('.save-pill')).toContainText('保存失败')
  await expect(footer.locator('.status-error')).toBeVisible()
  await expect(footer.getByRole('slider', { name: '画布缩放' })).toBeVisible()
  expect(await footer.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.screenshot({ path: '/tmp/plaindeck-responsive-error-360.png', animations: 'disabled' })
})
