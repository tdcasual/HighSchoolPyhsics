import { ExtrudeGeometry, Shape, Vector2 } from 'three'
import { buildRevolveGeometry, micrometerBowPoints, micrometerInsulatorPoints } from './geometry'
import { MICROMETER_REF_RAD } from './pose'

function extrude(points: Array<[number, number]>, depth: number, z0 = -depth / 2, bevel = 0) {
  const shape = new Shape(points.map(([x, y]) => new Vector2(x, y)))
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  })
  geometry.translate(0, 0, z0)
  return geometry
}

export const FIXED_OUTER_JAW = extrude([[0, 0], [0, -40], [-3, -40], [-24, -13], [-24, 0]], 3.5)
export const FIXED_INNER_JAW = extrude([[-7, 16], [8, 16], [1.2, 31.5], [0, 31.5], [0, 20], [-7, 20]], 1.75, 0)
export const MOVING_OUTER_JAW = extrude([[0, -5], [0, -40], [3, -40], [24, -13], [24, -5]], 3.5)
export const MOVING_INNER_JAW = extrude([[-8, 16], [-1.2, 31.5], [0, 31.5], [0, 16], [10, 16], [10, 20], [-8, 20]], 1.75, -1.75)
export const MICROMETER_BOW = extrude(micrometerBowPoints(), 9, -4.5, 0.6)
export const MICROMETER_INSULATOR = extrude(micrometerInsulatorPoints(), 1.1, 5)

const REF = MICROMETER_REF_RAD
const PH0 = REF - 55 * Math.PI / 180
const PH1 = REF + 55 * Math.PI / 180

export const SLEEVE_SCALE_GEOMETRY = buildRevolveGeometry([[38, 4.63], [77, 4.63]], 48, PH0, PH1 - PH0)
export const THIMBLE_BODY_GEOMETRY = buildRevolveGeometry([[0, 5.3], [3, 7.1], [16, 7.1]], 64, REF, Math.PI * 2)
export const THIMBLE_CAP_GEOMETRY = buildRevolveGeometry([[16, 7.1], [16, 7.35], [27, 7.35], [27, 6.6]], 40, 0, Math.PI * 2)
export const RATCHET_GEOMETRY = buildRevolveGeometry([[28.5, 4.2], [38, 4.2], [38.6, 3.4]], 32, 0, Math.PI * 2)
