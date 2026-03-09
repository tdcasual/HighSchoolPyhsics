import { describe, expect, it } from 'vitest'
import * as demoCatalogModule from '../shared/demoCatalog.mjs'

describe('playwright demo catalog schema validation', () => {
  it('throws a descriptive schema error when scene playwright metadata is malformed', () => {
    expect(() =>
      demoCatalogModule.buildDemoCatalog([
        {
          pageId: 'oscilloscope',
          label: '示波器',
          playwright: null,
          classroom: {},
        },
      ]),
    ).toThrow(/scene\[0\]\.playwright must be an object/i)
  })

  it('throws a descriptive schema error when scene label is malformed', () => {
    expect(() =>
      demoCatalogModule.buildDemoCatalog([
        {
          pageId: 'oscilloscope',
          label: 42,
          playwright: {
            readyText: '示波器控制',
            screenshotName: 'oscilloscope',
          },
          classroom: {},
        },
      ]),
    ).toThrow(/scene\[0\]\.label must be a non-blank string/i)
  })

  it('throws a descriptive schema error when scene pageIds are duplicated', () => {
    expect(() =>
      demoCatalogModule.buildDemoCatalog([
        {
          pageId: 'oscilloscope',
          label: '示波器',
          playwright: {
            readyText: '示波器控制',
            screenshotName: 'oscilloscope',
          },
          classroom: {
            smartPresentation: { layout: 'staged', focus: true, stickySummary: false },
          },
        },
        {
          pageId: 'oscilloscope',
          label: '示波器-重复',
          playwright: {
            readyText: '示波器控制-重复',
            screenshotName: 'oscilloscope-duplicate',
          },
          classroom: {
            smartPresentation: { layout: 'staged', focus: true, stickySummary: false },
          },
        },
      ]),
    ).toThrow(/duplicate scene pageId "oscilloscope" at index 1/i)
  })

  it('throws a descriptive schema error when smartPresentation metadata is malformed', () => {
    expect(() =>
      demoCatalogModule.buildDemoCatalog([
        {
          pageId: 'oscilloscope',
          label: '示波器',
          playwright: {
            readyText: '示波器控制',
            screenshotName: 'oscilloscope',
          },
          classroom: {
            smartPresentation: null,
          },
        },
      ]),
    ).toThrow(/scene\[0\]\.classroom\.smartPresentation must be an object/i)
  })
})
