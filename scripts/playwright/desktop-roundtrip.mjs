#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/desktop-roundtrip')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:4174'
const DEV_PORT = new URL(BASE_URL).port || '4174'

const DEMOS = [
  { path: '/oscilloscope', enterButton: '进入示波器', readyText: '示波器控制', screenshotName: 'oscilloscope' },
  { path: '/cyclotron', enterButton: '进入回旋加速器', readyText: '磁场 B (T)', screenshotName: 'cyclotron' },
  { path: '/mhd', enterButton: '进入磁流体发电机', readyText: '磁流体发电机控制', screenshotName: 'mhd' },
  { path: '/oersted', enterButton: '进入奥斯特实验', readyText: '奥斯特电流磁效应', screenshotName: 'oersted' },
]

function startDevServer() {
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', DEV_PORT], {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const logStream = createWriteStream(DEV_SERVER_LOG, { flags: 'a' })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)

  return { child, logStream }
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // ignore until timeout
    }
    await delay(300)
  }
  throw new Error(`Vite dev server did not become ready: ${url}`)
}

async function stopDevServer(server) {
  if (!server) {
    return
  }

  const { child, logStream } = server

  if (child.exitCode === null) {
    child.kill('SIGTERM')
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      delay(3000),
    ])
    if (child.exitCode === null) {
      child.kill('SIGKILL')
    }
  }

  logStream.end()
}

async function run() {
  await mkdir(LOG_DIR, { recursive: true })

  const server = startDevServer()
  let browser = null

  try {
    await waitForServer(BASE_URL)

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })

    for (const demo of DEMOS) {
      await page.getByRole('button', { name: demo.enterButton }).click()
      await page.waitForURL(`${BASE_URL}${demo.path}`, { timeout: 15000 })
      await page.getByText(demo.readyText).first().waitFor({ state: 'visible', timeout: 15000 })
      await page.getByRole('button', { name: '返回导航' }).waitFor({ state: 'visible', timeout: 15000 })

      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${demo.screenshotName}-desktop-roundtrip.png`),
        fullPage: true,
      })

      await page.getByRole('button', { name: '返回导航' }).click()
      await page.waitForURL(BASE_URL, { timeout: 15000 })
      await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })
    }

    console.log(`Desktop roundtrip completed. Artifacts: ${OUTPUT_DIR}`)
  } finally {
    if (browser) {
      await browser.close()
    }
    await stopDevServer(server)
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

