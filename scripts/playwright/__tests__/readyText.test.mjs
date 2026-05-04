import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_CATALOG } from '../shared/demoCatalog.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../../..')
const SCENES_DIR = path.join(ROOT_DIR, 'src/scenes')

function readSceneSourceFiles(pageId) {
  const sceneDir = path.join(SCENES_DIR, pageId)
  try {
    const files = readdirSync(sceneDir).filter((f) => f.endsWith('.tsx') && !f.includes('__tests__'))
    return files.map((f) => readFileSync(path.join(sceneDir, f), 'utf8')).join('\n')
  } catch {
    return ''
  }
}

describe('readyText matches rendered content', () => {
  for (const demo of DEMO_CATALOG) {
    it(`${demo.pageId}: readyText "${demo.readyText}" exists in scene source`, () => {
      const source = readSceneSourceFiles(demo.pageId)
      expect(source).toContain(demo.readyText)
    })
  }
})
