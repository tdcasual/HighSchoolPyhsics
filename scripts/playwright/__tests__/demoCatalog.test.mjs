import { describe, expect, it } from 'vitest'
import { DEMO_CATALOG, buildDemoCatalog, parseSceneCatalog } from '../shared/demoCatalog.mjs'

describe('playwright demo catalog', () => {
  it('stays aligned with the validated shared scene catalog builder', () => {
    expect(DEMO_CATALOG).toEqual(buildDemoCatalog(parseSceneCatalog()))
  })

  it('keeps unique path and screenshot identifiers', () => {
    const paths = DEMO_CATALOG.map((demo) => demo.path)
    const screenshotNames = DEMO_CATALOG.map((demo) => demo.screenshotName)

    expect(new Set(paths).size).toBe(paths.length)
    expect(new Set(screenshotNames).size).toBe(screenshotNames.length)
  })

  it('includes required UI selectors for each demo', () => {
    for (const demo of DEMO_CATALOG) {
      expect(demo.enterButton.trim().length).toBeGreaterThan(0)
      expect(demo.readyText.trim().length).toBeGreaterThan(0)
      expect(demo.path.startsWith('/')).toBe(true)
    }
  })
})
