#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/electromagnetic-drive-audit')
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
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('pageerror', (error) => errors.push('pageerror: ' + error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push('console: ' + message.text())
    })
    await page.goto(baseUrl + '/electromagnetic-drive', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: '电磁驱动控制' }).waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('canvas').waitFor({ state: 'visible' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(outputDir, 'desktop-default.png'), fullPage: true })

    const dataPanel = page.getByRole('region', { name: '数据' })
    const chartPanel = page.getByRole('region', { name: '图表' })
    for (const panel of [dataPanel, chartPanel]) {
      if (!(await panel.getByRole('button', { name: '展开' }).isVisible())) {
        throw new Error('Data, chart, and playback panels should start collapsed to keep the rig clear')
      }
    }
    if ((await dataPanel.boundingBox()).x > 550) {
      throw new Error('Data panel is not positioned beside the sidebar')
    }

    await dataPanel.getByRole('button', { name: '展开' }).click()
    const dataBox = await dataPanel.boundingBox()
    const chartBox = await chartPanel.boundingBox()
    if (!dataBox || !chartBox || chartBox.y < dataBox.y + dataBox.height + 8) {
      throw new Error('Expanded data and chart panels must not overlap')
    }
    await chartPanel.getByRole('button', { name: '展开' }).click()
    await page.getByText(/横轴：采样先后/).waitFor({ state: 'visible' })
    await page.screenshot({ path: path.join(outputDir, 'desktop-chart.png'), fullPage: true })
    await chartPanel.getByRole('button', { name: '折叠' }).click()

    await page.getByRole('button', { name: '开始摇动' }).click()
    await page.waitForFunction(() => {
      const text = document.querySelector('.scene-core-summary-stack')?.textContent ?? ''
      const magnet = Number(text.match(/磁铁转速:\s*([\d.]+)/)?.[1])
      const frame = Number(text.match(/铝框转速:\s*([\d.]+)/)?.[1])
      return magnet > 2 && frame > 0 && frame < magnet
    }, null, { timeout: 5000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(outputDir, 'desktop-running.png'), fullPage: true })
    const readSpeeds = async () => {
      const text = await page.locator('.scene-core-summary-stack').innerText()
      return {
        magnet: Number(text.match(/磁铁转速:\s*([\d.]+)/)?.[1]),
        frame: Number(text.match(/铝框转速:\s*([\d.]+)/)?.[1]),
      }
    }
    const beforePause = await readSpeeds()
    await page.getByRole('button', { name: '停止摇动' }).click()
    await page.waitForTimeout(250)
    const afterPause = await readSpeeds()
    if (!(afterPause.magnet < beforePause.magnet && afterPause.frame > 0)) {
      throw new Error('Stopping the hand input should let both rotors coast')
    }
    await page.getByRole('button', { name: '重置实验' }).click()
    await page.getByText('实验状态: 静止', { exact: true }).waitFor({ state: 'visible' })
    await page.getByText('磁铁转速: 0.00 rad/s', { exact: true }).waitFor({ state: 'visible' })

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    mobile.on('pageerror', (error) => errors.push('mobile pageerror: ' + error.message))
    mobile.on('console', (message) => {
      if (message.type() === 'error') errors.push('mobile console: ' + message.text())
    })
    await mobile.goto(baseUrl + '/electromagnetic-drive', { waitUntil: 'domcontentloaded' })
    await mobile.getByRole('heading', { name: '电磁驱动控制' }).waitFor({ state: 'visible', timeout: 15000 })
    await mobile.locator('canvas').waitFor({ state: 'visible' })
    await mobile.waitForTimeout(1500)
    const hasOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    if (hasOverflow) throw new Error('Electromagnetic-drive scene overflows at 390px')
    await mobile.screenshot({ path: path.join(outputDir, 'mobile.png'), fullPage: true })
    await mobile.getByRole('radio', { name: '图表' }).click()
    await mobile.getByText(/横轴：采样先后/).waitFor({ state: 'visible' })
    const chartHasOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    if (chartHasOverflow) throw new Error('Electromagnetic-drive chart overflows at 390px')
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-chart.png'), fullPage: true })

    if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '))
    console.log('Electromagnetic-drive desktop, chart, start/coast/reset, 390px mobile and browser-error checks passed. Artifacts: ' + outputDir)
    await mobile.close()
  } finally {
    await browser.close()
  }
})
