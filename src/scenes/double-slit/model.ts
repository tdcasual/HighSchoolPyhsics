import { FILTER_PROFILES, type FilterColor } from '../../domains/optics/filters'
import { fastPow08 } from '../../domains/optics/patternCanvas'
import { createPatternRenderer, type Lut, type Profile } from '../../domains/optics/patternRenderer'
import { formatScientific } from '../../ui/formatNumber'
/**
 * Double-slit interference simulation model
 * Pure physics — no React dependencies
 *
 * Performance optimizations:
 * - Pre-computed white light patterns cached by parameter key
 * - 1D lookup tables for interference/diffraction (no per-pixel trig)
 * - Circle mask as Uint8Array (replaces canvas clip())
 * - Row-bounds pre-computation to skip out-of-circle pixels
 * - Reusable ImageData and Float32Array buffers
 * - Fast path when both angles are 0 (1D LUT cross-product)
 * - Power function approximation (x^0.8 → x * x^(-0.2))
 * - Zero-copy white light cache hit (no 23MB buffer copy)
 * - fill(0) for outside-circle zeroing (no per-pixel loops)
 * - Module-level reusable LUT buffers
 */

export { FILTER_HEX, FILTER_LABEL, FILTER_PROFILES, type FilterColor } from '../../domains/optics/filters'
export { fastPow08 } from '../../domains/optics/patternCanvas'
export { waveLengthToHex, waveLengthToRGB } from '../../domains/optics/spectrum'

export type DoubleSlitParams = {
  wavelength: number // nm (400 ~ 700)
  slitDistance: number // mm (0.1 ~ 0.5)
  screenDistance: number // m (0.5 ~ 1.5)
  slitWidth: number // mm (fixed at 0.05 for envelope calculation)
}

export const DEFAULT_PARAMS: DoubleSlitParams = {
  wavelength: 532,
  slitDistance: 0.2,
  screenDistance: 1.0,
  slitWidth: 0.035,
}

export const PHYSICAL_VIEW_WIDTH = 0.024

export function computeFringeSpacing(params: DoubleSlitParams): number {
  const lambda = params.wavelength * 1e-9
  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  return (L * lambda) / d
}

export function formatFringeSpacing(params: DoubleSlitParams): string {
  const spacingM = computeFringeSpacing(params)
  const spacingMm = spacingM * 1000
  return spacingMm < 0.01 ? formatScientific(spacingMm) + ' mm' : spacingMm.toFixed(3) + ' mm'
}

export function formatWhiteLightFringeRange(params: DoubleSlitParams, filterColor: FilterColor = 'none'): string {
  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const profile = filterColor === 'none' ? null : FILTER_PROFILES[filterColor]
  const minWavelength = profile ? Math.max(400, profile.center - profile.halfWidth) : 400
  const maxWavelength = profile ? Math.min(700, profile.center + profile.halfWidth) : 700
  const minMm = ((L * minWavelength * 1e-9) / d) * 1000
  const maxMm = ((L * maxWavelength * 1e-9) / d) * 1000
  const fmt = (v: number) => (v < 0.01 ? formatScientific(v) : v.toFixed(3))
  return fmt(minMm) + '–' + fmt(maxMm) + ' mm'
}

const renderer = createPatternRenderer()

export function setPatternCacheMax(maxEntries: number): void {
  renderer.setCacheMax(maxEntries)
}

// The tables span the rotated field: 0.5·viewWidth·(|cos α| + |sin α|) ≤ 0.5·viewWidth·√2.
const SQRT2 = Math.sqrt(2)
let interferenceValues = new Float32Array(0)
let envelopeValues = new Float32Array(0)

/**
 * Two-slit fringes cos²(πdx/λL) and the single-slit envelope sinc²(πax/λL) at one wavelength,
 * as lookup tables over the screen coordinate (reused between draws).
 */
function fringeTables(
  params: DoubleSlitParams,
  wavelengthNm: number,
  width: number,
  height: number,
): { fringes: Lut; envelope: Lut } {
  const size = Math.ceil(Math.max(width, height) * SQRT2)
  if (interferenceValues.length < size + 1) {
    interferenceValues = new Float32Array(size + 1)
    envelopeValues = new Float32Array(size + 1)
  }
  const scale = size / (PHYSICAL_VIEW_WIDTH * SQRT2)
  const half = size / 2
  const lambda = wavelengthNm * 1e-9
  const L = params.screenDistance
  const fringeFactor = (Math.PI * params.slitDistance * 1e-3) / (lambda * L)
  const envelopeFactor = (Math.PI * params.slitWidth * 1e-3) / (lambda * L)
  for (let i = 0; i <= size; i++) {
    const x = (i - half) / scale
    const c = Math.cos(fringeFactor * x)
    interferenceValues[i] = c * c
    const phase = envelopeFactor * x
    const sinc = Math.abs(phase) < 1e-10 ? 1 : Math.sin(phase) / phase
    envelopeValues[i] = sinc * sinc
  }
  const fringes = { values: interferenceValues.subarray(0, size + 1), scale, half }
  return { fringes, envelope: { values: envelopeValues.subarray(0, size + 1), scale, half } }
}

/** Fringes × envelope at one wavelength; with both slits upright it is the same in every row. */
function patternProfile(
  params: DoubleSlitParams,
  wavelengthNm: number,
  doubleSlitAngle: number,
  singleSlitAngle: number,
  width: number,
  height: number,
): Profile {
  const { fringes, envelope } = fringeTables(params, wavelengthNm, width, height)
  if (doubleSlitAngle !== 0 || singleSlitAngle !== 0) {
    return {
      kind: 'crossed',
      a: fringes,
      angleA: doubleSlitAngle,
      b: envelope,
      angleB: singleSlitAngle,
      viewWidth: PHYSICAL_VIEW_WIDTH,
    }
  }
  const values = new Float32Array(width)
  for (let px = 0; px < width; px++) {
    const x = (px / width - 0.5) * PHYSICAL_VIEW_WIDTH
    const i = (x * fringes.scale + fringes.half) | 0
    const t = x * fringes.scale + fringes.half - i
    const fringe = fringes.values[i] + t * (fringes.values[i + 1] - fringes.values[i])
    const env = envelope.values[i] + t * (envelope.values[i + 1] - envelope.values[i])
    values[px] = fastPow08(fringe * env)
  }
  return { kind: 'columns', values }
}

/** The fringes seen through the eyepiece in monochromatic light. */
export function drawInterferencePattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
): void {
  const { width, height } = ctx.canvas
  renderer.drawMonochrome(
    ctx,
    'round',
    params.wavelength,
    patternProfile(params, params.wavelength, doubleSlitAngle, singleSlitAngle, width, height),
  )
}

/** White light (optionally through a colour filter): every wavelength's fringes summed. */
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  filterColor: FilterColor,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
  wavelengthStep = 5,
): void {
  const { width, height } = ctx.canvas
  renderer.drawWhiteLight(ctx, 'round', {
    key: `${params.slitDistance.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.slitWidth.toFixed(3)}_${doubleSlitAngle.toFixed(1)}_${singleSlitAngle.toFixed(1)}`,
    filterColor,
    step: wavelengthStep,
    profileAt: (wl) => patternProfile(params, wl, doubleSlitAngle, singleSlitAngle, width, height),
  })
}
