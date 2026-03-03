import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DEMO_CATALOG } from '../playwright/shared/demoCatalog.mjs'
import { resolvePlaywrightRuntime, runWithManagedViteServer } from '../playwright/shared/runtime.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/perf/route-load-budget')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')

const { baseUrl: BASE_URL, devPort: DEV_PORT } = resolvePlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4172',
  env: process.env,
})

const ROUTE_LOAD_BUDGET_MS = Number(process.env.ROUTE_LOAD_BUDGET_MS ?? 2600)
if (!Number.isFinite(ROUTE_LOAD_BUDGET_MS) || ROUTE_LOAD_BUDGET_MS <= 0) {
  throw new Error(`Invalid ROUTE_LOAD_BUDGET_MS: ${process.env.ROUTE_LOAD_BUDGET_MS}`)
}

async function run() {
  if (DEMO_CATALOG.length === 0) {
    throw new Error('DEMO_CATALOG is empty, cannot run route-load budget check')
  }

  const firstDemo = DEMO_CATALOG[0]
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
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })

        const startTime = performance.now()
        await page.getByRole('button', { name: firstDemo.enterButton }).click()
        await page.waitForURL(`${BASE_URL}${firstDemo.path}`, { timeout: 15000 })
        await page.getByText(firstDemo.readyText).first().waitFor({ state: 'visible', timeout: 15000 })
        const elapsedMs = performance.now() - startTime

        const elapsedRounded = elapsedMs.toFixed(1)
        if (elapsedMs > ROUTE_LOAD_BUDGET_MS) {
          throw new Error(
            `Route-load budget exceeded for ${firstDemo.path}: ${elapsedRounded} ms (max ${ROUTE_LOAD_BUDGET_MS} ms)`,
          )
        }

        console.log(
          `Route-load budget passed for ${firstDemo.path}: ${elapsedRounded} ms (max ${ROUTE_LOAD_BUDGET_MS} ms)`,
        )
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
