import { expect, test } from '@playwright/test'

test('edits the sample deck and uses history', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('./')
  await expect(page.getByRole('banner').getByText('PlainDeck', { exact: true })).toBeVisible()
  await expect(page.locator('.slide-thumb')).toHaveCount(5)
  await expect(page.locator('.canvas-label strong')).toHaveText('一句话看懂')
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

test('opens presentation and export surfaces', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '演示' }).click()
  await expect(page.getByRole('dialog', { name: '演示模式' })).toBeVisible()
  await page.getByRole('button', { name: /退出/ }).click()
  await page.getByRole('button', { name: /导出/ }).click()
  await expect(page.getByText('Take the deck with you.')).toBeVisible()
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
  await page.locator('.inspector textarea').fill('形状也可以直接承载观点')
  await expect(selectedShape.locator('.shape-label')).toContainText('形状也可以直接承载观点')
  await page.screenshot({ path: '/tmp/plaindeck-layout-theme-shape.png', fullPage: true })
})

test('presents the five-page onboarding story in order', async ({ page }) => {
  await page.goto('./')
  const expected = ['像 PPT 一样编辑', '给人、AI 和 Git', '第一次使用，只要四步', '为什么不直接用 PPTX', 'PlainDeck 适合你吗']
  const thumbnails = page.locator('.slide-thumb')
  for (let index = 0; index < expected.length; index += 1) {
    await thumbnails.nth(index).click()
    await expect(page.locator('.canvas-workspace .slide-surface')).toContainText(expected[index])
    await page.locator('.canvas-workspace').screenshot({ path: `/tmp/plaindeck-slide-${index + 1}.png` })
  }
})
