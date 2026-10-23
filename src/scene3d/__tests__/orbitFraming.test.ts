import { describe, expect, it } from 'vitest'
import { boxAround, directionFrom, fitCameraDistance, fitOrbitView, orbitPosition, type Bounds3 } from '../orbitFraming'
import { freeRects } from '../freeRects'
import { pickLargestView } from '../useFittedOrbitCamera'

const view = { target: [0, 0, 0] as [number, number, number], azimuth: 0.6, elevation: 0.4, fov: 40 }

describe('fitCameraDistance', () => {
  it('falls back to the minimum distance for bounds collapsed to a point', () => {
    const point = boxAround([1, 2, 3], [0, 0, 0])
    expect(fitCameraDistance({ ...view, target: [1, 2, 3], bounds: point, aspect: 1.5, minDistance: 4 })).toBe(4)
  })

  it('fits flat bounds (a plane) at a finite, positive distance', () => {
    const plane: Bounds3 = { min: [-5, 0, -5], max: [5, 0, 5] }
    const distance = fitCameraDistance({ ...view, bounds: plane, aspect: 1.5 })
    expect(Number.isFinite(distance)).toBe(true)
    expect(distance).toBeGreaterThan(0)
  })

  it('moves closer when the area is wider or taller, and survives a sliver of an area', () => {
    const long = boxAround([0, 0, 0], [10, 1, 1])
    const narrow = fitCameraDistance({ ...view, bounds: long, aspect: 0.5 })
    const wide = fitCameraDistance({ ...view, bounds: long, aspect: 3 })
    expect(wide).toBeLessThan(narrow)
    const short = fitCameraDistance({ ...view, bounds: long, aspect: 3, heightFraction: 0.3 })
    expect(short).toBeGreaterThanOrEqual(wide)
    expect(Number.isFinite(fitCameraDistance({ ...view, bounds: long, aspect: 0, heightFraction: 0 }))).toBe(true)
  })
})

describe('fitOrbitView', () => {
  const bounds = boxAround([0, 0, 0], [2, 1, 1])

  it('centres the bounds in the area: the screen offset is the area offset when anchored at the centre', () => {
    const fitted = fitOrbitView({ ...view, bounds, centerOffsetPixels: 180, centerOffsetYPixels: -40 })
    expect(fitted.target).toEqual([0, 0, 0])
    expect(fitted.screenOffset?.[0]).toBeCloseTo(180)
    expect(fitted.screenOffset?.[1]).toBeCloseTo(-40)
  })

  it('orbits around an off-centre anchor and shifts the image back so the apparatus stays centred', () => {
    const fitted = fitOrbitView({ ...view, azimuth: 0, elevation: 0, bounds, anchor: [1.5, 0, 0] })
    expect(fitted.target).toEqual([1.5, 0, 0])
    // The anchor is right of the centre, so the picture moves right to put the centre back.
    expect(fitted.screenOffset?.[0]).toBeGreaterThan(0)
  })
})

describe('directionFrom / orbitPosition', () => {
  it('round-trips a camera position through its orbit angles', () => {
    const target: [number, number, number] = [1, -2, 0.5]
    const position: [number, number, number] = [4, 3, -6]
    const { azimuth, elevation } = directionFrom(position, target)
    const radius = Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2])
    const back = orbitPosition({ target, azimuth, elevation, radius })
    back.forEach((value, index) => expect(value).toBeCloseTo(position[index]))
  })
})

describe('freeRects', () => {
  it('is the whole canvas inside the gutter when every panel is collapsed away', () => {
    expect(freeRects({ width: 1000, height: 600, gutter: 20, obstacles: [] })).toEqual([
      { left: 20, top: 20, right: 980, bottom: 580 },
    ])
  })

  it('offers the area beside a panel column and the strip below it', () => {
    const rects = freeRects({
      width: 1600,
      height: 900,
      gutter: 20,
      obstacles: [{ left: 0, top: 0, right: 360, bottom: 600 }],
    })
    expect(rects).toContainEqual({ left: 380, top: 20, right: 1580, bottom: 880 })
    expect(rects).toContainEqual({ left: 20, top: 620, right: 1580, bottom: 880 })
  })

  it('falls back to the whole canvas when panels leave no usable area', () => {
    const rects = freeRects({
      width: 800,
      height: 500,
      gutter: 12,
      obstacles: [{ left: 0, top: 0, right: 800, bottom: 500 }],
    })
    expect(rects).toEqual([{ left: 12, top: 12, right: 788, bottom: 488 }])
  })
})

describe('pickLargestView', () => {
  it('chooses the area that brings the camera closest, or the fallback when there is none', () => {
    const fit = (area: { aspect?: number }) => ({ ...view, radius: 10 / (area.aspect ?? 1) })
    expect(pickLargestView([{ aspect: 1 }, { aspect: 2.5 }, { aspect: 2 }], fit, {}).radius).toBe(4)
    expect(pickLargestView([], fit, { aspect: 5 }).radius).toBe(2)
  })
})
