import { describe, expect, it } from 'vitest'
import sceneCatalog from '../../../config/demo-scenes.json'
import { DEMO_CATALOG } from '../shared/demoCatalog.mjs'
import { build1080pPresentationCases } from '../shared/presentationRegressionCases.mjs'

describe('playwright demo catalog', () => {
  it('stays aligned with shared scene catalog length', () => {
    expect(DEMO_CATALOG).toHaveLength(sceneCatalog.length)
  })

  it('keeps unique path and screenshot identifiers', () => {
    const paths = DEMO_CATALOG.map((demo) => demo.path)
    const screenshotNames = DEMO_CATALOG.map((demo) => demo.screenshotName)

    expect(new Set(paths).size).toBe(paths.length)
    expect(new Set(screenshotNames).size).toBe(screenshotNames.length)
  })


  it('covers every catalog demo in the 1080p presentation regression plan', () => {
    const cases = build1080pPresentationCases()
    expect(cases.map((item) => item.path).sort()).toEqual(DEMO_CATALOG.map((demo) => demo.path).sort())
  })


  it('keeps regression expectations aligned with classroom smart-presentation semantics', () => {
    const cases = build1080pPresentationCases()

    for (const testCase of cases) {
      const smart = testCase.classroom.smartPresentation

      if (!smart.focus) {
        expect(testCase.expectedFocus).toBe('overview')
      }

      if (smart.layout === 'staged') {
        expect(typeof testCase.prepare).toBe('function')
      } else {
        expect(testCase.prepare).toBeUndefined()
      }

      if (!smart.stickySummary) {
        expect(testCase.expectedLayout).not.toBe('split-sticky-summary')
      }
    }
  })

  it('includes required UI selectors for each demo', () => {
    for (const demo of DEMO_CATALOG) {
      expect(demo.enterButton.trim().length).toBeGreaterThan(0)
      expect(demo.readyText.trim().length).toBeGreaterThan(0)
      expect(demo.path.startsWith('/')).toBe(true)
    }
  })
})
