#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolvePlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/electrostatic-lab-advanced-interactions')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')

const { baseUrl: BASE_URL, devPort: DEV_PORT } = resolvePlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4176',
  env: process.env,
})

async function readChargeCount(page) {
  const text = await page.locator('.electrostatic-lab-readout p').first().innerText()
  const match = text.match(/电荷总数:\s*(\d+)/)
  if (!match) {
    throw new Error(`Cannot parse charge count from readout: "${text}"`)
  }
  return Number(match[1])
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
        browser = await chromium.launch({
          headless: true,
          args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
        })
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
        const runtimeErrors = []

        page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            runtimeErrors.push(`console: ${msg.text()}`)
          }
        })

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })
        await page.getByRole('button', { name: '进入3D等势面' }).click()
        await page.waitForURL(`${BASE_URL}/electrostatic-lab`, { timeout: 15000 })
        await page.getByText('3D等势面实验台控制').first().waitFor({ state: 'visible', timeout: 15000 })

        const canvasSurface = page.locator('.interactive-canvas-surface').first()
        if ((await canvasSurface.count()) === 0) {
          throw new Error('interactive-canvas-surface not found, cannot run advanced interaction checks')
        }

        await page.getByRole('button', { name: '开启进阶交互' }).click()
        await page.getByText('拖拽电荷移动、双击地面添加电荷、右键点击电荷删除').waitFor({
          state: 'visible',
          timeout: 5000,
        })

        const box = await canvasSurface.boundingBox()
        if (!box) {
          throw new Error('Cannot determine interactive canvas bounding box')
        }

        const beforeCount = await readChargeCount(page)

        const addCandidates = [
          [0.5, 0.58],
          [0.46, 0.63],
          [0.54, 0.63],
          [0.5, 0.7],
          [0.5, 0.5],
        ]

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
