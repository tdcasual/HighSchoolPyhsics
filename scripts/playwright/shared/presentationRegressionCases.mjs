import { DEMO_CATALOG } from './demoCatalog.mjs'

const CASE_OVERRIDES = {
  oscilloscope: {
    expectedLayout: 'split',
    expectedFocus: 'overview',
  },
  cyclotron: {
    expectedLayout: 'split-sticky-summary',
    expectedFocus: 'focus',
  },
  mhd: {
    expectedLayout: 'viewport',
    expectedFocus: 'overview',
  },
  oersted: {
    expectedLayout: 'viewport',
    expectedFocus: 'overview',
  },
  equipotential: {
    expectedLayout: 'split-sticky-summary',
    expectedFocus: 'overview',
  },
  'potential-energy': {
    expectedLayout: 'viewport',
    expectedFocus: 'focus',
    prepare: async (page, helpers) => {
      await helpers.openControlsIfCollapsed(page)
      await page.getByRole('button', { name: '1. 显示电势切片' }).click()
      await page.getByRole('button', { name: '2. 开始旋转' }).click()
    },
  },
  'electrostatic-lab': {
    expectedLayout: 'split-sticky-summary',
    expectedFocus: 'focus',
  },
  'motional-emf': {
    expectedLayout: 'split',
    expectedFocus: 'overview',
  },
  'induction-current': {
    expectedLayout: 'split',
    expectedFocus: 'focus',
    prepare: async (page, helpers) => {
      await helpers.openControlsIfCollapsed(page)
      await page.getByRole('button', { name: '↓ 向下运动 (接近)' }).click()
    },
  },
}

export function build1080pPresentationCases() {
  return DEMO_CATALOG.map((demo) => {
    const overrides = CASE_OVERRIDES[demo.pageId]
    if (!overrides) {
      throw new Error(`Missing 1080p presentation regression case for ${demo.pageId}`)
    }

    return {
      ...demo,
      ...overrides,
    }
  })
}
