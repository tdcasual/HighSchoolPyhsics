#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'
import { build1080pPresentationCases } from './shared/presentationRegressionCases.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/1080p-presentation')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')

async function enablePresentation(page) {
  const toggle = page.getByRole('button', { name: '课堂展示' })
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
    await toggle.click()
  }
}

async function waitForSceneReady(page, readyText) {
  await page.locator('[data-presentation-layout-decision]').waitFor({
    state: 'attached',
    timeout: 15000,
  })
  await page.getByText(readyText).first().waitFor({
    state: 'attached',
    timeout: 15000,
  })
}

async function openControlsIfCollapsed(page) {
  const showControlsButton = page.getByRole('button', { name: '显示控制面板' })
  if ((await showControlsButton.count()) > 0) {
    await showControlsButton.click()
  }
}

async function ensureLayoutDecision(page, expected) {
  await page.locator(`[data-presentation-layout-decision="${expected}"]`).waitFor({
    state: 'visible',
    timeout: 15000,
  })
}

async function ensureFocusMode(page, expected) {
  await page.locator(`[data-presentation-focus-mode="${expected}"]`).first().waitFor({
    state: 'visible',
    timeout: 15000,
  })
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) })
}

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
    defaultBaseUrl: 'http://127.0.0.1:4176',
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
      const browser = await chromium.launch({
        headless: true,
        args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
      })

      try {
        const context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()

        for (const scenario of build1080pPresentationCases()) {
          await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: 'domcontentloaded' })
          await waitForSceneReady(page, scenario.readyText)
          await enablePresentation(page)
          await scenario.prepare?.(page, { openControlsIfCollapsed })
          await ensureLayoutDecision(page, scenario.expectedLayout)
          await ensureFocusMode(page, scenario.expectedFocus)
          await screenshot(page, scenario.screenshotName)
        }

        console.log(`1080P presentation regression passed. Artifacts: ${OUTPUT_DIR}`)
        await context.close()
      } finally {
        await browser.close()
      }
    },
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
