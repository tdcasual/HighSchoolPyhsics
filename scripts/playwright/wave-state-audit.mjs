#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const filename = fileURLToPath(import.meta.url)
const rootDir = path.resolve(path.dirname(filename), '../..')
const outputDir = path.join(rootDir, 'output/playwright/wave-state-audit')
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
    page.on('pageerror', (error) => errors.push(prefix + ' pageerror: ' + error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(prefix + ' console: ' + message.text()) })
  }
  const region = (page, name) => page.getByRole('region', { name })
  const setRange = async (page, selector, target) => {
    const input = page.locator(selector)
    await input.focus()
    const step = Number(await input.getAttribute('step') || 1)
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const current = Number(await input.inputValue())
      if (current === target) break
      const key = current < target ? 'ArrowRight' : 'ArrowLeft'
      await input.press(key)
      await page.waitForTimeout(100)
    }
    await input.dispatchEvent('pointerup')
    await page.waitForFunction(({ rangeSelector, expected }) => {
      const range = document.querySelector(rangeSelector)
      return range instanceof HTMLInputElement && Number(range.value) === expected
    }, { rangeSelector: selector, expected: target }, { timeout: 3000 }).catch(async () => { throw new Error(selector + " failed to reach " + target + "; current=" + await input.inputValue()) })
  }
  const assertPanelsDoNotOverlap = async (page, firstName, secondName) => {
    const first = await region(page, firstName).boundingBox()
    const second = await region(page, secondName).boundingBox()
    if (!first || !second) throw new Error('Expected visible panels: ' + firstName + ', ' + secondName)
    const overlapX = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x)
    const overlapY = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y)
    if (overlapX > 1 && overlapY > 1) throw new Error(firstName + ' and ' + secondName + ' overlap by ' + overlapX.toFixed(1) + 'x' + overlapY.toFixed(1) + 'px')
  }
  const assertPanelBounds = async (page, width) => {
    const panels = await page.evaluate(() => Array.from(document.querySelectorAll('.floating-panel')).map((el) => {
      const box = el.getBoundingClientRect()
      return { title: el.querySelector('.panel-header span')?.textContent, left: box.left, right: box.right }
    }))
    const outside = panels.filter((panel) => panel.left < 0 || panel.right > width)
    if (outside.length) throw new Error('Floating panels leave the ' + width + 'px viewport: ' + JSON.stringify(panels))
  }

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    collectErrors(desktop, 'desktop')
    await desktop.goto(baseUrl + '/wave-state', { waitUntil: 'domcontentloaded' })
    await desktop.locator('.wave-state-controls h2').waitFor()
    await desktop.locator('canvas').waitFor({ state: 'visible' })
    await desktop.waitForTimeout(250)

    for (const name of ['数据', '图表']) {
      if (!(await region(desktop, name).getByRole('button', { name: '展开' }).isVisible())) {
        throw new Error(name + ' must start collapsed to preserve the wave view')
      }
    }
    const playback = region(desktop, '播放控制')
    if (!(await playback.getByRole('button', { name: '开始传播' }).isVisible())) {
      throw new Error('The wave should start paused at t=0 with an available start action')
    }
    await assertPanelBounds(desktop, 1440)
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-initial.png'), fullPage: true })
    await desktop.locator('canvas').screenshot({ path: path.join(outputDir, 'desktop-initial-canvas.png') })

    const data = region(desktop, '数据')
    await data.getByRole('button', { name: '展开' }).click()
    if (!(await desktop.getByTestId('wave-state-sim-time').innerText()).includes('0.00')) {
      throw new Error('Initial time must be zero')
    }
    await setRange(desktop, '#wave-state-probe', 0.5)
    await playback.getByRole('button', { name: '开始传播' }).click()

    try {
      await desktop.waitForFunction(() => {
        const status = document.querySelector('[data-testid="wave-state-probe-status"]')?.textContent ?? ''
        const velocity = document.querySelector('.wave-state-velocity-value')?.textContent ?? ''
        return status.includes('已起振') && velocity.includes('↑ 向上')
      }, null, { timeout: 3500 })
    } catch {
      throw new Error('Rightward wave did not reach P=0.5 m with upward velocity: ' + await data.innerText())
    }
    await data.getByRole('button', { name: '折叠' }).click()
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-running.png'), fullPage: true })
    await playback.getByRole('button', { name: '暂停传播' }).click()
    await data.getByRole('button', { name: '展开' }).click()
    const pausedTime = await desktop.getByTestId('wave-state-sim-time').innerText()
    await desktop.waitForTimeout(250)
    if (await desktop.getByTestId('wave-state-sim-time').innerText() !== pausedTime) {
      throw new Error('Pause must stop the simulated time')
    }

    const chart = region(desktop, '图表')
    await chart.getByRole('button', { name: '展开' }).click()
    if (!(await desktop.getByRole('img', { name: '简谐横波 P 点位移时间图' }).isVisible())) {
      throw new Error('The probe displacement-time graph must expand')
    }
    await assertPanelsDoNotOverlap(desktop, '数据', '图表')

    await setRange(desktop, '#wave-state-probe', 7.5)
    await desktop.getByRole('button', { name: '向左传播' }).click()
    if (await desktop.getByTestId('wave-state-sim-time').innerText() !== '0.00 s') {
      throw new Error('Changing direction must reset the phase to t=0')
    }
    await playback.getByRole('button', { name: '开始传播' }).click()
    try {
      await desktop.getByTestId('wave-state-probe-status').getByText('已起振').waitFor({ timeout: 3000 })
    } catch {
      throw new Error('Leftward wave did not reach P=7.5 m: ' + await data.innerText())
    }
    if (!(await desktop.locator('.wave-state-velocity-value').innerText()).includes('↓ 向下')) {
      throw new Error('A downward start should give P a downward velocity when first reached')
    }
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-leftward.png'), fullPage: true })
    await playback.getByRole('button', { name: '暂停传播' }).click()
    await desktop.getByRole('button', { name: '同介质 f×2' }).click()
    if (await desktop.locator('#wave-state-wavelength').inputValue() !== '2') throw new Error('The same-medium f×2 preset should halve wavelength')
    if (await desktop.locator('#wave-state-period').inputValue() !== '1') throw new Error('The same-medium f×2 preset should halve period')
    if (!(await data.innerText()).includes('2.00 m/s')) throw new Error('The f×2 preset should preserve wave speed')
    await desktop.getByRole('button', { name: '振幅×2' }).click()
    if (await desktop.locator('#wave-state-amplitude').inputValue() !== '100') throw new Error('The amplitude preset should set exactly twice the baseline amplitude')
    await desktop.getByRole('button', { name: '显示微平移虚线' }).click()
    await desktop.screenshot({ path: path.join(outputDir, 'desktop-scenarios.png'), fullPage: true })

    const transition = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    collectErrors(transition, 'transition')
    await transition.goto(baseUrl + '/measuring-tools', { waitUntil: 'domcontentloaded' })
    await transition.locator('canvas').waitFor({ state: 'visible' })
    await transition.evaluate(() => { window.history.pushState({}, '', '/wave-state'); window.dispatchEvent(new PopStateEvent('popstate')) })
    await transition.locator('.wave-state-controls h2').waitFor()
    await transition.getByRole('region', { name: '数据' }).getByRole('button', { name: '展开' }).click()
    await transition.getByRole('region', { name: '图表' }).getByRole('button', { name: '展开' }).click()
    await assertPanelsDoNotOverlap(transition, '数据', '图表')
    await transition.screenshot({ path: path.join(outputDir, 'desktop-after-measuring-tools.png'), fullPage: true })

    const tablet = await browser.newPage({ viewport: { width: 768, height: 900 } })
    collectErrors(tablet, 'tablet')
    await tablet.goto(baseUrl + '/wave-state', { waitUntil: 'domcontentloaded' })
    await tablet.locator('.wave-state-controls h2').waitFor()
    await tablet.locator('canvas').waitFor({ state: 'visible' })
    await tablet.waitForTimeout(250)
    await assertPanelBounds(tablet, 768)
    if (await tablet.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) {
      throw new Error('Tablet wave scene overflows horizontally at 768px')
    }
    await tablet.screenshot({ path: path.join(outputDir, 'tablet-initial.png'), fullPage: true })

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    collectErrors(mobile, 'mobile')
    await mobile.goto(baseUrl + '/wave-state', { waitUntil: 'domcontentloaded' })
    await mobile.locator('.wave-state-controls h2').waitFor()
    await mobile.locator('canvas').waitFor({ state: 'visible' })
    await mobile.waitForTimeout(250)
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) {
      throw new Error('Mobile wave scene overflows horizontally at 390px')
    }
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-initial.png'), fullPage: true })
    for (const testId of ['wave-state-title', 'wave-state-source-label', 'wave-state-y-label', 'wave-state-x-label']) {
      const box = await mobile.getByTestId(testId).boundingBox()
      if (!box || box.x < 0 || box.x + box.width > 390) {
        throw new Error(testId + ' must fit inside the 390px mobile viewport: ' + JSON.stringify(box))
      }
    }
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-initial.png'), fullPage: true })
    await mobile.getByRole('button', { name: '向左传播' }).click()
    await mobile.waitForTimeout(100)
    const mobileLeftSource = await mobile.getByTestId('wave-state-source-label').boundingBox()
    if (!mobileLeftSource || mobileLeftSource.x < 0 || mobileLeftSource.x + mobileLeftSource.width > 390) throw new Error('Leftward source label must fit inside mobile viewport: ' + JSON.stringify(mobileLeftSource))
    await mobile.screenshot({ path: path.join(outputDir, 'mobile-leftward.png'), fullPage: true })

    if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '))
    console.log('Wave-state desktop/tablet/mobile layout, panel separation after route transition, wavefront arrival, direction and start phase, half-metre probe, pause/reset, frequency/amplitude presets, chart and ghost-wave checks passed. Artifacts: ' + outputDir)
  } finally {
    await browser.close()
  }
})