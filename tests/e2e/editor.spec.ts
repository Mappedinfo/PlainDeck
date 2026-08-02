import { expect, test } from '@playwright/test'

test('edits the sample deck and uses history', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('./')
  await expect(page.getByText('PlainDeck', { exact: true })).toBeVisible()
  await expect(page.locator('.slide-thumb')).toHaveCount(2)
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
