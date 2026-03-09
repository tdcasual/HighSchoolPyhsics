import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sceneCatalogPath = path.resolve(__dirname, '../../../config/demo-scenes.json')
const PAGE_ID_PATTERN = /^[a-z][a-z0-9-]*$/
const SMART_LAYOUT_VALUES = new Set(['never', 'enter-only', 'staged'])

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function isNonBlankText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function assertNonBlankText(value, fieldName) {
  if (!isNonBlankText(value)) {
    throw new Error(`${fieldName} must be a non-blank string`)
  }
}

function assertSmartPresentation(value, fieldName) {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object`)
  }

  if (typeof value.layout !== 'string' || !SMART_LAYOUT_VALUES.has(value.layout)) {
    throw new Error(`${fieldName}.layout must be one of never|enter-only|staged`)
  }

  if (typeof value.focus !== 'boolean') {
    throw new Error(`${fieldName}.focus must be boolean`)
  }

  if (typeof value.stickySummary !== 'boolean') {
    throw new Error(`${fieldName}.stickySummary must be boolean`)
  }
}

export function parseSceneCatalog() {
  const raw = readFileSync(sceneCatalogPath, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('config/demo-scenes.json must be an array')
  }
  return parsed
}

export function buildDemoCatalog(scenes) {
  if (!Array.isArray(scenes)) {
    throw new Error('config/demo-scenes.json must be an array')
  }

  const seenPageIds = new Set()

  return scenes.map((scene, index) => {
    const sceneField = `scene[${index}]`

    if (!isRecord(scene)) {
      throw new Error(`${sceneField} must be an object`)
    }

    assertNonBlankText(scene.pageId, `${sceneField}.pageId`)
    if (!PAGE_ID_PATTERN.test(scene.pageId)) {
      throw new Error(`${sceneField}.pageId must match ^[a-z][a-z0-9-]*$`)
    }

    if (seenPageIds.has(scene.pageId)) {
      throw new Error(`duplicate scene pageId "${scene.pageId}" at index ${index}`)
    }

    seenPageIds.add(scene.pageId)
    assertNonBlankText(scene.label, `${sceneField}.label`)

    if (!isRecord(scene.playwright)) {
      throw new Error(`${sceneField}.playwright must be an object`)
    }

    assertNonBlankText(scene.playwright.readyText, `${sceneField}.playwright.readyText`)
    assertNonBlankText(scene.playwright.screenshotName, `${sceneField}.playwright.screenshotName`)

    if (!isRecord(scene.classroom)) {
      throw new Error(`${sceneField}.classroom must be an object`)
    }

    assertSmartPresentation(scene.classroom.smartPresentation, `${sceneField}.classroom.smartPresentation`)

    return {
      pageId: scene.pageId,
      path: `/${scene.pageId}`,
      enterButton: `进入${scene.label}`,
      readyText: scene.playwright.readyText,
      screenshotName: scene.playwright.screenshotName,
      classroom: scene.classroom,
    }
  })
}

export const DEMO_CATALOG = buildDemoCatalog(parseSceneCatalog())
