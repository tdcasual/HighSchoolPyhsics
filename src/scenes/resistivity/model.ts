import { clamp, roundTo } from '../../instruments/measuring/model'

export type MeterKey = 'A06' | 'A3' | 'V3' | 'V15'
export type MaterialKey = 'iron' | 'manganin' | 'constantan' | 'nichrome'
export type CircuitControl = 'limit' | 'divider'
export type CircuitMethod = 'external' | 'internal'
export type ElementKind = 'resistor' | 'lamp' | 'diode'

export type MeterSpec = {
  key: MeterKey
  kind: 'A' | 'V'
  range: number
  division: number
  resolution: number
  resistance: number
  label: string
}

export const METERS: Record<MeterKey, MeterSpec> = {
  A06: { key: 'A06', kind: 'A', range: 0.6, division: 0.02, resolution: 0.01, resistance: 0.125, label: '0～0.6 A' },
  A3: { key: 'A3', kind: 'A', range: 3, division: 0.1, resolution: 0.01, resistance: 0.025, label: '0～3 A' },
  V3: { key: 'V3', kind: 'V', range: 3, division: 0.1, resolution: 0.01, resistance: 3000, label: '0～3 V' },
  V15: { key: 'V15', kind: 'V', range: 15, division: 0.5, resolution: 0.1, resistance: 15000, label: '0～15 V' },
}

export const MATERIALS: Record<MaterialKey, { name: string; rho: number; alpha: number }> = {
  iron: { name: '铁', rho: 1.0e-7, alpha: 5.0e-3 },
  manganin: { name: '锰铜合金', rho: 4.4e-7, alpha: 1e-5 },
  constantan: { name: '镍铜合金（康铜）', rho: 5.0e-7, alpha: 1e-5 },
  nichrome: { name: '镍铬合金', rho: 1.0e-6, alpha: 4e-4 },
}

export const DIAMETER_OFFSETS = [0.004, -0.006, 0.002]

export const DEFAULT_CIRCUIT = { E: 3, r: 0.8, R0: 20, heat: 80 }

export function wire(material: MaterialKey, nominalDiameter: number) {
  const spec = MATERIALS[material]
  const positions = DIAMETER_OFFSETS.map((offset) => roundTo(nominalDiameter + offset, 0.001))
  const diameter = positions.reduce((sum, value) => sum + value, 0) / positions.length
  return { key: material, ...spec, nominal: nominalDiameter, positions, diameter }
}

export function areaMm(diameterMm: number): number {
  return Math.PI * (diameterMm * 1e-3) ** 2 / 4
}

export function wireResistance(rho: number, lengthM: number, diameterMm: number): number {
  return rho * lengthM / areaMm(diameterMm)
}

export function resistivityFrom(resistance: number, diameterMm: number, lengthM: number): number {
  return Math.PI * (diameterMm * 1e-3) ** 2 * resistance / (4 * lengthM)
}

export type MeterReading = MeterSpec & {
  value: number
  reading: number
  text: string
  digits: number
  fraction: number
  over: boolean
  reverse: boolean
}

export function meterReading(value: number, key: MeterKey): MeterReading {
  const meter = METERS[key]
  const shown = clamp(value, 0, meter.range * 1.04)
  const reading = roundTo(Math.min(shown, meter.range), meter.resolution)
  const digits = meter.resolution < 0.1 ? 2 : 1
  return {
    ...meter,
    value,
    reading,
    text: reading.toFixed(digits),
    digits,
    fraction: shown / meter.range,
    over: value > meter.range * 1.0005,
    reverse: value < -1e-9,
  }
}

function solveLinear(matrix: number[][], vector: number[]): number[] {
  const size = vector.length
  const A = matrix.map((row) => row.slice())
  const b = vector.slice()
  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(A[row][column]) > Math.abs(A[pivot][column])) pivot = row
    }
    if (Math.abs(A[pivot][column]) < 1e-300) throw new Error('Singular circuit')
    ;[A[column], A[pivot]] = [A[pivot], A[column]]
    ;[b[column], b[pivot]] = [b[pivot], b[column]]
    for (let row = column + 1; row < size; row += 1) {
      const factor = A[row][column] / A[column][column]
      if (!factor) continue
      for (let next = column; next < size; next += 1) A[row][next] -= factor * A[column][next]
      b[row] -= factor * b[column]
    }
  }
  const solution = new Array<number>(size).fill(0)
  for (let row = size - 1; row >= 0; row -= 1) {
    let sum = b[row]
    for (let column = row + 1; column < size; column += 1) sum -= A[row][column] * solution[column]
    solution[row] = sum / A[row][row]
  }
  return solution
}

export function solveNetwork(
  nodeCount: number,
  resistors: Array<[number, number, number]>,
  sources: Array<[number, number, number]>,
) {
  const freeNodes = nodeCount - 1
  const size = freeNodes + sources.length
  const A = Array.from({ length: size }, () => new Array<number>(size).fill(0))
  const z = new Array<number>(size).fill(0)
  for (let node = 0; node < freeNodes; node += 1) A[node][node] += 1e-12
  for (const [a, b, resistance] of resistors) {
    const conductance = 1 / resistance
    if (a) A[a - 1][a - 1] += conductance
    if (b) A[b - 1][b - 1] += conductance
    if (a && b) {
      A[a - 1][b - 1] -= conductance
      A[b - 1][a - 1] -= conductance
    }
  }
  sources.forEach(([plus, minus, emf], index) => {
    const row = freeNodes + index
    if (plus) {
      A[plus - 1][row] += 1
      A[row][plus - 1] += 1
    }
    if (minus) {
      A[minus - 1][row] -= 1
      A[row][minus - 1] -= 1
    }
    z[row] = emf
  })
  const solution = solveLinear(A, z)
  return {
    voltages: [0, ...solution.slice(0, freeNodes)],
    sourceCurrents: solution.slice(freeNodes).map((value) => -value),
  }
}

export type MeasurementInput = {
  material: MaterialKey
  diameter: number
  length: number
  ammeter?: MeterKey
  voltmeter?: MeterKey
  control: CircuitControl
  method: CircuitMethod
  slider: number
  closed: boolean
  voltmeterConnected?: boolean
  E?: number
  r?: number
  R0?: number
  heat?: number
}

export type Measurement = {
  closed: boolean
  Ix: number
  Ux: number
  Imeter: number
  Umeter: number
  Rtrue: number
  R20: number
  dT: number
  supply: number
  Rmeasured: number
  slider: number
}

export function measurement(input: MeasurementInput): Measurement {
  const options = { ...DEFAULT_CIRCUIT, voltmeterConnected: true, ammeter: 'A06' as MeterKey, voltmeter: 'V3' as MeterKey, ...input }
  const ammeter = METERS[options.ammeter]
  const voltmeter = METERS[options.voltmeter]
  const voltmeterResistance = options.voltmeterConnected === false ? 1e15 : voltmeter.resistance
  const material = MATERIALS[options.material]
  const R20 = wireResistance(material.rho, options.length, options.diameter)
  const conductance = options.heat * Math.PI * options.diameter * 1e-3 * Math.max(options.length, 1e-3)
  const slider = clamp(options.slider, 0, 1)
  const empty: Measurement = {
    closed: false, Ix: 0, Ux: 0, Imeter: 0, Umeter: 0, Rtrue: R20, R20, dT: 0, supply: 0, Rmeasured: Number.NaN, slider,
  }
  if (!options.closed) return empty
  let temperatureRise = 0
  let result = empty
  for (let pass = 0; pass < 60; pass += 1) {
    const Rx = R20 * (1 + material.alpha * temperatureRise)
    const resistors: Array<[number, number, number]> = [[1, 2, Math.max(options.r, 1e-6)]]
    if (options.control === 'divider') {
      resistors.push([2, 3, Math.max((1 - slider) * options.R0, 1e-6)], [3, 0, Math.max(slider * options.R0, 1e-6)])
    } else {
      resistors.push([2, 3, Math.max(slider * options.R0, 1e-6)])
    }
    resistors.push([3, 4, ammeter.resistance], [4, 0, Rx])
    resistors.push(options.method === 'internal' ? [3, 0, voltmeterResistance] : [4, 0, voltmeterResistance])
    const net = solveNetwork(5, resistors, [[1, 0, options.E]])
    const Ux = net.voltages[4]
    const Ix = Ux / Rx
    const Imeter = (net.voltages[3] - net.voltages[4]) / ammeter.resistance
    const Umeter = options.voltmeterConnected === false ? 0 : options.method === 'internal' ? net.voltages[3] : net.voltages[4]
    const next = Math.min(600, Ix * Ix * Rx / conductance)
    result = {
      closed: true,
      Ix,
      Ux,
      Imeter,
      Umeter,
      Rtrue: Rx,
      R20,
      dT: next,
      supply: net.sourceCurrents[0],
      Rmeasured: Imeter > 0 ? Umeter / Imeter : Number.NaN,
      slider,
    }
    if (Math.abs(next - temperatureRise) < 1e-9) break
    temperatureRise = next
  }
  return result
}

export function systematicError(resistance: number, method: CircuitMethod, ammeter: MeterKey, voltmeter: MeterKey) {
  const ammeterResistance = METERS[ammeter].resistance
  const voltmeterResistance = METERS[voltmeter].resistance
  const measured = method === 'internal'
    ? resistance + ammeterResistance
    : resistance * voltmeterResistance / (resistance + voltmeterResistance)
  const critical = Math.sqrt(ammeterResistance * voltmeterResistance)
  return {
    measured,
    relative: (measured - resistance) / resistance,
    critical,
    recommend: resistance < critical ? 'external' as const : 'internal' as const,
  }
}

export function fitOrigin(points: Array<[number, number]>) {
  let sxy = 0
  let sxx = 0
  for (const [x, y] of points) {
    sxy += x * y
    sxx += x * x
  }
  return sxx > 0 ? { slope: sxy / sxx, intercept: 0, n: points.length } : null
}

export function fitLine(points: Array<[number, number]>) {
  const n = points.length
  if (n < 2) return null
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const [x, y] of points) {
    sx += x
    sy += y
    sxx += x * x
    sxy += x * y
    syy += y * y
  }
  const den = n * sxx - sx * sx
  if (Math.abs(den) < 1e-18) return null
  const slope = (n * sxy - sx * sy) / den
  const intercept = (sy - slope * sx) / n
  const vy = n * syy - sy * sy
  const r2 = vy > 0 ? (n * sxy - sx * sy) ** 2 / (den * vy) : 1
  return { slope, intercept, r2, n }
}

const LAMP = { rated: 2.5, ratedI: 0.3, R0: 1, T0: 300, exponent: 1.2, conduction: 0.3, kc: 0, kr: 0 }
;(() => {
  const hotResistance = LAMP.rated / LAMP.ratedI
  const hotTemperature = LAMP.T0 * (hotResistance / LAMP.R0) ** (1 / LAMP.exponent)
  const power = LAMP.rated * LAMP.ratedI
  LAMP.kc = power * LAMP.conduction / (hotTemperature - LAMP.T0)
  LAMP.kr = power * (1 - LAMP.conduction) / (hotTemperature ** 4 - LAMP.T0 ** 4)
})()

export function lampState(voltage: number) {
  const magnitude = Math.abs(voltage)
  const resistanceAt = (temperature: number) => LAMP.R0 * (temperature / LAMP.T0) ** LAMP.exponent
  const balance = (temperature: number) => magnitude * magnitude / resistanceAt(temperature)
    - (LAMP.kr * (temperature ** 4 - LAMP.T0 ** 4) + LAMP.kc * (temperature - LAMP.T0))
  let low = LAMP.T0
  let high = 4000
  for (let step = 0; step < 90; step += 1) {
    const mid = (low + high) / 2
    if (balance(mid) > 0) low = mid
    else high = mid
  }
  const temperature = (low + high) / 2
  const resistance = resistanceAt(temperature)
  return {
    U: voltage,
    I: Math.sign(voltage) * magnitude / resistance,
    R: resistance,
    T: temperature,
    P: magnitude * magnitude / resistance,
  }
}

const DIODE = { Is: 2.5e-9, nVt: 0.045 }

export const ELEMENTS: Record<ElementKind, { name: string; short: string; min: number; max: number; Imax: number }> = {
  resistor: { name: '金属丝（温度不变）', short: '金属丝', min: 0, max: 3, Imax: 0.3 },
  lamp: { name: '小灯泡 2.5 V 0.3 A', short: '小灯泡', min: 0, max: 3, Imax: 0.35 },
  diode: { name: '硅二极管', short: '二极管', min: -2.4, max: 0.8, Imax: 0.14 },
}

export function element(kind: ElementKind, voltage: number) {
  if (kind === 'resistor') {
    const resistance = 10
    return { U: voltage, I: voltage / resistance, R: resistance, P: voltage * voltage / resistance, T: 300 }
  }
  if (kind === 'lamp') return lampState(voltage)
  const current = DIODE.Is * (Math.exp(voltage / DIODE.nVt) - 1)
  return { U: voltage, I: current, R: Math.abs(current) > 1e-15 ? voltage / current : Number.POSITIVE_INFINITY, P: voltage * current, T: 300 }
}

export function differential(kind: ElementKind, voltage: number) {
  const step = kind === 'diode' ? 1e-5 : 1e-4
  return (element(kind, voltage + step).I - element(kind, voltage - step).I) / (2 * step)
}

export function nearestMaterial(rho: number) {
  let best: { key: MaterialKey; name: string; rho: number; error: number } | null = null
  for (const key of Object.keys(MATERIALS) as MaterialKey[]) {
    const spec = MATERIALS[key]
    const error = Math.abs(Math.log(rho / spec.rho))
    if (!best || error < best.error) best = { key, name: spec.name, rho: spec.rho, error }
  }
  return best
}
