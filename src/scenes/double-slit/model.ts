import { FILTER_PROFILES, filterTransmission, type FilterColor } from '../../domains/optics/filters'
import { createBufferPool, createPatternCache, drawEyepieceBorder, fastPow08, getCircleMask } from '../../domains/optics/patternCanvas'
import { waveLengthToRGB } from '../../domains/optics/spectrum'
import { formatScientific } from '../../core/formatNumber'
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
  const minMm = (L * minWavelength * 1e-9 / d) * 1000
  const maxMm = (L * maxWavelength * 1e-9 / d) * 1000
  const fmt = (v: number) => v < 0.01 ? formatScientific(v) : v.toFixed(3)
  return fmt(minMm) + '–' + fmt(maxMm) + ' mm'
}

const ensureBuffers = createBufferPool()

// ========== Performance: module-level reusable LUT buffers ==========

let _interferenceLut: Float32Array | null = null
let _diffractionLut: Float32Array | null = null
let _colDx: Float32Array | null = null
let _colInt: Float32Array | null = null
let _colEnv: Float32Array | null = null
let _lutCapacity = 0
let _colCapacity = 0

function ensureLutBuffers(lutSize: number, colSize: number): { interferenceLut: Float32Array; diffractionLut: Float32Array; colDx: Float32Array; colInt: Float32Array; colEnv: Float32Array } {
  if (lutSize > _lutCapacity) {
    _interferenceLut = new Float32Array(lutSize + 1)
    _diffractionLut = new Float32Array(lutSize + 1)
    _lutCapacity = lutSize
  }
  if (colSize > _colCapacity) {
    _colDx = new Float32Array(colSize)
    _colInt = new Float32Array(colSize)
    _colEnv = new Float32Array(colSize)
    _colCapacity = colSize
  }
  return { interferenceLut: _interferenceLut!, diffractionLut: _diffractionLut!, colDx: _colDx!, colInt: _colInt!, colEnv: _colEnv! }
}

// ========== Performance: white light cache ==========

const patternCache = createPatternCache()

export function setPatternCacheMax(maxEntries: number): void {
  patternCache.setMax(maxEntries)
}


function buildPatternCacheKey(params: DoubleSlitParams, filterColor: FilterColor, doubleSlitAngle: number, singleSlitAngle: number, wavelengthStep: number, width: number, height: number): string {
  return `${width}_${height}_${params.slitDistance.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.slitWidth.toFixed(3)}_${filterColor}_${doubleSlitAngle.toFixed(1)}_${singleSlitAngle.toFixed(1)}_${wavelengthStep}`
}

// ========== Performance: circle mask ==========


// ========== Performance: LUT utilities ==========

function readLutFast(lut: Float32Array, physCoord: number, lutScale: number, halfN: number): number {
  const idx = physCoord * lutScale + halfN
  if (idx < 0 || idx >= lut.length) return 0
  const i = idx | 0
  const frac = idx - i
  const v0 = lut[i]
  return i + 1 < lut.length ? v0 + frac * (lut[i + 1] - v0) : v0
}

// No bounds check — caller guarantees index is in [0, lut.length-2]
function readLutUnsafe(lut: Float32Array, physCoord: number, lutScale: number, halfN: number): number {
  const idx = (physCoord * lutScale + halfN) | 0
  const v0 = lut[idx]
  return v0 + (physCoord * lutScale + halfN - idx) * (lut[idx + 1] - v0)
}

// LUT must cover full rotated coordinate range.
// For angle α, max rotated coord = 0.5 * viewWidth * (|cos α| + |sin α|) ≤ 0.5 * viewWidth * √2.
// The scale lutSize/(viewWidth*√2) maps the LUT to [-0.5*viewWidth*√2, +0.5*viewWidth*√2].
const SQRT2 = Math.sqrt(2)
function computeLutSize(width: number, height: number): number {
  return Math.ceil(Math.max(width, height) * SQRT2)
}

// ========== Performance: normalize accumulators → ImageData ==========

function normalizeToImageData(
  imgData: ImageData,
  srcR: Float32Array,
  srcG: Float32Array,
  srcB: Float32Array,
  width: number,
  height: number,
  rowMinX: Int32Array,
  rowMaxX: Int32Array,
): void {
  let maxVal = 0
  for (let y = 0; y < height; y++) {
    const minX = rowMinX[y]
    const maxX = rowMaxX[y]
    if (minX > maxX) continue
    const rowBase = y * width
    for (let px = minX; px <= maxX; px++) {
      const i = rowBase + px
      const v = srcR[i] > srcG[i] ? (srcR[i] > srcB[i] ? srcR[i] : srcB[i]) : (srcG[i] > srcB[i] ? srcG[i] : srcB[i])
      if (v > maxVal) maxVal = v
    }
  }

  const data = imgData.data
  const noiseThreshold = maxVal * 0.0005

  for (let y = 0; y < height; y++) {
    const minX = rowMinX[y]
    const maxX = rowMaxX[y]
    if (minX > maxX) continue
    const rowBase = y * width
    const rowOffset = rowBase * 4
    for (let px = minX; px <= maxX; px++) {
      const idx = rowBase + px
      const rAcc = srcR[idx]
      const gAcc = srcG[idx]
      const bAcc = srcB[idx]
      const localMax = Math.max(rAcc, gAcc, bAcc)

      if (localMax > noiseThreshold) {
        const nr = (rAcc / localMax) * 255
        const ng = (gAcc / localMax) * 255
        const nb = (bAcc / localMax) * 255
        const brightness = Math.max(0.15, Math.pow(localMax / maxVal, 0.3))
        const pi = rowOffset + px * 4
        data[pi] = Math.min(255, nr * brightness)
        data[pi + 1] = Math.min(255, ng * brightness)
        data[pi + 2] = Math.min(255, nb * brightness)
        data[pi + 3] = 255
      }
    }
  }
}

/**
 * Draw the interference pattern onto a canvas context with a circular eyepiece viewport.
 */
export function drawInterferencePattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 2
  const n = width * height

  const lambda = params.wavelength * 1e-9
  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const a = params.slitWidth * 1e-3
  const rgb = waveLengthToRGB(params.wavelength)
  const physicalViewWidth = PHYSICAL_VIEW_WIDTH

  const { rowMinX, rowMaxX } = getCircleMask(width, height, cx, cy, radius)

  const lutSize = computeLutSize(width, height)
  const lutScale = lutSize / (physicalViewWidth * SQRT2)
  const halfN = lutSize / 2
  const { interferenceLut, diffractionLut, colDx, colInt } = ensureLutBuffers(lutSize, width)

  // Pre-compute 1D LUTs
  const intFactor = (Math.PI * d) / (lambda * L)
  const difFactor = (Math.PI * a) / (lambda * L)
  for (let i = 0; i <= lutSize; i++) {
    const phys = (i - halfN) / lutScale
    const phaseI = intFactor * phys
    const cosV = Math.cos(phaseI)
    interferenceLut[i] = cosV * cosV
    const phaseD = difFactor * phys
    if (Math.abs(phaseD) < 1e-10) {
      diffractionLut[i] = 1.0
    } else {
      const sinc = Math.sin(phaseD) / phaseD
      diffractionLut[i] = sinc * sinc
    }
  }

  // Pre-compute per-column dx values
  for (let px = 0; px < width; px++) {
    colDx[px] = (px / width - 0.5) * physicalViewWidth
  }

  const { imgData, imgDataU32 } = ensureBuffers(ctx, n)
  const data = imgData.data
  const cosF = Math.cos(doubleSlitAngle * Math.PI / 180)
  const sinF = Math.sin(doubleSlitAngle * Math.PI / 180)
  const cosE = Math.cos(singleSlitAngle * Math.PI / 180)
  const sinE = Math.sin(singleSlitAngle * Math.PI / 180)
  const rR = rgb[0], rG = rgb[1], rB = rgb[2]

  // Fill entire ImageData with black (faster than per-pixel zeroing)
  imgDataU32.fill(0)

  if (doubleSlitAngle === 0 && singleSlitAngle === 0) {
    // Both interference and diffraction vary along x (perpendicular to vertical slits)
    for (let px = 0; px < width; px++) {
      const dx = colDx[px]
      const intVal = readLutUnsafe(interferenceLut, dx, lutScale, halfN)
      const envVal = readLutUnsafe(diffractionLut, dx, lutScale, halfN)
      colInt[px] = intVal * envVal
    }
    for (let py = 0; py < height; py++) {
      const minX = rowMinX[py]
      const maxX = rowMaxX[py]
      if (minX > maxX) continue
      const rowOffset = py * width * 4
      for (let px = minX; px <= maxX; px++) {
        const intensity = fastPow08(colInt[px])
        const p4 = rowOffset + px * 4
        data[p4] = rR * intensity
        data[p4 + 1] = rG * intensity
        data[p4 + 2] = rB * intensity
        data[p4 + 3] = 255
      }
    }
  } else {
    for (let py = 0; py < height; py++) {
      const minX = rowMinX[py]
      const maxX = rowMaxX[py]
      if (minX > maxX) continue
      const rowOffset = py * width * 4
      const dy = (py / height - 0.5) * physicalViewWidth
      const yFringePart = dy * sinF
      const yEnvPart = dy * sinE
      for (let px = minX; px <= maxX; px++) {
        const dx = colDx[px]
        const xFringe = dx * cosF + yFringePart
        const xEnv = dx * cosE + yEnvPart
        const intVal = readLutFast(interferenceLut, xFringe, lutScale, halfN)
        const envVal = readLutFast(diffractionLut, xEnv, lutScale, halfN)
        const intensity = fastPow08(intVal * envVal)
        const p4 = rowOffset + px * 4
        data[p4] = rR * intensity
        data[p4 + 1] = rG * intensity
        data[p4 + 2] = rB * intensity
        data[p4 + 3] = 255
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  drawEyepieceBorder(ctx, cx, cy, radius)
}

/**
 * Draw white-light interference pattern with optional filter.
 * Cached by (params, filterColor, angles) key. Zero-copy cache hit.
 */
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  filterColor: FilterColor,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
  wavelengthStep = 5,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 2
  const n = width * height

  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const a = params.slitWidth * 1e-3
  const physicalViewWidth = PHYSICAL_VIEW_WIDTH

  const cacheKey = buildPatternCacheKey(params, filterColor, doubleSlitAngle, singleSlitAngle, wavelengthStep, width, height)

  const { rowMinX, rowMaxX } = getCircleMask(width, height, cx, cy, radius)
  const { imgData } = ensureBuffers(ctx, n)

  // Zero-copy cache hit: normalize directly from cached accumulators
  const cached = patternCache.get(cacheKey, n)
  if (cached) {
    normalizeToImageData(imgData, cached.accR, cached.accG, cached.accB, width, height, rowMinX, rowMaxX)
    ctx.putImageData(imgData, 0, 0)
    drawEyepieceBorder(ctx, cx, cy, radius)
    return
  }

  // Cache miss: compute into reusable buffers
  const { accR, accG, accB } = ensureBuffers(ctx, n)
  accR.fill(0)
  accG.fill(0)
  accB.fill(0)

  const cosF = Math.cos(doubleSlitAngle * Math.PI / 180)
  const sinF = Math.sin(doubleSlitAngle * Math.PI / 180)
  const cosE = Math.cos(singleSlitAngle * Math.PI / 180)
  const sinE = Math.sin(singleSlitAngle * Math.PI / 180)

  const lutSize = computeLutSize(width, height)
  const lutScale = lutSize / (physicalViewWidth * SQRT2)
  const halfN = lutSize / 2
  const { interferenceLut, diffractionLut, colDx, colInt, colEnv } = ensureLutBuffers(lutSize, width)

  // Pre-compute per-column dx values
  for (let px = 0; px < width; px++) {
    colDx[px] = (px / width - 0.5) * physicalViewWidth
  }

  for (let wl = 400; wl <= 700; wl += wavelengthStep) {
    const filterWeight = filterTransmission(wl, filterColor)
    if (filterWeight === 0) continue

    const lambda = wl * 1e-9
    const rgb = waveLengthToRGB(wl)
    if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) continue

    // Pre-compute 1D LUTs for this wavelength
    const intFactor = (Math.PI * d) / (lambda * L)
    const difFactor = (Math.PI * a) / (lambda * L)
    for (let i = 0; i <= lutSize; i++) {
      const phys = (i - halfN) / lutScale
      const phaseI = intFactor * phys
      const cosV = Math.cos(phaseI)
      interferenceLut[i] = cosV * cosV
      const phaseD = difFactor * phys
      if (Math.abs(phaseD) < 1e-10) {
        diffractionLut[i] = 1.0
      } else {
        const sinc = Math.sin(phaseD) / phaseD
        diffractionLut[i] = sinc * sinc
      }
    }

    const rR = rgb[0] * filterWeight
    const rG = rgb[1] * filterWeight
    const rB = rgb[2] * filterWeight

    if (doubleSlitAngle === 0 && singleSlitAngle === 0) {
      for (let px = 0; px < width; px++) {
        const dx = colDx[px]
        colInt[px] = readLutUnsafe(interferenceLut, dx, lutScale, halfN)
        colEnv[px] = readLutUnsafe(diffractionLut, dx, lutScale, halfN)
      }
      for (let py = 0; py < height; py++) {
        const minX = rowMinX[py]
        const maxX = rowMaxX[py]
        if (minX > maxX) continue
        const rowBase = py * width
        for (let px = minX; px <= maxX; px++) {
          const intensity = fastPow08(colInt[px] * colEnv[px])
          const idx = rowBase + px
          accR[idx] += rR * intensity
          accG[idx] += rG * intensity
          accB[idx] += rB * intensity
        }
      }
    } else {
      for (let py = 0; py < height; py++) {
        const minX = rowMinX[py]
        const maxX = rowMaxX[py]
        if (minX > maxX) continue
        const dy = (py / height - 0.5) * physicalViewWidth
        const yFringePart = dy * sinF
        const yEnvPart = dy * sinE
        const rowBase = py * width
        for (let px = minX; px <= maxX; px++) {
          const dx = colDx[px]
          const xFringe = dx * cosF + yFringePart
          const xEnv = dx * cosE + yEnvPart
          const intVal = readLutFast(interferenceLut, xFringe, lutScale, halfN)
          const envVal = readLutFast(diffractionLut, xEnv, lutScale, halfN)
          const intensity = fastPow08(intVal * envVal)
          const idx = rowBase + px
          accR[idx] += rR * intensity
          accG[idx] += rG * intensity
          accB[idx] += rB * intensity
        }
      }
    }
  }

  patternCache.store(cacheKey, accR, accG, accB)
  normalizeToImageData(imgData, accR, accG, accB, width, height, rowMinX, rowMaxX)
  ctx.putImageData(imgData, 0, 0)
  drawEyepieceBorder(ctx, cx, cy, radius)
}
