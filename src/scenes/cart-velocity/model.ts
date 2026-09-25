export const FREQUENCY = 50
export const DURATION = 1.6
export const G = 9.8
export const CART_MASS = 0.5
export const PULLEY_DISTANCE = 1.634
export const HOOK_MASS = 0.01
export const MAX_HOOKS = 5

export type MotionSample = { t: number; x: number; v: number }
export type MotionInput = { a: number; v0: number; dh?: number; d0?: number }

export function hookAcceleration(hooks: number): number {
  const mass = Math.max(0, hooks) * HOOK_MASS
  return mass * G / (CART_MASS + mass)
}

export function hangingMass(input: MotionInput): number {
  return input.a > 0 ? CART_MASS * input.a / (G - input.a) : 0
}

export function stringAngle(input: MotionInput, position: number): number {
  const distance = Math.max(0.05, (input.d0 || PULLEY_DISTANCE) - position)
  return Math.atan2(input.dh || 0, distance)
}

export function accelerationAt(input: MotionInput, position: number): number {
  const mass = hangingMass(input)
  if (!mass) return input.a
  const cosine = Math.cos(stringAngle(input, position))
  return mass * G * cosine / (CART_MASS + mass * cosine * cosine)
}

const tables = new Map<string, { h: number; xs: Float64Array; vs: Float64Array; n: number }>()

function motionTable(input: MotionInput) {
  const key = [input.a, input.v0, input.dh || 0, input.d0 || PULLEY_DISTANCE].join('|')
  const cached = tables.get(key)
  if (cached) return cached
  const n = 6401
  const h = DURATION * 1.25 / (n - 1)
  const xs = new Float64Array(n)
  const vs = new Float64Array(n)
  let x = 0
  let v = input.v0
  for (let index = 0; index < n; index += 1) {
    xs[index] = x
    vs[index] = v
    const slope = (xx: number, vv: number): [number, number] => [vv, accelerationAt(input, xx)]
    const k1 = slope(x, v)
    const k2 = slope(x + h / 2 * k1[0], v + h / 2 * k1[1])
    const k3 = slope(x + h / 2 * k2[0], v + h / 2 * k2[1])
    const k4 = slope(x + h * k3[0], v + h * k3[1])
    x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
    v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
  }
  const table = { h, xs, vs, n }
  if (tables.size > 40) tables.clear()
  tables.set(key, table)
  return table
}

export function at(time: number, input: MotionInput): MotionSample {
  if (!(Math.abs(input.dh || 0) > 1e-9 && hangingMass(input) > 0)) {
    return { t: time, x: input.v0 * time + 0.5 * input.a * time * time, v: input.v0 + input.a * time }
  }
  const table = motionTable(input)
  const u = Math.max(0, time) / table.h
  const index = Math.min(table.n - 2, Math.floor(u))
  const fraction = u - index
  return {
    t: time,
    x: table.xs[index] + (table.xs[index + 1] - table.xs[index]) * fraction,
    v: table.vs[index] + (table.vs[index + 1] - table.vs[index]) * fraction,
  }
}

export function dots(time: number, input: MotionInput) {
  const count = Math.floor((Math.min(time, DURATION) + 1e-9) * FREQUENCY) + 1
  return Array.from({ length: count }, (_, index) => ({ ...at(index / FREQUENCY, input), index }))
}

export function counts(time: number, input: MotionInput, group = 5) {
  return dots(time, input)
    .filter((dot) => dot.index % group === 0)
    .map((dot, index) => ({ ...dot, label: String.fromCharCode(65 + index) }))
}

export type SpeedPoint = {
  index: number
  label: string
  t: number
  left: string
  right: string
  dx: number
  dt: number
  v: number
}

export function measurements(time: number, input: MotionInput, group = 5): SpeedPoint[] {
  const points = counts(time, input, group)
  return points.slice(1, -1).map((point, index) => {
    const before = points[index]
    const after = points[index + 2]
    return {
      index: index + 1,
      label: point.label,
      t: point.t,
      left: before.label,
      right: after.label,
      dx: after.x - before.x,
      dt: after.t - before.t,
      v: (after.x - before.x) / (after.t - before.t),
    }
  })
}

export function fit(rows: Array<{ t: number; v: number }>) {
  if (rows.length < 2) return null
  const n = rows.length
  const meanT = rows.reduce((sum, row) => sum + row.t, 0) / n
  const meanV = rows.reduce((sum, row) => sum + row.v, 0) / n
  const denominator = rows.reduce((sum, row) => sum + (row.t - meanT) ** 2, 0)
  if (denominator === 0) return null
  const slope = rows.reduce((sum, row) => sum + (row.t - meanT) * (row.v - meanV), 0) / denominator
  return { a: slope, v0: meanV - slope * meanT }
}
