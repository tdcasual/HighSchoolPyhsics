#!/usr/bin/env node
// Classroom interaction regression at 1920×1080, the checks earlier audit rounds did by hand:
//   - every scene opens without page errors, shows the data panel, and its
//     单步 (button and "." key) changes the picture and then holds still;
//   - overview: search and the 1–9 shortcuts; every scene opens from its card and returns,
//     on a desktop and on a touch phone (gesture hint, no sideways scrolling);
//   - measuring instruments: the legacy link, one-click and arrow-key fine steps, practice opens
//     on the scale close-up, dragging the thimble turns it.
//   npm run test:interaction              all checks
//   npm run test:interaction -- mhd       scene checks for selected scenes only
// Set CHROME_PATH to use a system Chrome instead of Playwright's bundled browser.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DEMO_CATALOG } from './shared/demoCatalog.mjs'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUTPUT_DIR = path.join(ROOT_DIR, 'output/playwright/interaction-regression')
const requested = process.argv.slice(2)
const scenes = DEMO_CATALOG.filter((demo) => requested.length === 0 || requested.includes(demo.pageId))


const failures = []
function check(ok, message) {
  if (!ok) failures.push(message)
  console.log(`${ok ? '[ok]  ' : '[FAIL]'} ${message}`)
}

/** Screenshot of the 3D canvas; WebGL canvases cannot be read back reliably with toDataURL. */
async function canvasImage(page) {
  return (await page.locator('canvas').first().screenshot()).toString('base64')
}

async function freshPage(context, url) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  return { page, errors }
}

function readingOf(text) {
  const match = text.match(/示数\s*([\d.]+)\s*mm/)
  return match ? Number(match[1]) : Number.NaN
}

async function checkScene(context, baseUrl, demo) {
  const { page, errors } = await freshPage(context, `${baseUrl}${demo.path}`)
  try {
    await page.getByText(demo.readyText).first().waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForSelector('canvas', { timeout: 20000 })
    await page.waitForTimeout(1500)
    check(await page.getByRole('region', { name: '数据' }).isVisible(), `${demo.pageId}: data panel visible`)
    // Static scenes (fields, patterns, meters) have no playback panel; the rest must show it.
    const playback = page.getByRole('region', { name: '播放控制' })

    // A scene that opens playing (its button reads 暂停…) must actually move.
    const pause = playback.getByRole('button', { name: /^暂停/ })
    if (await pause.count()) {
      const first = await canvasImage(page)
      await page.waitForTimeout(700)
      check(first !== (await canvasImage(page)), `${demo.pageId}: the picture moves while playing`)
    }

    const step = playback.getByRole('button', { name: /^(单步|\+)/ }).first()
    if (await step.count()) {
      await step.click()
      await page.waitForTimeout(600)
      const afterButton = await canvasImage(page)
      await page.keyboard.press('.')
      await page.waitForTimeout(600)
      const afterKey = await canvasImage(page)
      await page.waitForTimeout(600)
      check(afterKey !== afterButton, `${demo.pageId}: "." steps the picture`)
      check(afterKey === (await canvasImage(page)), `${demo.pageId}: picture holds still after 单步`)
    }
    check(errors.length === 0, `${demo.pageId}: no page errors${errors.length ? ` (${errors[0]})` : ''}`)
  } catch (error) {
    check(false, `${demo.pageId}: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${demo.pageId}-failure.png`) })
  } finally {
    await page.close()
  }
}

async function checkOverview(context, baseUrl) {
  const { page, errors } = await freshPage(context, `${baseUrl}/`)
  try {
    await page.waitForSelector('.scene-card', { timeout: 20000 })
    check((await page.locator('.scene-card').count()) === DEMO_CATALOG.length, 'overview: one card per catalog scene')
    await page.getByRole('searchbox').fill('李萨如')
    check((await page.locator('.scene-card-name').allInnerTexts()).join() === '示波器', 'overview: search matches card highlights')
    await page.getByRole('searchbox').fill('')
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('1')
    await page.waitForURL(/\/ticker-timer$/, { timeout: 5000 })
    check(true, 'overview: "1" opens the first card')
    check(errors.length === 0, 'overview: no page errors')
  } catch (error) {
    check(false, `overview: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
  } finally {
    await page.close()
  }
}

/**
 * Opens every scene from its overview card and comes back, as a teacher does: on a 1920×1080
 * desktop, and on a 390×844 touch phone (touch-only gesture hint, no sideways scrolling).
 */
async function checkRoundTrip(context, baseUrl, phone) {
  const device = phone ? 'phone' : 'desktop'
  const { page, errors } = await freshPage(context, `${baseUrl}/`)
  const overview = page.getByRole('heading', { name: '高中物理 3D 课堂' })
  try {
    await overview.waitFor({ timeout: 20000 })
    for (const demo of DEMO_CATALOG) {
      const card = page.locator('.scene-card').filter({ has: page.locator('.scene-card-name').getByText(demo.label, { exact: true }) })
      await card.click(phone ? { force: true } : undefined)
      await page.waitForURL(`${baseUrl}${demo.path}`, { timeout: 15000 })
      // The overview stays mounted (hidden) and some card names equal a scene's ready text.
      await page.getByText(demo.readyText).filter({ visible: true }).first().waitFor({ timeout: 15000 })
      if (phone) {
        await page.getByText(/单指旋转.*双指缩放\/平移/).first().waitFor({ timeout: 5000 })
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
        if (overflow) check(false, `${demo.pageId}: no horizontal scrolling on a phone`)
      }
      await page.getByRole('button', { name: /^返回/ }).click()
      await overview.waitFor({ timeout: 15000 })
    }
    check(true, `${device}: every scene opens from the overview and returns`)
    check(errors.length === 0, `${device} round trip: no page errors${errors.length ? ` (${errors[0]})` : ''}`)
  } catch (error) {
    check(false, `${device} round trip: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${device}-round-trip-failure.png`) })
  } finally {
    await page.close()
  }
}

async function checkMeasuringInstruments(context, baseUrl) {
  // The old combined scene's URL still opens the caliper.
  let { page } = await freshPage(context, `${baseUrl}/measuring-tools`)
  const reading = async () => readingOf(await page.getByRole('region', { name: '数据' }).innerText())
  try {
    await page.getByText('游标卡尺控制').first().waitFor({ timeout: 20000 })
    check(true, 'vernier-caliper: the legacy /measuring-tools link opens it')
    await page.waitForSelector('canvas', { timeout: 20000 })
    await page.waitForTimeout(1500)
    const start = await reading()
    await page.getByRole('region', { name: '播放控制' }).getByRole('button', { name: '+0.05 mm' }).click()
    await page.keyboard.press('ArrowRight')
    check(Math.abs((await reading()) - start - 0.1) < 1e-6, 'vernier-caliper: +0.05 mm and → each move one least count')
    await page.getByRole('radio', { name: '读数练习', exact: true }).click()
    await page.getByRole('button', { name: '出题', exact: true }).click()
    check(await page.getByRole('radio', { name: '刻度', exact: true }).isChecked(), 'vernier-caliper: a question opens on the scale close-up')
    await page.getByRole('button', { name: '结束本题并返回自由调节', exact: true }).click()
    check(await page.getByRole('radio', { name: '全景', exact: true }).isChecked(), 'vernier-caliper: ending practice restores the view')
  } catch (error) {
    check(false, `vernier-caliper: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'vernier-caliper-failure.png') })
  } finally {
    await page.close()
  }

  ;({ page } = await freshPage(context, `${baseUrl}/micrometer`))
  try {
    await page.waitForSelector('canvas', { timeout: 20000 })
    await page.getByRole('radio', { name: '刻度', exact: true }).click()
    await page.waitForTimeout(1500)
    const start = await reading()
    // The scale close-up puts the thimble at the right of the free area; drag down across it.
    const box = await page.locator('canvas').first().boundingBox()
    const x = box.x + box.width * 0.9
    const y = box.y + box.height * 0.5
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 80, { steps: 12 })
    await page.mouse.up()
    const turned = (await reading()) - start
    // About 23 px per division in the close-up: 80 px is a few divisions; a slide would be millimetres.
    check(turned > 0.02 && turned < 0.2, `micrometer: dragging the thimble down turns it (+${turned.toFixed(3)} mm)`)
  } catch (error) {
    check(false, `micrometer: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'micrometer-failure.png') })
  } finally {
    await page.close()
  }
}

await mkdir(OUTPUT_DIR, { recursive: true })
const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({ defaultBaseUrl: 'http://127.0.0.1:4185', env: process.env })

// PLAYWRIGHT_SERVER_MODE=preview serves the production build (run npm run build first); CI uses it.
await runWithManagedViteServer({ rootDir: ROOT_DIR, baseUrl, devPort, logPath: path.join(OUTPUT_DIR, 'vite-dev.log'), mode: process.env.PLAYWRIGHT_SERVER_MODE || 'dev' }, async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
  })
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    if (requested.length === 0) {
      await checkOverview(context, baseUrl)
      await checkRoundTrip(context, baseUrl, false)
      const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
      await checkRoundTrip(phone, baseUrl, true)
      await phone.close()
      await checkMeasuringInstruments(context, baseUrl)
    }
    for (const demo of scenes) await checkScene(context, baseUrl, demo)
  } finally {
    await browser.close()
  }
})

if (failures.length > 0) {
  console.error(`\n${failures.length} interaction check(s) failed:`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exitCode = 1
} else {
  console.log('\nInteraction regression passed.')
}
