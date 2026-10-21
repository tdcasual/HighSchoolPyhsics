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
const BASELINE_ROOT = path.join(ROOT_DIR, 'scripts/playwright/baseline')
const UPDATE_BASELINE = process.argv.includes('--update-baseline')
// Optional page ids (or "overview") to limit the run, e.g. after adding a scene.
const ONLY = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const PROFILE_ARG = process.argv.find((arg) => arg.startsWith('--profile='))?.slice('--profile='.length)

/**
 * Each profile has its own baselines: the 1080p projector by day, the same by night (theme
 * colours drift silently otherwise), and a touch phone. Desktop images are stored at half scale.
 */
const PROFILES = [
  { id: 'desktop', theme: 'day', context: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 } },
  { id: 'night', theme: 'night', context: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 } },
  { id: 'phone', theme: 'day', context: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
].filter((profile) => !PROFILE_ARG || PROFILE_ARG.split(',').includes(profile.id))

const VISUAL_PIXEL_THRESHOLD = Number(process.env.VISUAL_PIXEL_THRESHOLD ?? 0.2)
const VISUAL_MAX_MISMATCH_RATIO = Number(process.env.VISUAL_MAX_MISMATCH_RATIO ?? 0.04)
/**
 * The data panel is plain HTML (no WebGL), so it is compared on its own and strictly: a reading
 * that changes colour (a lost night-mode rule) is far below the whole-screen tolerance. Stable
 * panels repeat exactly (0.00 %); one recoloured number is about 0.3 %.
 */
const PANEL_MAX_MISMATCH_RATIO = Number(process.env.PANEL_MAX_MISMATCH_RATIO ?? 0.001)

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
      await page.locator('.scene-card').first().waitFor({ state: 'visible', timeout: 15000 })
      // Thumbnails load lazily; give the visible ones time to decode.
      await page.waitForTimeout(1500)
    },
  },
  ...DEMO_CATALOG.map((demo) => ({
    id: demo.screenshotName,
    path: demo.path,
    ready: async (page) => {
      await page.getByText(demo.readyText).filter({ visible: true }).first().waitFor({ timeout: 15000 })
      await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 15000 })
      // Let WebGL draw its first frames (and fonts settle) before the snapshot.
      await page.waitForTimeout(1500)
      // Scenes that play on open (暂停 / 暂停传播 / 暂停扫描 …) are paused so the frame is repeatable.
      // (On phones the playback buttons sit in the top bar rather than a panel.)
      const pause = page.getByRole('button', { name: /^暂停/ }).filter({ visible: true })
      if (await pause.count()) {
        await pause.first().click()
        await page.waitForTimeout(500)
      }
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

/** Scenes whose opening frame depends on when the animation was paused (the wave phase). */
const MAX_MISMATCH_BY_SCENE = { 'wave-interference': 0.1 }
/** Scenes whose data panel readings depend on the moment the opening animation is paused. */
const PANEL_UNSTABLE = new Set(['generator-core'])

async function compareScreenshot(id, maxMismatch, actualPath, baselinePath, diffPath) {
  const baselineBuffer = await readFile(baselinePath).catch(() => null)
  if (!baselineBuffer) throw new Error(`${id}: no baseline yet; run npm run test:visual-smoke:update`)
  const actualBuffer = await readFile(actualPath)
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
  if (mismatchRatio > maxMismatch) {
    await writeFile(diffPath, PNG.sync.write(diffPng))
    throw new Error(
      `${id}: mismatch ${(mismatchRatio * 100).toFixed(2)}% > ${(maxMismatch * 100).toFixed(2)}% (diff: ${diffPath})`,
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
      // PLAYWRIGHT_SERVER_MODE=preview serves the production build (run npm run build first).
      mode: process.env.PLAYWRIGHT_SERVER_MODE || 'dev',
    },
    async () => {
      let browser = null
      const failures = []
      try {
        browser = await chromium.launch({
          headless: true,
          executablePath: process.env.CHROME_PATH || undefined,
          args: [
            '--use-angle=swiftshader',
            '--use-gl=angle',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--enable-features=Vulkan',
            '--disable-gpu-sandbox',
          ],
        })
        for (const profile of PROFILES) {
          const context = await browser.newContext({ ...profile.context, reducedMotion: 'reduce' })
          const page = await context.newPage()
          const baselineDir = path.join(BASELINE_ROOT, profile.id)
          for (const scenario of SCENARIOS.filter((item) => ONLY.length === 0 || ONLY.includes(item.id))) {
            const name = `${profile.id}/${scenario.id}`
            const url = `${baseUrl}${scenario.path === '/' ? '' : scenario.path}`
            await page.goto(url, { waitUntil: 'domcontentloaded' })
            // Opening state, not whatever the previous run remembered; then the profile's theme.
            await page.evaluate((theme) => {
              sessionStorage.clear()
              localStorage.clear()
              if (theme === 'night') localStorage.setItem('electromagnetics-lab-ui', JSON.stringify({ state: { theme }, version: 0 }))
            }, profile.theme)
            await page.reload({ waitUntil: 'domcontentloaded' })
            await scenario.ready(page)
            await stabilizePage(page)

            await mkdir(path.join(CURRENT_DIR, profile.id), { recursive: true })
            await mkdir(path.join(DIFF_DIR, profile.id), { recursive: true })
            const actualPath = path.join(CURRENT_DIR, profile.id, `${scenario.id}.png`)
            const baselinePath = path.join(baselineDir, `${scenario.id}.png`)
            const diffPath = path.join(DIFF_DIR, profile.id, `${scenario.id}.png`)
            await page.screenshot({ path: actualPath })
            const shots = [{ name, actualPath, baselinePath, diffPath, max: MAX_MISMATCH_BY_SCENE[scenario.id] ?? VISUAL_MAX_MISMATCH_RATIO }]
            const panel = page.getByRole('region', { name: '数据' }).filter({ visible: true }).first()
            if (scenario.id !== 'overview' && !PANEL_UNSTABLE.has(scenario.id) && await panel.count()) {
              const panelFile = `${scenario.id}.data.png`
              const panelPath = path.join(CURRENT_DIR, profile.id, panelFile)
              await panel.screenshot({ path: panelPath })
              shots.push({ name: `${name} data panel`, actualPath: panelPath, baselinePath: path.join(baselineDir, panelFile), diffPath: path.join(DIFF_DIR, profile.id, panelFile), max: PANEL_MAX_MISMATCH_RATIO })
            }

            for (const shot of shots) {
              if (UPDATE_BASELINE) {
                await mkdir(baselineDir, { recursive: true })
                await copyFile(shot.actualPath, shot.baselinePath)
                console.log(`[baseline] updated ${shot.name}`)
                continue
              }
              try {
                const mismatchRatio = await compareScreenshot(shot.name, shot.max, shot.actualPath, shot.baselinePath, shot.diffPath)
                console.log(`[ok] ${shot.name} mismatch ${(mismatchRatio * 100).toFixed(2)}% <= ${(shot.max * 100).toFixed(2)}%`)
              } catch (error) {
                failures.push(error instanceof Error ? error.message : String(error))
              }
            }
          }
          await context.close()
        }
      } finally {
        if (browser) {
          await browser.close()
        }
      }

      if (UPDATE_BASELINE) {
        console.log(`Baselines updated in ${BASELINE_ROOT}`)
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
