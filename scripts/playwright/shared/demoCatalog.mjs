import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sceneCatalogPath = path.resolve(__dirname, '../../../config/demo-scenes.json')

function parseSceneCatalog() {
  const raw = readFileSync(sceneCatalogPath, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('config/demo-scenes.json must be an array')
  }
  return parsed
}

export const DEMO_CATALOG = parseSceneCatalog().map((scene) => ({
  pageId: scene.pageId,
  path: `/${scene.pageId}`,
  enterButton: `进入${scene.label}`,
  readyText: scene.playwright.readyText,
  screenshotName: scene.playwright.screenshotName,
  classroom: scene.classroom,
}))
