import { describe, expect, it } from 'vitest'
import { slimSceneCatalogEntries } from './slimSceneCatalog'

const DEFAULT = { pageScroll: 'vertical-outside-canvas', minTouchTargetPx: 44 }

describe('slimSceneCatalogEntries', () => {
  it('drops playwright metadata and default touch profiles, keeping everything else', () => {
    const [slim] = slimSceneCatalogEntries(
      [{ pageId: 'mhd', label: '磁流体发电机', meta: { tag: 't' }, touchProfile: { ...DEFAULT }, playwright: { readyText: 'x' } }],
      DEFAULT,
    )
    expect(slim).toEqual({ pageId: 'mhd', label: '磁流体发电机', meta: { tag: 't' } })
  })

  it('keeps a touch profile that differs from the default', () => {
    const custom = { ...DEFAULT, minTouchTargetPx: 56 }
    const [slim] = slimSceneCatalogEntries([{ pageId: 'a', touchProfile: custom }], DEFAULT)
    expect(slim.touchProfile).toEqual(custom)
  })
})
