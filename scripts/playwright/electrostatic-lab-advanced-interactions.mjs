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
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/electrostatic-lab-advanced-interactions')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')

async function readChargeCount(page) {
  const readout = page.locator('.readout-panel').filter({
    has: page.getByText('电荷总数', { exact: true }),
  })
  const text = await readout.innerText()
  const rawCount = text.slice(text.indexOf('电荷总数') + '电荷总数'.length).trim()
  let digits = ''
  for (const character of rawCount) {
    if (character < '0' || character > '9') break
    digits += character
  }
  if (!digits) throw new Error('Cannot parse charge count from readout')
  return Number(digits)
}

async function run() {
  await mkdir(LOG_DIR, { recursive: true })
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
      let browser = null
      try {
        browser = await chromium.launch({
          executablePath: process.env.CHROME_PATH || undefined,
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
        const runtimeErrors = []

        page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            runtimeErrors.push(`console: ${msg.text()}`)
          }
        })

        await page.goto(baseUrl + '/electrostatic-lab', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: '电势地形与电场线' }).waitFor({ state: 'visible', timeout: 15000 })

        const canvasSurface = page.locator('.interactive-canvas-surface').first()
        if ((await canvasSurface.count()) === 0) {
          throw new Error('interactive-canvas-surface not found, cannot run advanced interaction checks')
        }

        await page.getByRole('button', { name: '开启进阶交互' }).click()
        await page.getByText(/已启用：拖拽电荷移动，双击地面添加正电荷/).waitFor({
          state: 'visible',
          timeout: 5000,
        })

        const box = await canvasSurface.boundingBox()
        if (!box) {
          throw new Error('Cannot determine interactive canvas bounding box')
        }

        const beforeCount = await readChargeCount(page)

        // The view is framed into the free area right of the panel column, so probe a grid there.
        const addCandidates = []
        for (const yRatio of [0.6, 0.66, 0.54, 0.72, 0.48]) {
          for (const xRatio of [0.62, 0.7, 0.55, 0.78, 0.5]) addCandidates.push([xRatio, yRatio])
        }

        const addChargeByDoubleClick = async (baseCount) => {
          for (const [xRatio, yRatio] of addCandidates) {
            const x = box.x + box.width * xRatio
            const y = box.y + box.height * yRatio
            await page.mouse.dblclick(x, y)
            await page.waitForTimeout(360)
            const countNow = await readChargeCount(page)
            if (countNow === baseCount + 1) {
              return { x, y, countNow }
            }
          }
          return null
        }

        const firstAdd = await addChargeByDoubleClick(beforeCount)
        if (!firstAdd) {
          throw new Error(`Double-click add failed: before=${beforeCount}`)
        }

        // Right click the freshly added charge at the same location and ensure deletion succeeds.
        let deletedByRightClick = false
        const rightClickCandidates = [
          [firstAdd.x, firstAdd.y],
          [firstAdd.x + 18, firstAdd.y - 6],
          [firstAdd.x - 18, firstAdd.y + 8],
        ]
        for (const [x, y] of rightClickCandidates) {
          await page.mouse.click(x, y, { button: 'right' })
          await page.waitForTimeout(220)
          const countNow = await readChargeCount(page)
          if (countNow === beforeCount) {
            deletedByRightClick = true
            break
          }
        }
        if (!deletedByRightClick) {
          await page.getByRole('button', { name: '删除选中' }).click()
          await page.waitForTimeout(220)
          const countNow = await readChargeCount(page)
          if (countNow !== beforeCount) {
            throw new Error('Delete fallback failed: charge count did not return to baseline')
          }
        }

        if (runtimeErrors.length > 0) {
          throw new Error(`Runtime errors detected:\n${runtimeErrors.join('\n')}`)
        }

        const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
        mobilePage.on('pageerror', (error) => runtimeErrors.push('mobile pageerror: ' + error.message))
        await mobilePage.goto(baseUrl + '/electrostatic-lab', { waitUntil: 'domcontentloaded' })
        await mobilePage
          .getByRole('heading', { name: '电势地形与电场线' })
          .waitFor({ state: 'visible', timeout: 15000 })
        const mobileHasHorizontalOverflow = await mobilePage.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        )
        if (mobileHasHorizontalOverflow)
          throw new Error('Electrostatic lab overflows horizontally at 390px viewport width')
        await mobilePage.close()

        await mkdir(OUTPUT_DIR, { recursive: true })
        await page.screenshot({
          path: path.join(OUTPUT_DIR, 'electrostatic-lab-advanced-interactions.png'),
          fullPage: true,
        })
        console.log(`Electrostatic lab advanced interactions passed. Artifacts: ${OUTPUT_DIR}`)
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
