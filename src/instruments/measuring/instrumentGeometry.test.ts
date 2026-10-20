import { describe, expect, it } from 'vitest'
import {
  FIXED_INNER_JAW_OUTLINE,
  FIXED_OUTER_JAW_OUTLINE,
  MICROMETER_BOW_OUTLINE,
  MICROMETER_INSULATOR_OUTLINE,
  MOVING_INNER_JAW_OUTLINE,
  MOVING_OUTER_JAW_OUTLINE,
  type InstrumentOutline,
} from './instrumentGeometry'

function cross(a: [number, number], b: [number, number], c: [number, number]) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function onSegment(a: [number, number], b: [number, number], point: [number, number]) {
  const epsilon = 1e-8
  return (
    Math.abs(cross(a, b, point)) <= epsilon &&
    point[0] >= Math.min(a[0], b[0]) - epsilon &&
    point[0] <= Math.max(a[0], b[0]) + epsilon &&
    point[1] >= Math.min(a[1], b[1]) - epsilon &&
    point[1] <= Math.max(a[1], b[1]) + epsilon
  )
}

function segmentsIntersect(a: [number, number], b: [number, number], c: [number, number], d: [number, number]) {
  const epsilon = 1e-8
  const abC = cross(a, b, c)
  const abD = cross(a, b, d)
  const cdA = cross(c, d, a)
  const cdB = cross(c, d, b)
  if (((abC > epsilon && abD < -epsilon) || (abC < -epsilon && abD > epsilon)) &&
      ((cdA > epsilon && cdB < -epsilon) || (cdA < -epsilon && cdB > epsilon))) return true
  return (
    (Math.abs(abC) <= epsilon && onSegment(a, b, c)) ||
    (Math.abs(abD) <= epsilon && onSegment(a, b, d)) ||
    (Math.abs(cdA) <= epsilon && onSegment(c, d, a)) ||
    (Math.abs(cdB) <= epsilon && onSegment(c, d, b))
  )
}

function selfIntersections(points: InstrumentOutline) {
  const crossings: string[] = []
  const count = points.length
  for (let first = 0; first < count; first += 1) {
    const firstNext = (first + 1) % count
    for (let second = first + 1; second < count; second += 1) {
      const secondNext = (second + 1) % count
      if (firstNext === second || secondNext === first) continue
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext])) {
        crossings.push(String(first) + '-' + String(firstNext) + ' x ' + String(second) + '-' + String(secondNext))
      }
    }
  }
  return crossings
}

function signedArea(points: InstrumentOutline) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length]
    return area + point[0] * next[1] - next[0] * point[1]
  }, 0) / 2
}

const outlines: Array<[string, InstrumentOutline]> = [
  ['fixed outer jaw', FIXED_OUTER_JAW_OUTLINE],
  ['fixed inner jaw', FIXED_INNER_JAW_OUTLINE],
  ['moving outer jaw', MOVING_OUTER_JAW_OUTLINE],
  ['moving inner jaw', MOVING_INNER_JAW_OUTLINE],
  ['micrometer bow', MICROMETER_BOW_OUTLINE],
  ['micrometer insulator', MICROMETER_INSULATOR_OUTLINE],
]

describe('measuring-tool extrusion outlines', () => {
  it.each(outlines)('%s forms a simple, non-degenerate contour', (_name, points) => {
    expect(Math.abs(signedArea(points))).toBeGreaterThan(1e-6)
    expect(selfIntersections(points)).toEqual([])
  })
})
