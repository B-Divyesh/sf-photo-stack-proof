import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const matchingFiles = (stem = 'IMG_0042') => [
  { name: `${stem}.xmp`, mimeType: 'application/xml', buffer: Buffer.from('<x:ContentIdentifier>95E80A17-5BF2-4055-8464-DF40C0CE9434</x:ContentIdentifier>') },
  { name: `${stem}.json`, mimeType: 'application/json', buffer: Buffer.from('{"ContentIdentifier":"95E80A17-5BF2-4055-8464-DF40C0CE9434"}') },
]

async function analyzeMatchingFiles(page: import('@playwright/test').Page, stem = 'IMG_0042'): Promise<void> {
  await page.locator('#file-input').setInputFiles(matchingFiles(stem))
  await expect(page.getByText('Inspection complete: 1 candidate group found.')).toBeVisible()
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
}

test('loads cleanly with required semantics and no serious accessibility issues', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle('Photo Stack Proof — verify photo stacks')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([])
  expect(errors).toEqual([])
})

test('@claim:local-analysis reads selected image, video, and sidecar evidence in the browser', async ({ page }) => {
  await page.goto('/')
  await page.locator('#file-input').setInputFiles([
    { name: 'IMG_8001.xmp', mimeType: 'application/xml', buffer: Buffer.from('<x:ContentIdentifier>0F01C5F2-ABBA-49AA-83F6-57C876710ABC</x:ContentIdentifier>') },
    { name: 'IMG_8001.mov', mimeType: 'video/quicktime', buffer: Buffer.from('ContentIdentifier=0F01C5F2-ABBA-49AA-83F6-57C876710ABC') },
    { name: 'RAW_8002.dng', mimeType: 'image/x-adobe-dng', buffer: Buffer.from('not a camera file') },
    { name: 'RAW_8002.xmp', mimeType: 'application/xml', buffer: Buffer.from('<x:ContentIdentifier>FACE1234-ABCD-4ABC-8DEF-1234567890AB</x:ContentIdentifier>') },
  ])
  await expect(page.getByText('Inspection complete: 2 candidate groups found.')).toBeVisible()
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
  await expect(page.locator('.proof-group.ambiguous')).toHaveCount(1)
  await page.locator('.proof-group.verified summary').click()
  await expect(page.getByRole('heading', { name: 'IMG_8001.mov' })).toBeVisible()
  await expect(page.locator('.evidence-file').filter({ hasText: 'IMG_8001.mov' })).toContainText('video')
})

test('@claim:classification labels verified, ambiguous, and conflict groups from sample evidence', async ({ page }) => {
  await page.goto('/demo')
  await expect(page).toHaveTitle('Demo — Photo Stack Proof')
  await expect(page.getByText('Demo — sample data, nothing is saved to your real report.')).toBeVisible()
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
  await expect(page.locator('.proof-group.ambiguous')).toHaveCount(1)
  await expect(page.locator('.proof-group.conflict')).toHaveCount(1)
  await expect(page.locator('.proof-group.conflict')).toContainText('Do not stack this group.')
})

test('@claim:selected-files-remain-unchanged leaves selected source files byte-for-byte unchanged', async ({ page }, testInfo) => {
  const firstPath = testInfo.outputPath('IMG_0050.xmp')
  const secondPath = testInfo.outputPath('IMG_0050.json')
  const first = Buffer.from('<x:ContentIdentifier>A56B6B76-ED83-4A2B-8A09-FCFECD2D1234</x:ContentIdentifier>')
  const second = Buffer.from('{"ContentIdentifier":"A56B6B76-ED83-4A2B-8A09-FCFECD2D1234"}')
  await writeFile(firstPath, first)
  await writeFile(secondPath, second)
  await page.goto('/')
  await page.locator('#file-input').setInputFiles([firstPath, secondPath])
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
  expect(await readFile(firstPath)).toEqual(first)
  expect(await readFile(secondPath)).toEqual(second)
})

test('@claim:local-privacy makes no cross-origin request during the sample workflow', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/demo')
  await expect(page.locator('.proof-group')).toHaveCount(3)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export review CSV' }).click()
  await download
  const pageOrigin = new URL(page.url()).origin
  expect(requests.filter((url) => url.startsWith('http')).every((url) => new URL(url).origin === pageOrigin)).toBe(true)
})

test('@claim:exports downloads CSV rows and a complete JSON report', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.locator('.proof-group')).toHaveCount(3)
  const csvDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export review CSV' }).click()
  const csv = await readFile((await (await csvDownload).path())!, 'utf8')
  expect(csv.split('\r\n')[0]).toBe('"group","verdict","reason","file","path","type","size_bytes","content_ids","captured_at","timestamp_source","warnings"')
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(7)
  const jsonDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const exported = JSON.parse(await readFile((await (await jsonDownload).path())!, 'utf8')) as { groups: unknown[] }
  expect(exported.groups).toHaveLength(3)
})

test('@claim:local-persistence restores an analysis after a refresh', async ({ page }) => {
  await page.goto('/')
  await analyzeMatchingFiles(page)
  await page.reload()
  await expect(page.locator('#analysis-status')).toContainText('Restored your latest local report.')
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
})

test('@claim:offline-reload works offline after the first visit in its own browser context', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Verify photo stacks before importing')
    await expect(page.locator('#network-state')).toContainText('Offline')
  } finally {
    await context.close()
  }
})

test('@claim:paid-archive restores a valid license and saves a named local snapshot', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/photo-stack-proof/verify?license=paid-test-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Have a license? Restore it' }).click()
  await page.locator('#license-token').fill('paid-test-token')
  await page.getByRole('button', { name: 'Verify license' }).click()
  await expect(page.getByText('Proof Archive is unlocked.')).toBeVisible()
  await analyzeMatchingFiles(page)
  page.once('dialog', (dialog) => dialog.accept('August migration check'))
  await page.getByRole('button', { name: 'Save current report' }).click()
  await expect(page.getByText('August migration check')).toBeVisible()
})

test('demo reset and clear never affect a real report', async ({ page }) => {
  await page.goto('/')
  await analyzeMatchingFiles(page)
  await page.goto('/demo')
  await expect(page.locator('.proof-group')).toHaveCount(3)
  await page.getByRole('button', { name: 'Clear this demo report' }).click()
  await expect(page.locator('#analysis-status')).toContainText('Your real report was not changed.')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('.proof-group')).toHaveCount(3)
  await page.getByRole('link', { name: 'Start for real' }).first().click()
  await expect(page).toHaveURL('/')
  await expect(page.locator('#analysis-status')).toContainText('Restored your latest local report.')
  await expect(page.locator('.proof-group.verified')).toHaveCount(1)
})

test('@claim:camera-corpus separates the 100-group labelled iPhone, RAW, and QuickTime corpus conservatively', async ({ page }) => {
  const sources = [
    { fixture: 'sf-photo-stack-proof-iphone7.jpg', extension: 'jpg' },
    { fixture: 'sf-photo-stack-proof-canon.cr2', extension: 'cr2' },
    { fixture: 'sf-photo-stack-proof-canon.dng', extension: 'dng' },
    { fixture: 'sf-photo-stack-proof-panasonic.rw2', extension: 'rw2' },
    { fixture: 'sf-photo-stack-proof-quicktime.mov', extension: 'mov' },
  ]
  const fixtures = await Promise.all(sources.map(async (source) => ({
    ...source,
    buffer: await readFile(resolve(process.cwd(), 'tests/fixtures/camera-corpus', source.fixture)),
  })))
  const files: Array<{ name: string; mimeType: string; buffer: Buffer }> = []
  for (let index = 0; index < 100; index += 1) {
    const source = fixtures[index % fixtures.length]
    const stem = `COLLISION_${String(index + 1).padStart(3, '0')}`
    const firstId = `corpus-proof-${String(index + 1).padStart(3, '0')}-a`
    const secondId = index < 90 ? `corpus-proof-${String(index + 1).padStart(3, '0')}-b` : firstId
    files.push(
      { name: `${stem}.${source.extension}`, mimeType: 'application/octet-stream', buffer: source.buffer },
      { name: `${stem}.xmp`, mimeType: 'application/xml', buffer: Buffer.from(`<x:ContentIdentifier>${firstId}</x:ContentIdentifier>`) },
      { name: `${stem}.json`, mimeType: 'application/json', buffer: Buffer.from(`{"ContentIdentifier":"${secondId}"}`) },
    )
  }
  await page.goto('/')
  await page.locator('#file-input').setInputFiles(files)
  await expect(page.getByText('Inspection complete: 100 candidate groups found.')).toBeVisible()
  await expect(page.locator('.proof-group.conflict')).toHaveCount(90)
  await expect(page.locator('.proof-group.verified')).toHaveCount(10)
  await expect(page.locator('.proof-group.ambiguous')).toHaveCount(0)

  for (const [groupName, extension, year] of [['COLLISION_001', 'jpg', '2016'], ['COLLISION_002', 'cr2', '2005'], ['COLLISION_003', 'dng', '2005'], ['COLLISION_004', 'rw2', '2008']] as const) {
    const group = page.locator('.proof-group').filter({ hasText: groupName })
    await group.locator('summary').click()
    const file = group.locator('.evidence-file').filter({ hasText: `.${extension}` })
    await expect(file).toContainText('DateTimeOriginal')
    await expect(file).toContainText(year)
  }
  const videoGroup = page.locator('.proof-group').filter({ hasText: 'COLLISION_005' })
  await videoGroup.locator('summary').click()
  const videoFile = videoGroup.locator('.evidence-file').filter({ hasText: '.mov' })
  await expect(videoFile.locator('dt').filter({ hasText: 'Captured' }).locator('xpath=following-sibling::dd[1]')).toHaveText('Not found')
})

test('rejects the exact malformed v1-shaped import without replacing a good report across reload', async ({ page }) => {
  await page.goto('/')
  await analyzeMatchingFiles(page)
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
})

test('shows metadata read errors in the visible evidence report', async ({ page }) => {
  await page.goto('/')
  await page.locator('#file-input').setInputFiles([
    { name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a JPEG container') },
    { name: 'broken.mov', mimeType: 'video/quicktime', buffer: Buffer.from('not a QuickTime container') },
  ])
  await expect(page.locator('.proof-group.ambiguous')).toHaveCount(1)
  await expect(page.locator('.evidence-file').filter({ hasText: 'broken.jpg' })).toContainText('Read notes')
  await expect(page.locator('.evidence-file').filter({ hasText: 'broken.jpg' })).toContainText('Metadata could not be read')
})

test('routes have page-specific titles, legal headings, and a styled not-found view', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page).toHaveTitle('Privacy — Photo Stack Proof')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy, in plain language')
  await page.goto('/terms')
  await expect(page).toHaveTitle('Terms — Photo Stack Proof')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of use')
  await page.goto('/not-a-real-page')
  await expect(page).toHaveTitle('Page not found — Photo Stack Proof')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  await expect(page.getByRole('link', { name: 'Open Photo Stack Proof' })).toBeVisible()
})

test('supports keyboard skip navigation, reduced motion, and a 390px viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, transition: getComputedStyle(document.querySelector('.button')!).transitionDuration }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
  expect(Number.parseFloat(dimensions.transition)).toBeLessThanOrEqual(0.01)
})

test('privacy route has one main heading and passes serious axe checks', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.locator('h1')).toHaveCount(1)
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([])
})

test('demo, terms, and the static 404 page pass serious axe checks', async ({ page }) => {
  for (const route of ['/demo', '/terms', '/404.html']) {
    await page.goto(route)
    await expect(page.locator('h1')).toHaveCount(1)
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([])
  }
})
