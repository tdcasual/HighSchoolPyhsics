#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/cyclotron-core-audit')
await mkdir(outputDir, { recursive: true })
const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4176',
  env: process.env,
})

await runWithManagedViteServer({
  rootDir,
  baseUrl,
  devPort,
  logPath: path.join(outputDir, 'vite-dev.log'),
}, async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
  })
  const errors = []
  const collectErrors = (page, prefix) => {
    page.on('pageerror', (error) => errors.push(`${prefix} pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`${prefix} console: ${message.text()}`)
    })
  }
  const region = (page, name) => page.getByRole('region', { name })
  const setRange = async (page, selector, key) => {
    const input = page.locator(selector)
    await input.focus()
    await input.press(key)
    await page.waitForTimeout(60)
    await input.dispatchEvent('pointerup')
  }

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    collectErrors(desktop, 'desktop')
    await desktop.goto(`${baseUrl}/cyclotron-core`, { waitUntil: 'domcontentloaded' })
    await desktop.locator('.cyclotron-core-controls h2').waitFor()
    await desktop.locator('canvas').waitFor({ state: 'visible' })
    const desktopRfLabel = await desktop.getByText(/高频交流电源 U~/).boundingBox()
    if (!desktopRfLabel || desktopRfLabel.x < 0 || desktopRfLabel.x + desktopRfLabel.width > 1428) {
      throw new Error('The desktop RF supply label must fit inside the scene viewport')
    }

    for (const name of ['数据', '图表', '播放控制']) {
      if (!(await region(desktop, name).getByRole('button', { name: '展开' }).isVisible())) {
        throw new Error(`${name} must start collapsed to keep the Dee apparatus visible`)
      }
    }
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-default.png'), fullPage: true })
    await desktop.locator('canvas').screenshot({ path: path.join(outputDir, 'desktop-default-canvas.png') })

    const data = region(desktop, '数据')
    const playback = region(desktop, '播放控制')
    await data.getByRole('button', { name: '展开' }).click()
    const dataBounds = await data.boundingBox()
    if (!dataBounds || dataBounds.x + dataBounds.width > 685) {
      throw new Error('The expanded data panel must stay to the left of the Dee apparatus')
    }
    await playback.getByRole('button', { name: '展开' }).click()
    if (!(await data.innerText()).includes('0 keV')) throw new Error('The stopped initial particle should start at zero kinetic energy')
    if (await desktop.getByTestId('dee-top-polarity').innerText() !== '-') throw new Error('Initial top Dee polarity should be negative')
    if (await desktop.getByTestId('dee-bottom-polarity').innerText() !== '+') throw new Error('Initial bottom Dee polarity should be positive')

    await desktop.getByRole('button', { name: '开始加速' }).click()
    await desktop.waitForFunction(() => document.querySelector('[data-testid="dee-top-polarity"]')?.textContent === '+', null, { timeout: 4000 })
    await desktop.waitForFunction(() => Number(document.querySelector('[aria-label="数据"]')?.textContent?.match(/加速次数 n\s*(\d+)/)?.[1] ?? 0) > 0, null, { timeout: 6000 })
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-running.png'), fullPage: true })

    await desktop.getByRole('button', { name: '暂停轨迹' }).click()
    if (!(await desktop.getByRole('button', { name: '继续轨迹' }).isVisible())) throw new Error('Pause must freeze and expose a resume action')
    await setRange(desktop, '#cyclotron-core-B', 'Home')
    if (await desktop.locator('#cyclotron-core-B').inputValue() !== '1') throw new Error('Changing B should apply the minimum value')
    if (!(await desktop.getByRole('button', { name: '开始加速' }).isVisible())) throw new Error('Changing a physical parameter should reset and stop the old trajectory')
    await setRange(desktop, '#cyclotron-core-U', 'End')
    if (await desktop.locator('#cyclotron-core-U').inputValue() !== '50') throw new Error('Changing U should apply the maximum value')

    await desktop.getByRole('button', { name: '开始加速' }).click()
    try {
      await desktop.locator('.cyclotron-core-status.extracted').waitFor({ state: 'visible', timeout: 10000 })
    } catch {
      throw new Error('Particle did not reach extraction: B=' + await desktop.locator('#cyclotron-core-B').inputValue() + ', U=' + await desktop.locator('#cyclotron-core-U').inputValue() + ', data=' + await data.innerText() + ', actions=' + await playback.innerText())
    }
    const ejected = playback.locator('button').filter({ hasText: '已射出' })
    if (!(await ejected.isDisabled())) throw new Error('An extracted particle must stop and require reset')
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-extracted.png'), fullPage: true })
    await desktop.getByRole('button', { name: '重置参数' }).click()

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    collectErrors(mobile, 'mobile')
    await mobile.goto(`${baseUrl}/cyclotron-core`, { waitUntil: 'domcontentloaded' })
    await mobile.locator('.cyclotron-core-controls h2').waitFor()
    await mobile.locator('canvas').waitFor({ state: 'visible' })
    await mobile.waitForTimeout(300)
    const mobileRfLabel = mobile.getByText('高频交流电源 U~ = 30 kV')
    const mobileRfBox = await mobileRfLabel.boundingBox()
    if (!mobileRfBox || mobileRfBox.x < 0 || mobileRfBox.x + mobileRfBox.width > 390) {
      await mobile.screenshot({ path: path.join(outputDir, 'mobile-rf-debug.png'), fullPage: true })
      throw new Error('The entire RF supply label must fit in the 390px mobile viewport')
    }
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) {
      throw new Error('Mobile cyclotron scene overflows horizontally at 390px')
    }
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-default.png'), fullPage: true })

    if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`)
    console.log(`Cyclotron-core desktop/mobile apparatus, initial polarity, RF reversal, pause/reset, qB/m animation, and extraction checks passed. Artifacts: ${outputDir}`)
  } finally {
    await browser.close()
  }
})
