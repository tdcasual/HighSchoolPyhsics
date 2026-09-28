#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/ticker-timer-audit')
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
  const boxesOverlap = (left, right) =>
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  const expand = async (page, name) => {
    const panel = region(page, name)
    const button = panel.getByRole('button', { name: '展开' })
    if (await button.count()) await button.click()
    return panel
  }
  const setRange = async (page, selector, value, min, step) => {
    const input = page.locator(selector)
    await input.focus()
    await input.press('Home')
    await page.waitForTimeout(40)
    const increments = Math.round((value - min) / step)
    for (let index = 0; index < increments; index += 1) {
      await input.press('ArrowRight')
      await page.waitForTimeout(35)
    }
    await input.dispatchEvent('pointerup')
    const expected = Number((min + increments * step).toFixed(5))
    await page.waitForFunction(({ selector, expected }) => Number(document.querySelector(selector)?.value) === expected, { selector, expected }, { timeout: 2000 })
  }
  const compareCanvas = async (beforePath, afterPath, label) => {
    const before = PNG.sync.read(await import('node:fs/promises').then(({ readFile }) => readFile(beforePath)))
    const after = PNG.sync.read(await import('node:fs/promises').then(({ readFile }) => readFile(afterPath)))
    if (before.width !== after.width || before.height !== after.height) throw new Error(`${label}: canvas dimensions changed`)
    const changed = pixelmatch(before.data, after.data, null, before.width, before.height, { threshold: 0.1 })
    const percent = (100 * changed / (before.width * before.height)).toFixed(2)
    console.log(`${label}: ${percent}% changed pixels`)
    if (changed < before.width * before.height * 0.01) throw new Error(`${label}: scene did not visibly change`)
  }

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    collectErrors(desktop, 'desktop')
    await desktop.goto(`${baseUrl}/ticker-timer`, { waitUntil: 'domcontentloaded' })
    await desktop.getByRole('heading', { name: '打点计时器控制' }).waitFor({ state: 'visible', timeout: 15000 })
    const canvas = desktop.locator('canvas')
    await canvas.waitFor({ state: 'visible' })
    await desktop.waitForTimeout(500)

    for (const name of ['数据', '图表', '播放控制']) {
      const panel = region(desktop, name)
      if (!(await panel.getByRole('button', { name: '展开' }).isVisible())) {
        throw new Error(`${name} panel should start collapsed`)
      }
    }
    const initialPanels = await Promise.all(['数据', '图表', '播放控制'].map(async (name) => ({
      name,
      box: await region(desktop, name).boundingBox(),
    })))
    for (let left = 0; left < initialPanels.length; left += 1) {
      if (!initialPanels[left].box) throw new Error(`${initialPanels[left].name} panel is missing`)
      for (let right = left + 1; right < initialPanels.length; right += 1) {
        if (boxesOverlap(initialPanels[left].box, initialPanels[right].box)) {
          throw new Error('Collapsed overlay panels overlap')
        }
      }
    }
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-default.png'), fullPage: true })
    await canvas.screenshot({ path: path.join(outputDir, 'electromagnetic-idle.png') })

    const playbackPanel = await expand(desktop, '播放控制')
    await desktop.getByRole('button', { name: '通电' }).click()
    await desktop.waitForTimeout(120)
    if (!(await desktop.locator('#ticker-voltage').isDisabled())) {
      throw new Error('Experiment controls must lock once the timer is powered')
    }
    await desktop.getByRole('button', { name: '释放纸带' }).click()
    const dataPanel = await expand(desktop, '数据')
    await desktop.waitForFunction(() => {
      const text = document.querySelector('[aria-label="数据"]')?.textContent ?? ''
      return Number(text.match(/(\d+) 个/)?.[1] ?? 0) >= 10
    }, null, { timeout: 8000 })
    const chartPanel = await expand(desktop, '图表')
    await desktop.waitForFunction(() => document.querySelectorAll('.ticker-speed-chart [data-time-s]').length >= 3, null, { timeout: 8000 })
    const clearQuality = await dataPanel.innerText()
    if (!clearQuality.includes('点迹清晰') || !clearQuality.includes('0.020 s')) {
      throw new Error(`Clear 50 Hz run has incorrect telemetry: ${clearQuality}`)
    }
    const clearTimes = await desktop.locator('.ticker-speed-chart [data-time-s]').evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute('data-time-s'))),
    )
    if (clearTimes.some((time, index) => index > 0 && time <= clearTimes[index - 1])) {
      throw new Error('Clear-run v-t samples are not chronological')
    }
    await desktop.waitForTimeout(350)
    const initialOpenPanels = await Promise.all(['数据', '图表', '播放控制'].map(async (name) => ({
      name,
      box: await region(desktop, name).boundingBox(),
    })))
    for (let left = 0; left < initialOpenPanels.length; left += 1) {
      for (let right = left + 1; right < initialOpenPanels.length; right += 1) {
        const leftBox = initialOpenPanels[left].box
        const rightBox = initialOpenPanels[right].box
        if (!leftBox || !rightBox || boxesOverlap(leftBox, rightBox)) {
          throw new Error(`Expanded data, chart, and playback panels overlap: ${JSON.stringify(initialOpenPanels)}`)
        }
      }
    }
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-electromagnetic-run.png'), fullPage: true })
    await canvas.screenshot({ path: path.join(outputDir, 'electromagnetic-run.png') })
    await chartPanel.getByRole('button', { name: '折叠' }).click()

    await desktop.getByRole('button', { name: '重置' }).click()
    await setRange(desktop, '#ticker-voltage', 3.5, 3, 0.1)
    if (!(await dataPanel.innerText()).includes('漏点（电压偏低）')) {
      throw new Error('Low voltage check failed: slider=' + await desktop.locator('#ticker-voltage').inputValue() + ', telemetry=' + await dataPanel.innerText())
    }
    await desktop.getByRole('button', { name: '通电' }).click()
    await desktop.getByRole('button', { name: '释放纸带' }).click()
    await desktop.waitForFunction(() => Number((document.querySelector('[aria-label="数据"]')?.textContent ?? '').match(/(\d+) 个/)?.[1] ?? 0) >= 10, null, { timeout: 8000 })
    await expand(desktop, '图表')
    await desktop.waitForFunction(() => document.querySelectorAll('.ticker-speed-chart [data-time-s]').length >= 4, null, { timeout: 8000 })
    const missedTimes = await desktop.locator('.ticker-speed-chart [data-time-s]').evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute('data-time-s'))),
    )
    const missedIntervals = missedTimes.slice(1).map((time, index) => Number((time - missedTimes[index]).toFixed(5)))
    if (new Set(missedIntervals).size < 2) {
      throw new Error('The missed-dot v-t chart must retain nonuniform measured times')
    }
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-missed-dots.png'), fullPage: true })

    await desktop.getByRole('button', { name: '重置' }).click()
    await desktop.locator('#ticker-voltage').focus()
    await desktop.locator('#ticker-voltage').press('End')
    const highVoltageTelemetry = await dataPanel.innerText()
    if (!highVoltageTelemetry.includes('拖尾（针过长/电压偏高）')) {
      throw new Error(`High-voltage trace should be identified as smeared quality: ${highVoltageTelemetry}`)
    }
    await desktop.getByRole('button', { name: '重置' }).click()

    await desktop.getByRole('radio', { name: '静止' }).click()
    await desktop.locator('#ticker-playback-rate').focus()
    await desktop.locator('#ticker-playback-rate').press('End')
    await desktop.getByRole('button', { name: '通电' }).click()
    await desktop.getByRole('button', { name: '释放纸带' }).click()
    await desktop.waitForFunction(() => (document.querySelector('[aria-label="数据"]')?.textContent ?? '').includes('记录已结束'), null, { timeout: 10000 })
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-stationary-complete.png'), fullPage: true })
    await desktop.getByRole('button', { name: '断电' }).click()
    if (!(await desktop.getByRole('button', { name: '通电' }).isDisabled())) {
      throw new Error('A completed run must require reset before it can be powered again')
    }

    await desktop.getByRole('button', { name: '重置' }).click()
    await desktop.getByRole('radio', { name: '电火花' }).click()
    if (!(await desktop.getByText(/真实实验须由教师指导/).isVisible())) {
      throw new Error('Spark-timer high-voltage safety note is missing')
    }
    await desktop.getByRole('radio', { name: '匀速' }).click()
    await canvas.screenshot({ path: path.join(outputDir, 'spark-idle.png') })
    await desktop.locator('#ticker-playback-rate').focus()
    await desktop.locator('#ticker-playback-rate').press('End')
    await desktop.getByRole('button', { name: '通电' }).click()
    await desktop.getByRole('button', { name: '释放纸带' }).click()
    await desktop.waitForTimeout(700)
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-spark-moving.png'), fullPage: true })
    await canvas.screenshot({ path: path.join(outputDir, 'spark-moving.png') })
    await desktop.waitForFunction(() => document.querySelectorAll('.ticker-speed-chart [data-time-s]').length >= 4, null, { timeout: 8000 })
    if (!(await dataPanel.innerText()).includes('220 V AC')) {
      throw new Error('Spark timer should report its dedicated 220 V pulse supply')
    }
    await compareCanvas(
      path.join(outputDir, 'spark-idle.png'),
      path.join(outputDir, 'spark-moving.png'),
      'Spark apparatus and tape motion',
    )

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    collectErrors(mobile, 'mobile')
    await mobile.goto(`${baseUrl}/ticker-timer`, { waitUntil: 'domcontentloaded' })
    await mobile.getByRole('heading', { name: '打点计时器控制' }).waitFor({ state: 'visible', timeout: 15000 })
    await mobile.locator('canvas').waitFor({ state: 'visible' })
    await mobile.waitForTimeout(500)
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) {
      throw new Error('Mobile view overflows horizontally at 390px')
    }
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-electromagnetic.png'), fullPage: true })

    if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`)
    console.log(`Ticker timer desktop/mobile, timestamped v-t samples, print-quality modes, stop/reset, and apparatus animation checks passed. Artifacts: ${outputDir}`)
  } finally {
    await browser.close()
  }
})
