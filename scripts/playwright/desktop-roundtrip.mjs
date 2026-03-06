#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DEMO_CATALOG } from './shared/demoCatalog.mjs'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/desktop-roundtrip')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
  const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
    defaultBaseUrl: 'http://127.0.0.1:4174',
    env: process.env,
  })
  await runWithManagedViteServer(
    {
      rootDir: ROOT_DIR,
      baseUrl,
      devPort,
      logPath: DEV_SERVER_LOG,
    },
    async () => {
      let browser = null
      try {
        browser = await chromium.launch({
          headless: true,
          args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
        })
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
        const runtimeBlocked = await page
          .getByRole('heading', { name: '运行环境不支持' })
          .isVisible()
          .catch(() => false)
        if (runtimeBlocked) {
          throw new Error(
            'Runtime capability gate blocked desktop-roundtrip in headless browser; verify WebGL2 flags are enabled for Playwright Chromium.',
          )
        }
        await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })

        for (const demo of DEMO_CATALOG) {
          await page.getByRole('button', { name: demo.enterButton }).click()
          await page.waitForURL(`${baseUrl}${demo.path}`, { timeout: 15000 })
          await page.getByText(demo.readyText).first().waitFor({ state: 'visible', timeout: 15000 })
          await page.getByRole('button', { name: '返回导航' }).waitFor({ state: 'visible', timeout: 15000 })

          await page.screenshot({
            path: path.join(OUTPUT_DIR, `${demo.screenshotName}-desktop-roundtrip.png`),
            fullPage: true,
          })

          await page.getByRole('button', { name: '返回导航' }).click()
          await page.waitForURL(baseUrl, { timeout: 15000 })
          await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })
        }

        console.log(`Desktop roundtrip completed. Artifacts: ${OUTPUT_DIR}`)
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
