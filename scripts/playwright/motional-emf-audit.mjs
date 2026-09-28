#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/motional-emf-audit')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
  const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
    defaultBaseUrl: 'http://127.0.0.1:4176',
    env: process.env,
  })
  await runWithManagedViteServer({
    rootDir: ROOT_DIR,
    baseUrl,
    devPort,
    logPath: path.join(LOG_DIR, 'vite-dev.log'),
  }, async () => {
    let browser = null
    try {
      browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] })
      const errors = []
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
      await page.goto(`${baseUrl}/motional-emf`, { waitUntil: 'domcontentloaded' })
      await page.getByText('切割磁感线实验控制').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForTimeout(700)
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop-default.png'), fullPage: true })
      await page.getByRole('region', { name: '数据' }).getByRole('button', { name: '展开' }).click()

      const voltage = page.getByText(/电压 U_AB:/)
      const readVoltage = async () => (await voltage.innerText()).trim()
      const play = async () => {
        await page.getByRole('button', { name: '播放' }).click()
        await page.getByText('运动状态: 运动中').waitFor({ state: 'visible', timeout: 3000 })
      }
      await play()
      await page.waitForTimeout(350)
      const defaultVoltage = await readVoltage()
      if (!defaultVoltage.includes('1.00 V')) throw new Error(`Default U_AB should be +1.00 V while moving; got: ${defaultVoltage}`)
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop-running.png'), fullPage: false })
      await page.getByRole('button', { name: '重置' }).click()

      await page.getByRole('radio', { name: '磁场向下' }).click()
      await play()
      if (!(await readVoltage()).includes('-1.00 V')) throw new Error(`Reversing B should reverse U_AB; got: ${await readVoltage()}`)
      await page.getByRole('button', { name: '重置' }).click()
      await page.getByRole('radio', { name: '磁场向上' }).click()

      await page.getByRole('radio', { name: '向上', exact: true }).click()
      await play()
      if (!(await readVoltage()).includes('0.00 V')) throw new Error(`Motion parallel to B should yield zero U_AB; got: ${await readVoltage()}`)
      await page.getByRole('button', { name: '重置' }).click()

      await page.getByRole('radio', { name: '按 ∠(L,v) 讨论' }).click()
      await page.getByRole('radio', { name: 'L 与 v 成 30°' }).click()
      await play()
      if (!(await readVoltage()).includes('0.50 V')) throw new Error(`L-v=30° should yield +0.50 V for defaults; got: ${await readVoltage()}`)
      await page.getByRole('button', { name: '重置' }).click()

      for (const view of ['俯视', '底视', '默认视角']) {
        await page.getByRole('button', { name: view }).click()
        await page.waitForTimeout(250)
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${view}.png`), fullPage: true })
      }

      const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
      mobile.on('pageerror', (error) => errors.push(`mobile pageerror: ${error.message}`))
      await mobile.goto(`${baseUrl}/motional-emf`, { waitUntil: 'domcontentloaded' })
      await mobile.getByText('切割磁感线实验控制').waitFor({ state: 'visible', timeout: 15000 })
      const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
      if (overflow) throw new Error('Motional emf page has horizontal overflow at 390px')
      await mobile.screenshot({ path: path.join(OUTPUT_DIR, 'mobile.png'), fullPage: true })
      if (errors.length) throw new Error(`Runtime errors detected:\n${errors.join('\n')}`)
      console.log(`Motional emf audit passed. Default=${defaultVoltage}; reverse-B, B-parallel motion, L-v angle, views and mobile checked. Artifacts: ${OUTPUT_DIR}`)
      await mobile.close()
    } finally {
      if (browser) await browser.close()
    }
  })
}

run().catch((error) => { console.error(error); process.exitCode = 1 })
