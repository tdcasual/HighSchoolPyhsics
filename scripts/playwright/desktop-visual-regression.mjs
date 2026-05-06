#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { DEMO_CATALOG } from './shared/demoCatalog.mjs'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/desktop-visual-regression')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const CURRENT_DIR = path.join(OUTPUT_DIR, 'current')
const DIFF_DIR = path.join(OUTPUT_DIR, 'diff')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')
const BASELINE_DIR = path.join(ROOT_DIR, 'scripts/playwright/baseline/desktop')
const UPDATE_BASELINE = process.argv.includes('--update-baseline')

const VISUAL_PIXEL_THRESHOLD = Number(process.env.VISUAL_PIXEL_THRESHOLD ?? 0.2)
const VISUAL_MAX_MISMATCH_RATIO = Number(process.env.VISUAL_MAX_MISMATCH_RATIO ?? 0.04)

if (!Number.isFinite(VISUAL_PIXEL_THRESHOLD) || VISUAL_PIXEL_THRESHOLD <= 0 || VISUAL_PIXEL_THRESHOLD > 1) {
  throw new Error(`Invalid VISUAL_PIXEL_THRESHOLD: ${process.env.VISUAL_PIXEL_THRESHOLD}`)
}
if (!Number.isFinite(VISUAL_MAX_MISMATCH_RATIO) || VISUAL_MAX_MISMATCH_RATIO < 0 || VISUAL_MAX_MISMATCH_RATIO > 1) {
  throw new Error(`Invalid VISUAL_MAX_MISMATCH_RATIO: ${process.env.VISUAL_MAX_MISMATCH_RATIO}`)
}


const SCENARIOS = [
  {
    id: 'overview',
    path: '/',
    ready: async (page) => {
      await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })
    },
  },
  ...DEMO_CATALOG.map((demo) => ({
    id: demo.screenshotName,
    path: demo.path,
    ready: async (page) => {
      await page.getByText(demo.readyText).first().waitFor({ state: 'visible', timeout: 15000 })
    },
  })),
]

async function stabilizePage(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    `,
  })
}

function parsePng(buffer) {
  return PNG.sync.read(buffer)
}

async function compareScreenshot(id, actualPath, baselinePath, diffPath) {
  const [actualBuffer, baselineBuffer] = await Promise.all([readFile(actualPath), readFile(baselinePath)])
  const actualPng = parsePng(actualBuffer)
  const baselinePng = parsePng(baselineBuffer)

  if (actualPng.width !== baselinePng.width || actualPng.height !== baselinePng.height) {
    throw new Error(
      `${id}: image dimensions differ (actual ${actualPng.width}x${actualPng.height}, baseline ${baselinePng.width}x${baselinePng.height})`,
    )
  }

  const diffPng = new PNG({ width: actualPng.width, height: actualPng.height })
  const mismatchPixels = pixelmatch(
    baselinePng.data,
    actualPng.data,
    diffPng.data,
    actualPng.width,
    actualPng.height,
    {
      threshold: VISUAL_PIXEL_THRESHOLD,
      includeAA: true,
    },
  )

  const totalPixels = actualPng.width * actualPng.height
  const mismatchRatio = mismatchPixels / totalPixels
  if (mismatchRatio > VISUAL_MAX_MISMATCH_RATIO) {
    await writeFile(diffPath, PNG.sync.write(diffPng))
    throw new Error(
      `${id}: mismatch ${(mismatchRatio * 100).toFixed(2)}% > ${(VISUAL_MAX_MISMATCH_RATIO * 100).toFixed(2)}% (diff: ${diffPath})`,
    )
  }

  return mismatchRatio
}

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
  const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
    defaultBaseUrl: 'http://127.0.0.1:4175',
    env: process.env,
  })
  await mkdir(CURRENT_DIR, { recursive: true })
  await mkdir(DIFF_DIR, { recursive: true })

  await runWithManagedViteServer(
    {
      rootDir: ROOT_DIR,
      baseUrl,
      devPort,
      logPath: DEV_SERVER_LOG,
    },
    async () => {
      let browser = null
      const failures = []
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
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          reducedMotion: 'reduce',
        })

        const page = await context.newPage()

        for (const scenario of SCENARIOS) {
          const url = `${baseUrl}${scenario.path === '/' ? '' : scenario.path}`
          await page.goto(url, { waitUntil: 'domcontentloaded' })
          await scenario.ready(page)
          await stabilizePage(page)

          const actualPath = path.join(CURRENT_DIR, `${scenario.id}.png`)
          const baselinePath = path.join(BASELINE_DIR, `${scenario.id}.png`)
          const diffPath = path.join(DIFF_DIR, `${scenario.id}.png`)

          await page.screenshot({ path: actualPath })

          if (UPDATE_BASELINE) {
            await mkdir(BASELINE_DIR, { recursive: true })
            await copyFile(actualPath, baselinePath)
            console.log(`[baseline] updated ${scenario.id}`)
            continue
          }

          try {
            const mismatchRatio = await compareScreenshot(scenario.id, actualPath, baselinePath, diffPath)
            console.log(
              `[ok] ${scenario.id} mismatch ${(mismatchRatio * 100).toFixed(2)}% <= ${(VISUAL_MAX_MISMATCH_RATIO * 100).toFixed(2)}%`,
            )
          } catch (error) {
            failures.push(error instanceof Error ? error.message : String(error))
          }
        }

        await context.close()
      } finally {
        if (browser) {
          await browser.close()
        }
      }

      if (UPDATE_BASELINE) {
        console.log(`Baselines updated in ${BASELINE_DIR}`)
        return
      }

      if (failures.length > 0) {
        console.error('Desktop visual regression failed:')
        for (const failure of failures) {
          console.error(`  - ${failure}`)
        }
        process.exitCode = 1
        return
      }

      console.log(`Desktop visual regression passed. Artifacts: ${OUTPUT_DIR}`)
    },
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
