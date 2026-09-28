#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/induction-current-audit')
const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4177',
  env: process.env,
})

await mkdir(outputDir, { recursive: true })
await runWithManagedViteServer(
  { rootDir, baseUrl, devPort, logPath: path.join(outputDir, 'vite-dev.log') },
  async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
    })
    const errors = []
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await page.goto(baseUrl + '/induction-current', { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: '感应电流实验控制' }).waitFor({ state: 'visible', timeout: 15000 })
      await page.screenshot({ path: path.join(outputDir, 'desktop-initial.png'), fullPage: true })
      const dataPanel = page.getByRole('region', { name: '数据' })
      await dataPanel.getByRole('button', { name: '展开' }).click()

      const poleRadio = page.getByRole('radio', { name: 'S 极在上 (N 下)' })
      const approach = page.getByRole('button', { name: '↓ 接近' })
      const recede = page.getByRole('button', { name: '↑ 远离' })
      const reset = page.getByRole('button', { name: '↺ 重置' })
      const runAndCheck = async (button, expectedDirection, expectedField, recordCount) => {
        await button.click()
        if (!(await poleRadio.isDisabled())) throw new Error('Pole selector should be disabled while the magnet moves')
        if (recordCount === 1) {
          await page.waitForTimeout(900)
          console.log('Mid-motion readout: ' + await dataPanel.innerText())
          await page.screenshot({ path: path.join(outputDir, 'desktop-approach-readout.png'), fullPage: true })
          await dataPanel.getByRole('button', { name: '折叠' }).click()
          await page.screenshot({ path: path.join(outputDir, 'desktop-approach-in-motion.png'), fullPage: true })
          await dataPanel.getByRole('button', { name: '展开' }).click()
        }
        await page.getByText('实验记录: ' + recordCount + ' 条', { exact: true }).waitFor({ state: 'visible', timeout: 5000 })
        if (await poleRadio.isDisabled()) throw new Error('Pole selector should be enabled after the magnet stops')
        await page.getByText('最近一次感应电流方向: ' + expectedDirection, { exact: true }).waitFor({ state: 'visible', timeout: 3000 })
        await page.getByText('感应磁场轴向: ' + expectedField, { exact: true }).waitFor({ state: 'visible', timeout: 3000 })
      }

      await runAndCheck(approach, '逆时针', '向上 (↑)', 1)
      await runAndCheck(recede, '顺时针', '向下 (↓)', 2)
      await page.getByRole('radio', { name: 'S 极在下 (N 上)' }).click()
      await runAndCheck(approach, '顺时针', '向下 (↓)', 3)
      await runAndCheck(recede, '逆时针', '向上 (↑)', 4)
      await dataPanel.getByRole('button', { name: '折叠' }).click()
      await page.screenshot({ path: path.join(outputDir, 'desktop-completed.png'), fullPage: true })
      await reset.click()
      await page.getByText('暂无实验记录', { exact: true }).waitFor({ state: 'visible', timeout: 3000 })

      const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
      mobilePage.on('pageerror', (error) => errors.push('mobile: ' + error.message))
      await mobilePage.goto(baseUrl + '/induction-current', { waitUntil: 'domcontentloaded' })
      await mobilePage.getByRole('heading', { name: '感应电流实验控制' }).waitFor({ state: 'visible', timeout: 15000 })
      const hasOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
      if (hasOverflow) throw new Error('Induction current scene overflows horizontally at 390px')
      await mobilePage.close()
      if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '))
      console.log('Induction current directions, records, reset and 390px overflow checks passed. Artifacts: ' + outputDir)
    } finally {
      await browser.close()
    }
  },
)
