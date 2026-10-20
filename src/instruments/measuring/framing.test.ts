import { describe, expect, it } from 'vitest'
import { freeRects } from '../../scene3d/freeRects'
import { instrumentView } from './pose'

// 1920×1080 desktop: sidebar plus the data / chart / playback column stacked beside it.
const desktop = {
  width: 1900,
  height: 975,
  gutter: 20,
  obstacles: [
    { left: 0, top: 0, right: 320, bottom: 975 },
    { left: 340, top: 0, right: 640, bottom: 200 },
    { left: 340, top: 212, right: 932, bottom: 456 },
    { left: 340, top: 470, right: 572, bottom: 586 },
    { left: 1520, top: 935, right: 1880, bottom: 965 },
  ],
}

function best(tool: 'caliper' | 'micrometer') {
  let chosen: { radius: number; area: ReturnType<typeof freeRects>[number] } | null = null
  for (const area of freeRects(desktop)) {
    const view = instrumentView({
      tool,
      mode: 'outer',
      preset: 'home',
      caliperX: 23.45,
      reading: 6.125,
      aspect: (area.right - area.left) / desktop.height,
      heightFraction: (area.bottom - area.top) / desktop.height,
    })
    if (!chosen || view.radius < chosen.radius) chosen = { radius: view.radius, area }
  }
  return chosen!
}

describe('free-area framing', () => {
  it('never returns an area under a panel', () => {
    for (const area of freeRects(desktop)) {
      for (const block of desktop.obstacles) {
        const overlaps = area.left < block.right && block.left < area.right && area.top < block.bottom && block.top < area.bottom
        expect(overlaps).toBe(false)
      }
    }
  })

  it('falls back to the whole canvas when nothing covers it', () => {
    expect(freeRects({ width: 800, height: 600, gutter: 12, obstacles: [] })).toEqual([
      { left: 12, top: 12, right: 788, bottom: 588 },
    ])
  })

  it('lets the long caliper use the wide band under the chart, not just the column beside it', () => {
    const { area, radius } = best('caliper')
    expect(area.left).toBeLessThan(932)
    expect(area.top).toBeGreaterThan(456)
    // Reserving the full panel column instead leaves a 928 px wide area and a ~30% farther camera.
    expect(radius).toBeLessThan(600)
  })

  it('puts the compact micrometer in the tall area beside the panel column', () => {
    const { area } = best('micrometer')
    expect(area.left).toBeGreaterThan(932)
    expect(area.top).toBeLessThan(40)
  })
})
