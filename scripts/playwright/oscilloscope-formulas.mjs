#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/oscilloscope-formulas')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')
const PRESET_LABELS = ['无电场 (0V)', '时基锯齿波', '正弦波', '方波', '三角波', '高频正弦']

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
  const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
    defaultBaseUrl: 'http://127.0.0.1:4177',
    env: process.env,
  })

  await runWithManagedViteServer(
    {
      rootDir: ROOT_DIR,
      baseUrl,
      devPort,
      logPath: DEV_SERVER_LOG,
      mode: process.env.OSCILLOSCOPE_TEST_MODE === 'preview' ? 'preview' : 'dev',
    },
    async () => {
      let browser = null
      try {
        browser = await chromium.launch({
          headless: true,
          args: [
            '--use-angle=swiftshader',
            '--use-gl=angle',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--enable-features=Vulkan',
            '--disable-gpu-sandbox',
          ],
        })
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
        const cspErrors = []
        page.on('console', (message) => {
          if (message.type() === 'error' && /Content Security Policy|unsafe-eval/i.test(message.text())) {
            cspErrors.push(message.text())
          }
        })

        await page.goto(baseUrl + '/oscilloscope', { waitUntil: 'domcontentloaded' })
        await page.getByText('示波器控制').waitFor({ state: 'visible', timeout: 15000 })

        const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
        assert.ok(csp?.includes("script-src 'self'"), 'the self-only script CSP must stay enabled')
        assert.ok(!csp?.includes('unsafe-eval'), 'the CSP must not allow unsafe-eval')

        const xFormula = page.getByLabel('Ux(t) 函数')
        const yFormula = page.getByLabel('Uy(t) 函数')
        assert.equal(await xFormula.inputValue(), '0')
        assert.equal(await yFormula.inputValue(), '0')
        assert.equal(await page.locator('.formula-error').count(), 0, 'default zero formulas must compile')

        for (const label of PRESET_LABELS) {
          await page.locator('#osc-ux-preset').selectOption({ label })
          assert.equal(await page.locator('.formula-error').count(), 0, 'X preset should compile: ' + label)
          await page.locator('#osc-uy-preset').selectOption({ label })
          assert.equal(await page.locator('.formula-error').count(), 0, 'Y preset should compile: ' + label)
        }

        await xFormula.fill('5*sin(2*π*50*t)')
        await yFormula.fill('clamp(max(abs(-3), sqrt(16)), 0, 5)')
        assert.equal(await page.locator('.formula-error').count(), 0, 'custom formulas should compile')
        assert.equal(await xFormula.inputValue(), '5*sin(2*π*50*t)')
        assert.equal(await yFormula.inputValue(), 'clamp(max(abs(-3), sqrt(16)), 0, 5)')

        await xFormula.fill('window.alert(1)')
        assert.equal(await page.locator('.formula-error').count(), 1, 'unsafe custom input should show a formula error')
        assert.match(await page.locator('.formula-error').innerText(), /非法字符|数字格式无效/)
        assert.equal(await page.evaluate(() => typeof window.alert), 'function', 'unsafe input must not invoke browser globals')
        assert.deepEqual(cspErrors, [], 'formula compilation should not trigger CSP errors')

        console.log('Oscilloscope formula browser regression passed with the production CSP policy.')
      } finally {
        if (browser) {
          await browser.close()
        }
      }
    },
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
