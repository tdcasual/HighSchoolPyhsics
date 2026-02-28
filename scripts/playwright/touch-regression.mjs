#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DEMO_CATALOG } from './shared/demoCatalog.mjs'
import { resolvePlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/touch-regression')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')
const { baseUrl: BASE_URL, devPort: DEV_PORT } = resolvePlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4173',
  env: process.env,
})

async function triggerThreeFingerModeSwitch(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const host = document.querySelector('.interactive-canvas-surface')
    if (!(host instanceof HTMLElement)) {
      throw new Error('interactive-canvas-surface not found')
    }

    const down = (id, x, y) => {
      host.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
      }))
    }

    const up = (id, x, y) => {
      host.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
      }))
    }

    down(11, 160, 180)
    down(12, 200, 180)
    down(13, 180, 220)
    await sleep(70)
    up(11, 160, 180)
    up(12, 200, 180)
    up(13, 180, 220)
  })
}

async function triggerDoubleTapReset(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const host = document.querySelector('.interactive-canvas-surface')
    if (!(host instanceof HTMLElement)) {
      throw new Error('interactive-canvas-surface not found')
    }

    const tap = async (id, x, y) => {
      host.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
      }))
      await sleep(24)
      host.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
      }))
    }

    await tap(21, 176, 196)
    await sleep(110)
    await tap(22, 180, 198)
  })
}

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
  await runWithManagedViteServer(
    {
      rootDir: ROOT_DIR,
      baseUrl: BASE_URL,
      devPort: DEV_PORT,
      logPath: DEV_SERVER_LOG,
    },
    async () => {
      let browser = null
      try {
        browser = await chromium.launch({ headless: true })
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          hasTouch: true,
          isMobile: true,
        })

        const page = await context.newPage()
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })

        for (const demo of DEMO_CATALOG) {
          await page.getByRole('button', { name: demo.enterButton }).click({ force: true })
          await page.getByText(demo.readyText).first().waitFor({ state: 'visible', timeout: 15000 })
          const canvasSurface = page.locator('.interactive-canvas-surface').first()
          if ((await canvasSurface.count()) > 0) {
            await canvasSurface.waitFor({ state: 'visible', timeout: 15000 })

            await triggerThreeFingerModeSwitch(page)
            await page.getByText('已切换精细模式').waitFor({ state: 'visible', timeout: 5000 })
            await page.getByText(/三指切换模式（精细模式）/).waitFor({ state: 'visible', timeout: 5000 })

            await triggerDoubleTapReset(page)
            await page.getByText('已重置视角').waitFor({ state: 'visible', timeout: 5000 })
          } else {
            await page.getByText('3D演示预览（测试环境降级）').first().waitFor({ state: 'visible', timeout: 15000 })
            await page.getByText(/拖拽旋转 · 滚轮缩放/).waitFor({ state: 'visible', timeout: 5000 })
          }

          await page.screenshot({
            path: path.join(OUTPUT_DIR, `${demo.screenshotName}-touch-regression.png`),
            fullPage: true,
          })

          await page.getByRole('button', { name: '返回导航' }).click()
          await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })
        }

        console.log(`Touch regression completed. Artifacts: ${OUTPUT_DIR}`)
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
