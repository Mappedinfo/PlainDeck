import { expect, test } from '@playwright/test'

test('edits the sample deck and uses history', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('./')
  await expect(page.getByRole('banner').getByText('PlainDeck', { exact: true })).toBeVisible()
  await expect(page.locator('.slide-thumb')).toHaveCount(5)
  await expect(page.locator('.canvas-label strong')).toHaveText('一句话看懂')
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
