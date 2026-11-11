import { expect, test } from '@playwright/test'

test.use({ locale: 'zh-CN', viewport: { width: 1512, height: 982 } })

test('links layer selection, group movement, ordering and canvas view controls', async ({ page }) => {
  await page.goto('./')
  const canvas = page.locator('.editor-surface')
  const title = canvas.locator('[data-element-id="title"]')
  const accent = canvas.locator('[data-element-id="accent-rule"]')
  const layer = (id: string) => page.locator(`[data-layer-id="${id}"] .element-select`)
  const box = (id: string) => canvas.locator(`[data-element-id="${id}"]`).evaluate(node => {
    const style = (node as HTMLElement).style
    return { x: parseFloat(style.left), y: parseFloat(style.top) }
  })

  await layer('title').click()
  await layer('accent-rule').click({ modifiers: ['Shift'] })
  await expect(canvas.locator('.selected')).toHaveCount(2)
  const before = [await box('title'), await box('accent-rule')]
  const start = (await accent.boundingBox())!
  const x = start.x + start.width / 2, y = start.y + start.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 53, y + 32, { steps: 8 })
  await page.mouse.up()
  const after = [await box('title'), await box('accent-rule')]
  expect(after[0].x).toBeGreaterThan(before[0].x)
  expect(after[0].y).toBeGreaterThan(before[0].y)
  expect(after[0].x - after[1].x).toEqual(before[0].x - before[1].x)
  expect(after[0].y - after[1].y).toEqual(before[0].y - before[1].y)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect.poll(async () => [await box('title'), await box('accent-rule')]).toEqual(before)

  await layer('title').click()
  const rows = page.locator('.element-list .element-row')
  const beforeOrder = await rows.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.layerId))
  const titleIndex = beforeOrder.indexOf('title')
  const targetIndex = titleIndex === 0 ? 1 : titleIndex - 1
  const other = beforeOrder[targetIndex]!
  const target = page.locator(`[data-layer-id="${other}"]`)
  const grip = page.locator('[data-layer-id="title"] .layer-grip')
  const from = (await grip.boundingBox())!, to = (await target.boundingBox())!
  const targetY = titleIndex === 0 ? to.y + to.height - 3 : to.y + 3
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + 26, targetY, { steps: 12 })
  await page.mouse.move(to.x + 30, targetY)
  await page.mouse.up()
  await expect(rows.nth(targetIndex)).toHaveAttribute('data-layer-id', 'title')
  await expect(title).toHaveClass(/selected/)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect.poll(() => rows.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.layerId))).toEqual(beforeOrder)

  const workspace = page.locator('.canvas-workspace')
  const initial = (await canvas.boundingBox())!
  await layer('title').click()
  await page.keyboard.press('Shift+Digit2')
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeGreaterThan(initial.width)
  const elementRect = (await title.boundingBox())!, viewRect = (await workspace.boundingBox())!
  expect(Math.abs(elementRect.x + elementRect.width / 2 - (viewRect.x + viewRect.width / 2))).toBeLessThan(3)
  await page.keyboard.press('Shift+Digit1')
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeCloseTo(initial.width, 0)

  const centerX = initial.x + initial.width * .65, centerY = initial.y + initial.height * .6
  await page.mouse.move(centerX, centerY)
  await page.keyboard.down('Space')
  await page.mouse.down()
  await page.mouse.move(centerX + 48, centerY + 35, { steps: 6 })
  await page.mouse.up()
  await page.keyboard.up('Space')
  await expect.poll(async () => (await canvas.boundingBox())!.x).toBeCloseTo(initial.x + 48, 0)
  expect(await box('title')).toEqual(before[0])
  await page.getByRole('button', { name: '适应整页' }).click()
  await expect.poll(async () => (await canvas.boundingBox())!.x).toBeCloseTo(initial.x, 0)
})

test('mounts every print page on demand and releases it afterwards', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      document.body.dataset.printed = String(document.querySelectorAll('.print-deck .print-page').length)
      window.dispatchEvent(new Event('afterprint'))
    }
  })
  await page.goto('./')
  await expect(page.locator('.slide-thumb')).toHaveCount(7)
  await expect(page.locator('.print-deck')).toHaveCount(0)
  await page.keyboard.press('Control+p')
  await expect(page.locator('body')).toHaveAttribute('data-printed', '7')
  await expect(page.locator('.print-deck')).toHaveCount(0)
})
