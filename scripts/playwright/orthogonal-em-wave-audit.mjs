#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/orthogonal-em-wave-audit')
await mkdir(outputDir, { recursive: true })
const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4179',
  env: process.env,
})

await runWithManagedViteServer({ rootDir, baseUrl, devPort, logPath: path.join(outputDir, 'vite-dev.log') }, async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
  })
  const errors = []
  const watch = (page, name) => {
    page.on('pageerror', (error) => errors.push(name + ' pageerror: ' + error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(name + ' console: ' + message.text()) })
  }
  const region = (page, name) => page.getByRole('region', { name })
  const assertInside = async (page, testId, width) => {
    const box = await page.getByTestId(testId).boundingBox()
    if (!box || box.x < 0 || box.x + box.width > width) {
      throw new Error(testId + ' leaves the ' + width + 'px viewport: ' + JSON.stringify(box))
    }
  }
  const assertPanelBounds = async (page, width, height) => {
    const panels = await page.evaluate(() => Array.from(document.querySelectorAll('.floating-panel')).map((el) => {
      const box = el.getBoundingClientRect()
      return { name: el.getAttribute('aria-label'), left: box.left, right: box.right, top: box.top, bottom: box.bottom }
    }))
    const outside = panels.filter((panel) => panel.left < 0 || panel.right > width || panel.top < 0 || panel.bottom > height)
    if (outside.length) throw new Error('Floating panels leave the ' + width + 'x' + height + ' viewport: ' + JSON.stringify(outside))
  }
  const assertSeparated = async (page) => {
    const data = await region(page, '数据').boundingBox()
    const chart = await region(page, '图表').boundingBox()
    if (!data || !chart) throw new Error('Expanded data and chart panels must both be measurable')
    const overlapX = Math.min(data.x + data.width, chart.x + chart.width) - Math.max(data.x, chart.x)
    const overlapY = Math.min(data.y + data.height, chart.y + chart.height) - Math.max(data.y, chart.y)
    if (overlapX > 1 && overlapY > 1) throw new Error('Data/chart panels overlap by ' + overlapX.toFixed(1) + 'x' + overlapY.toFixed(1) + 'px')
  }
  const setRange = async (page, selector, target) => {
    const input = page.locator(selector)
    await input.focus()
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const current = Number(await input.inputValue())
      if (current === target) break
      await input.press(current < target ? 'ArrowRight' : 'ArrowLeft')
      await page.waitForTimeout(100)
    }
    const current = Number(await input.inputValue())
    if (current !== target) throw new Error(selector + ' expected ' + target + ', got ' + current)
  }

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    watch(desktop, 'desktop')
    await desktop.goto(baseUrl + '/orthogonal-em-wave', { waitUntil: 'domcontentloaded' })
    await desktop.locator('canvas').waitFor({ state: 'visible' })
    await desktop.locator('[data-testid="orthogonal-em-wave-title"]').waitFor()
    for (const name of ['数据', '图表', '播放控制']) {
      if (!(await region(desktop, name).getByRole('button', { name: '展开' }).isVisible())) {
        throw new Error(name + ' panel must start collapsed to preserve the 3D field view')
      }
    }
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-3d-initial.png'), fullPage: true })

    await region(desktop, '数据').getByRole('button', { name: '展开' }).click()
    await setRange(desktop, '#orthogonal-em-wave-wavelength', 6)
    const fields = desktop.getByTestId('orthogonal-em-wave-fields')
    if (await fields.innerText() !== '0.87 / 0.87 a.u.') throw new Error('Rightward wave must have aligned E and B field components at the probe: ' + await fields.innerText())
    await desktop.getByRole('radio', { name: '向左传播' }).click()
    if (await fields.innerText() !== '-0.87 / 0.87 a.u.') throw new Error('Leftward wave must reverse B relative to E at fixed axes: ' + await fields.innerText())

    await region(desktop, '图表').getByRole('button', { name: '展开' }).click()
    if (!(await desktop.getByRole('img', { name: '电磁波电场与磁场空间分布图' }).isVisible())) throw new Error('The field profile chart must expand')
    await assertSeparated(desktop)
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-open-panels-leftward.png'), fullPage: true })

    const playback = region(desktop, '播放控制')
    await playback.getByRole('button', { name: '展开' }).click()
    await playback.getByRole('button', { name: '开始传播' }).click()
    if (!(await playback.getByRole('button', { name: '暂停传播' }).isVisible())) throw new Error('Starting the field propagation should offer a pause action')
    await desktop.waitForTimeout(250)
    const chartStatus = await desktop.locator('.orthogonal-em-wave-chart-heading span').innerText()
    if (!chartStatus.includes('传播中')) throw new Error('The field chart should reflect the running state')
    await playback.getByRole('button', { name: '暂停传播' }).click()
    await desktop.waitForTimeout(150)
    if (!(await desktop.locator('.orthogonal-em-wave-chart-heading span').innerText()).includes('已暂停')) throw new Error('Pausing should stop the displayed phase clock')

    const views = [
      ['xy', 'XY 侧视（看 E）'],
      ['xz', 'XZ 俯视（看 B）'],
      ['yz', 'YZ 正视（波阵面）'],
      ['3d', '3D 空间立体'],
    ]
    for (const [key, name] of views) {
      await desktop.getByRole('radio', { name }).click()
      await desktop.waitForTimeout(180)
      if (await desktop.getByRole('radio', { name }).getAttribute('aria-checked') !== 'true') throw new Error(name + ' did not become the active view')
      if (key === 'yz') {
        if (!(await desktop.getByTestId('orthogonal-em-wave-direction-symbol').isVisible())) throw new Error('YZ view must encode propagation toward/away from the observer')
        if (await desktop.getByTestId('orthogonal-em-wave-axis-label').count()) throw new Error('YZ view must not show the collapsed x-axis label')
        if (!(await desktop.getByText('Eᵧ').isVisible()) || !(await desktop.getByText('B_z').isVisible())) throw new Error('YZ view must identify the two transverse field axes')
      } else {
        await assertInside(desktop, 'orthogonal-em-wave-axis-label', 1440)
      }
      await desktop.screenshot({ path: path.join(outputDir, 'desktop-' + key + '.png'), fullPage: true })
    }

    const tablet = await browser.newPage({ viewport: { width: 768, height: 900 } })
    watch(tablet, 'tablet')
    await tablet.goto(baseUrl + '/orthogonal-em-wave', { waitUntil: 'domcontentloaded' })
    await tablet.locator('canvas').waitFor({ state: 'visible' })
    await tablet.waitForTimeout(200)
    if (await tablet.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error('The 768px tablet layout must not overflow horizontally')
    if (await tablet.getByTestId('orthogonal-em-wave-title').count() !== 0) {
      throw new Error('The compact desktop layout should hide the canvas title that would be covered by the controls and floating panels')
    }
    if (!(await tablet.getByText('正交电磁波模型', { exact: true }).isVisible())) {
      throw new Error('The compact desktop layout should retain the scene name in the controls sidebar')
    }
    await tablet.screenshot({ path: path.join(outputDir, 'tablet-initial.png'), fullPage: true })
    await region(tablet, '数据').getByRole('button', { name: '展开' }).click()
    await region(tablet, '图表').getByRole('button', { name: '展开' }).click()
    await tablet.waitForTimeout(180)
    await assertSeparated(tablet)
    await assertPanelBounds(tablet, 768, 900)
    await tablet.screenshot({ path: path.join(outputDir, 'tablet-open-panels.png'), fullPage: true })

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    watch(mobile, 'mobile')
    await mobile.goto(baseUrl + '/orthogonal-em-wave', { waitUntil: 'domcontentloaded' })
    await mobile.locator('canvas').waitFor({ state: 'visible' })
    await mobile.waitForTimeout(250)
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error('The mobile scene must not overflow horizontally')
    await assertInside(mobile, 'orthogonal-em-wave-title', 390)
    await assertInside(mobile, 'orthogonal-em-wave-e-label', 390)
    await assertInside(mobile, 'orthogonal-em-wave-b-label', 390)
    await assertInside(mobile, 'orthogonal-em-wave-axis-label', 390)
    const title = await mobile.getByTestId('orthogonal-em-wave-title').boundingBox()
    const eLabel = await mobile.getByTestId('orthogonal-em-wave-e-label').boundingBox()
    if (title && eLabel && title.x < eLabel.x + eLabel.width && title.x + title.width > eLabel.x && title.y < eLabel.y + eLabel.height && title.y + title.height > eLabel.y) {
      throw new Error('The mobile 3D title and E label overlap')
    }
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-3d-initial.png'), fullPage: true })
    await mobile.getByRole('radio', { name: 'YZ 正视（波阵面）' }).click()
    await mobile.waitForTimeout(180)
    await assertInside(mobile, 'orthogonal-em-wave-direction-symbol', 390)
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-yz.png'), fullPage: true })

    if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '))
    console.log('Orthogonal EM wave desktop/tablet/mobile layout, field signs, four camera modes, YZ propagation markers, panel separation, pause/start, and browser-error checks passed. Artifacts: ' + outputDir)
  } finally {
    await browser.close()
  }
})
