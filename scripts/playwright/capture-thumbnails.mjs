#!/usr/bin/env node
// Regenerates public/screenshots/<pageId>.webp (the overview cards) from each scene's opening state.
// Lecture mode hides the shell so the composition is centered; the image is cropped to the content
// and encoded as 640×400 WebP by the browser itself, so no image library is needed.
//   npm run thumbnails            all scenes
//   npm run thumbnails -- mhd     selected scenes
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveManagedPlaywrightRuntime, runWithManagedViteServer } from './shared/runtime.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outputDir = path.join(rootDir, 'public/screenshots')
const catalog = JSON.parse(await readFile(path.join(rootDir, 'config/demo-scenes.json'), 'utf8'))
const requested = process.argv.slice(2)
const pageIds = catalog.map((entry) => entry.pageId).filter((id) => requested.length === 0 || requested.includes(id))

const { baseUrl, devPort } = await resolveManagedPlaywrightRuntime({ defaultBaseUrl: 'http://127.0.0.1:4178', env: process.env })

await runWithManagedViteServer({ rootDir, baseUrl, devPort, logPath: path.join(rootDir, 'output/thumbnails-vite.log') }, async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
  })
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
    for (const pageId of pageIds) {
      await page.goto(`${baseUrl}/${pageId}`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('canvas', { timeout: 20000 })
      await page.keyboard.press('p')
      await page.addStyleTag({ content: '.floating-panel, .presenting-exit { display: none !important; }' })
      await page.waitForTimeout(2500)
      const png = (await page.screenshot()).toString('base64')
      const webp = await page.evaluate(async (source) => {
        const image = new Image()
        image.src = `data:image/png;base64,${source}`
        await image.decode()
        const full = document.createElement('canvas')
        full.width = image.width
        full.height = image.height
        const context = full.getContext('2d')
        context.drawImage(image, 0, 0)
        const { data, width, height } = context.getImageData(0, 0, full.width, full.height)
        // Background = the corner colour; content = pixels that differ from it noticeably.
        const [br, bg, bb] = [data[0], data[1], data[2]]
        let left = width, right = 0, top = height, bottom = 0
        for (let y = 0; y < height; y += 2) {
          for (let x = 0; x < width; x += 2) {
            const i = (y * width + x) * 4
            if (Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb) > 36) {
              if (x < left) left = x
              if (x > right) right = x
              if (y < top) top = y
              if (y > bottom) bottom = y
            }
          }
        }
        if (right <= left || bottom <= top) { left = 0; top = 0; right = width; bottom = height }
        // Pad, then grow the box to the card's 16:10 ratio around its centre.
        const pad = 0.08
        let w = (right - left) * (1 + pad * 2)
        let h = (bottom - top) * (1 + pad * 2)
        if (w / h > 1.6) h = w / 1.6
        else w = h * 1.6
        w = Math.min(w, width)
        h = Math.min(h, height)
        const cx = (left + right) / 2
        const cy = (top + bottom) / 2
        const sx = Math.max(0, Math.min(width - w, cx - w / 2))
        const sy = Math.max(0, Math.min(height - h, cy - h / 2))
        const out = document.createElement('canvas')
        out.width = 640
        out.height = 400
        out.getContext('2d').drawImage(full, sx, sy, w, h, 0, 0, 640, 400)
        return out.toDataURL('image/webp', 0.82).split(',')[1]
      }, png)
      await writeFile(path.join(outputDir, `${pageId}.webp`), Buffer.from(webp, 'base64'))
      console.log(`[ok] ${pageId}.webp`)
    }
  } finally {
    await browser.close()
  }
})
