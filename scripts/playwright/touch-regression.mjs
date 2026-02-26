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
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/touch-regression')
const LOG_DIR = path.join(OUTPUT_DIR, 'logs')
const DEV_SERVER_LOG = path.join(LOG_DIR, 'vite-dev.log')
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:4173'

const DEMOS = [
  { enterButton: '进入示波器', readyText: '示波器控制', screenshotName: 'oscilloscope' },
  { enterButton: '进入回旋加速器', readyText: '磁场 B (T)', screenshotName: 'cyclotron' },
  { enterButton: '进入磁流体发电机', readyText: '磁流体发电机控制', screenshotName: 'mhd' },
  { enterButton: '进入奥斯特实验', readyText: '奥斯特电流磁效应', screenshotName: 'oersted' },
]

function startDevServer() {
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
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

  const server = startDevServer()
  let browser = null

  try {
    await waitForServer(BASE_URL)

    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })

    const page = await context.newPage()
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: '演示导航' }).waitFor({ state: 'visible', timeout: 15000 })

    for (const demo of DEMOS) {
      await page.getByRole('button', { name: demo.enterButton }).click({ force: true })
      await page.getByText(demo.readyText).first().waitFor({ state: 'visible', timeout: 15000 })
      await page.locator('.interactive-canvas-surface').first().waitFor({ state: 'visible', timeout: 15000 })

      await triggerThreeFingerModeSwitch(page)
      await page.getByText('已切换精细模式').waitFor({ state: 'visible', timeout: 5000 })
      await page.getByText(/三指切换模式（精细模式）/).waitFor({ state: 'visible', timeout: 5000 })

      await triggerDoubleTapReset(page)
      await page.getByText('已重置视角').waitFor({ state: 'visible', timeout: 5000 })

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
    await stopDevServer(server)
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
