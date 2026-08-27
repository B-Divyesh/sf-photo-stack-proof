import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('loads cleanly with required semantics and no serious accessibility issues', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle(/Photo Stack Proof/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('img[alt]')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Choose a folder', exact: true })).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([])
  expect(errors).toEqual([])
})

test('analyzes matching local sidecars and exports the review CSV', async ({ page }) => {
  await page.goto('/')
  await page.locator('#file-input').setInputFiles([
    { name: 'IMG_0042.xmp', mimeType: 'application/xml', buffer: Buffer.from('<x:ContentIdentifier>95E80A17-5BF2-4055-8464-DF40C0CE9434</x:ContentIdentifier>') },
    { name: 'IMG_0042.json', mimeType: 'application/json', buffer: Buffer.from('{"ContentIdentifier":"95E80A17-5BF2-4055-8464-DF40C0CE9434"}') },
  ])
  await expect(page.getByText('Inspection complete: 1 candidate group found.')).toBeVisible()
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
  await expect(page.getByText('A matching content identifier appears in at least two files.')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export review CSV' }).click()
  expect((await download).suggestedFilename()).toMatch(/photo-stack-proof-.*\.csv/)
})

test('rejects the exact malformed v1-shaped import without replacing a good report across reload', async ({ page }) => {
  await page.goto('/')
  await page.locator('#file-input').setInputFiles([
    { name: 'IMG_0042.xmp', mimeType: 'application/xml', buffer: Buffer.from('<x:ContentIdentifier>95E80A17-5BF2-4055-8464-DF40C0CE9434</x:ContentIdentifier>') },
    { name: 'IMG_0042.json', mimeType: 'application/json', buffer: Buffer.from('{"ContentIdentifier":"95E80A17-5BF2-4055-8464-DF40C0CE9434"}') },
  ])
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)

  await page.locator('#report-input').setInputFiles({
    name: 'broken-v1-report.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"createdAt":"not-a-date","groups":[{}]}'),
  })
  await expect(page.locator('#analysis-status')).toContainText('Report import failed.')
  await expect(page.locator('#analysis-status')).toContainText('Your existing local report is still available.')
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)

  await page.reload()
  await expect(page.locator('#analysis-status')).toContainText('Restored your latest local report.')
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
})

test('works offline after the shell is cached', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Same name')
  await expect(page.locator('#network-state')).toContainText('Offline')
})

test('fits a 390px viewport without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('privacy route has one main heading and passes serious axe checks', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy, in plain language')
  await expect(page.locator('h1')).toHaveCount(1)
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([])
})

test('captures, verifies, and stores a returned purchase license', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/photo-stack-proof/verify?license=paid-test-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }))
  await page.goto('/?license=paid-test-token')
  await expect(page).toHaveURL('/')
  await expect(page.getByText('Proof Archive is unlocked.')).toBeVisible()
  await expect(page.locator('#archive')).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem('sb_license:photo-stack-proof'))
  expect(stored).toBe('paid-test-token')
})
