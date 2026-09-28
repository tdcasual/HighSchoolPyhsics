#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/rotational-emf-audit')
await mkdir(outputDir, { recursive: true })

const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({
  defaultBaseUrl: 'http://127.0.0.1:4176',
  env: process.env,
})

await runWithManagedViteServer({
  rootDir,
  baseUrl,
  devPort,
  logPath: path.join(outputDir, 'vite-dev.log'),
}, async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'],
  })
  const errors = []
  const collectErrors = (page, prefix) => {
    page.on('pageerror', (error) => errors.push(`${prefix} pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`${prefix} console: ${message.text()}`)
    })
  }
  const canvas = (page) => page.locator('canvas')
  const summary = (page) => page.locator('.scene-core-summary-stack')
  const readAngle = async (page) => {
    const text = await summary(page).innerText()
    return Number(text.match(/当前转角:\s*(\d+)/)?.[1])
  }
  const compareScreenshots = (before, after, label) => {
    const first = PNG.sync.read(before)
    const second = PNG.sync.read(after)
    if (first.width !== second.width || first.height !== second.height) throw new Error(`${label}: screenshot dimensions changed`)
    const changed = pixelmatch(first.data, second.data, null, first.width, first.height, { threshold: 0.12 })
    console.log(`${label}: ${changed} changed pixels (${(100 * changed / (first.width * first.height)).toFixed(2)}%)`)
    const minimumChangedPixels = first.width * first.height * (label === 'Frame rotation' ? 0.01 : 0.02)
    if (changed < minimumChangedPixels) throw new Error(`${label}: camera preset did not visibly change the apparatus`)
  }

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    collectErrors(page, 'desktop')
    await page.goto(`${baseUrl}/rotational-emf`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: '旋转切割磁感线控制' }).waitFor({ state: 'visible', timeout: 15000 })
    await canvas(page).waitFor({ state: 'visible' })
    await page.waitForTimeout(1200)

    const dataPanel = page.getByRole('region', { name: '数据' })
    const playbackPanel = page.getByRole('region', { name: '播放控制' })
    if (!(await dataPanel.getByRole('button', { name: '展开' }).isVisible())) throw new Error('Data overlay should start collapsed')
    if (!(await playbackPanel.getByRole('button', { name: '展开' }).isVisible())) throw new Error('Playback overlay should start collapsed')
    const initialDataBox = await dataPanel.boundingBox()
    const initialPlaybackBox = await playbackPanel.boundingBox()
    if (!initialDataBox || !initialPlaybackBox || initialDataBox.x > 560 || initialPlaybackBox.y < initialDataBox.y + initialDataBox.height - 1) {
      throw new Error('Collapsed data and playback panels should stack beside the control sidebar')
    }
    await page.screenshot({ path: path.join(outputDir, 'desktop-rod-main.png'), fullPage: true })

    const mainView = await canvas(page).screenshot()
    await page.getByRole('radio', { name: '俯视图' }).click()
    await page.waitForTimeout(500)
    const topView = await canvas(page).screenshot()
    compareScreenshots(mainView, topView, 'Main/top camera switch')
    await page.screenshot({ path: path.join(outputDir, 'desktop-rod-top.png'), fullPage: true })
    await page.getByRole('radio', { name: '主视图' }).click()

    await page.getByRole('radio', { name: '旋转矩形线框' }).click()
    await page.waitForTimeout(500)
    const frameMain = await canvas(page).screenshot()
    if (pixelmatch(PNG.sync.read(mainView).data, PNG.sync.read(frameMain).data, null, PNG.sync.read(mainView).width, PNG.sync.read(mainView).height, { threshold: 0.12 }) < 2000) {
      throw new Error('Switching rod/frame mode did not visibly change the apparatus')
    }
    await page.screenshot({ path: path.join(outputDir, 'desktop-frame-main.png'), fullPage: true })

    await dataPanel.getByRole('button', { name: '展开' }).click()
    await playbackPanel.getByRole('button', { name: '展开' }).click()
    await page.waitForTimeout(250)
    const expandedDataBox = await dataPanel.boundingBox()
    const expandedPlaybackBox = await playbackPanel.boundingBox()
    if (!expandedDataBox || !expandedPlaybackBox || expandedPlaybackBox.y < expandedDataBox.y + expandedDataBox.height - 1) {
      throw new Error('Expanded data and playback panels must not overlap')
    }
    await page.getByText('感应电动势: 1.00 V', { exact: true }).waitFor({ state: 'visible' })
    await page.locator('#rotational-emf-omega').focus()
    await page.keyboard.press('End')
    await page.getByText('B: 1.0 T · ω: 3.0 rad/s · L: 1.0 m', { exact: true }).waitFor({ state: 'visible' })
    await page.getByText('感应电动势: 3.00 V', { exact: true }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: '播放' }).click()
    await page.waitForFunction(() => {
      const text = document.querySelector('.scene-core-summary-stack')?.textContent ?? ''
      const angle = Number(text.match(/当前转角:\s*(\d+)/)?.[1])
      const emf = Number(text.match(/感应电动势:\s*([\d.]+)/)?.[1])
      return angle >= 84 && angle <= 96 && emf < 0.32
    }, null, { timeout: 2500 })
    await page.getByRole('button', { name: '暂停' }).click()
    await page.getByRole('button', { name: '播放' }).waitFor({ state: 'visible' })
    await page.waitForTimeout(200)
    const angleAfterPause = await readAngle(page)
    await page.waitForTimeout(200)
    const angleAfterPauseSettled = await readAngle(page)
    if (Math.abs(angleAfterPause - angleAfterPauseSettled) > 1) throw new Error('Angle kept moving after pause')
    const frameRotated = await canvas(page).screenshot({ path: path.join(outputDir, 'frame-rotated-canvas.png') })
    compareScreenshots(frameMain, frameRotated, 'Frame rotation')
    await page.screenshot({ path: path.join(outputDir, 'desktop-frame-quarter-turn.png'), fullPage: true })

    await page.getByRole('radio', { name: '旋转导体棒' }).click()
    await page.waitForFunction(() => {
      const text = document.querySelector('.scene-core-summary-stack')?.textContent ?? ''
      return text.includes('感应电动势: 1.50 V')
    })
    await page.getByRole('button', { name: '重置' }).click()
    await page.getByText('B: 1.0 T · ω: 1.0 rad/s · L: 1.0 m', { exact: true }).waitFor({ state: 'visible' })
    await page.getByText('当前转角: 0°', { exact: true }).waitFor({ state: 'visible' })
    await page.getByText('感应电动势: 0.50 V', { exact: true }).waitFor({ state: 'visible' })

    await page.locator('#rotational-emf-length').focus()
    await page.keyboard.press('End')
    await page.getByText('B: 1.0 T · ω: 1.0 rad/s · L: 3.0 m', { exact: true }).waitFor({ state: 'visible' })
    await page.screenshot({ path: path.join(outputDir, 'desktop-rod-max-length.png'), fullPage: true })
    await page.locator('#rotational-emf-length').focus()
    await page.keyboard.press('Home')
    await page.getByText('B: 1.0 T · ω: 1.0 rad/s · L: 0.2 m', { exact: true }).waitFor({ state: 'visible' })
    await page.screenshot({ path: path.join(outputDir, 'desktop-rod-min-length.png'), fullPage: true })

    await page.getByRole('radio', { name: '旋转矩形线框' }).click()
    await page.locator('#rotational-emf-length').focus()
    await page.keyboard.press('End')
    await page.getByText('B: 1.0 T · ω: 1.0 rad/s · L: 3.0 m', { exact: true }).waitFor({ state: 'visible' })
    await page.getByText('感应电动势: 9.00 V', { exact: true }).waitFor({ state: 'visible' })
    await page.screenshot({ path: path.join(outputDir, 'desktop-frame-max-length.png'), fullPage: true })
    await page.locator('#rotational-emf-length').focus()
    await page.keyboard.press('Home')
    await page.getByText('B: 1.0 T · ω: 1.0 rad/s · L: 0.2 m', { exact: true }).waitFor({ state: 'visible' })
    await page.getByText('感应电动势: 0.04 V', { exact: true }).waitFor({ state: 'visible' })
    await page.screenshot({ path: path.join(outputDir, 'desktop-frame-min-length.png'), fullPage: true })

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    collectErrors(mobile, 'mobile')
    await mobile.goto(`${baseUrl}/rotational-emf`, { waitUntil: 'domcontentloaded' })
    await mobile.getByRole('heading', { name: '旋转切割磁感线控制' }).waitFor({ state: 'visible', timeout: 15000 })
    await canvas(mobile).waitFor({ state: 'visible' })
    await mobile.waitForTimeout(1200)
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error('Mobile view overflows horizontally at 390px')
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-main.png'), fullPage: true })
    const mobileMain = await canvas(mobile).screenshot()
    await mobile.getByRole('radio', { name: '俯视图' }).click()
    await mobile.waitForTimeout(400)
    compareScreenshots(mobileMain, await canvas(mobile).screenshot(), 'Mobile main/top camera switch')
    await mobile.getByRole('radio', { name: '旋转矩形线框' }).click()
    await mobile.waitForTimeout(300)
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error('Mobile frame controls overflow horizontally at 390px')
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-frame-top.png'), fullPage: true })

    if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`)
    console.log(`Rotational-emf desktop/mobile view, angle, formula, reset and length-boundary checks passed. Artifacts: ${outputDir}`)
  } finally {
    await browser.close()
  }
})
