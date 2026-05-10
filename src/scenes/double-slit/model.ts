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

export type FilterColor = 'none' | 'red' | 'green' | 'blue'

export const FILTER_HEX: Record<Exclude<FilterColor, 'none'>, number> = {
  red: 0xff4444,
  green: 0x44cc44,
  blue: 0x4488ff,
}

export const FILTER_LABEL: Record<FilterColor, string> = {
  none: '',
  red: '红',
  green: '绿',
  blue: '蓝',
}

export const FILTER_PROFILES: Record<Exclude<FilterColor, 'none'>, { center: number; halfWidth: number }> = {
  red: { center: 620, halfWidth: 30 },
  green: { center: 540, halfWidth: 25 },
  blue: { center: 460, halfWidth: 25 },
}

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

export const PHYSICAL_VIEW_WIDTH = 0.02

export function waveLengthToRGB(wl: number): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  let alpha = 0

  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380)
    b = 1.0
  } else if (wl >= 440 && wl < 490) {
    g = (wl - 440) / (490 - 440)
    b = 1.0
  } else if (wl >= 490 && wl < 510) {
    g = 1.0
    b = -(wl - 510) / (510 - 490)
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510)
    g = 1.0
  } else if (wl >= 580 && wl < 645) {
    r = 1.0
    g = -(wl - 645) / (645 - 580)
  } else if (wl >= 645 && wl <= 780) {
    r = 1.0
  }

  if (wl >= 380 && wl < 420) {
    alpha = 0.3 + 0.7 * (wl - 380) / (420 - 380)
  } else if (wl >= 420 && wl <= 700) {
    alpha = 1.0
  } else if (wl > 700 && wl <= 780) {
    alpha = 0.3 + 0.7 * (780 - wl) / (780 - 700)
  }

  return [
    Math.round(r * alpha * 255),
    Math.round(g * alpha * 255),
    Math.round(b * alpha * 255),
  ]
}

export function waveLengthToHex(wl: number): number {
  const [r, g, b] = waveLengthToRGB(wl)
  return (r << 16) | (g << 8) | b
}

export function computeFringeSpacing(params: DoubleSlitParams): number {
  const lambda = params.wavelength * 1e-9
  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  return (L * lambda) / d
}

export function formatFringeSpacing(params: DoubleSlitParams): string {
  const spacingM = computeFringeSpacing(params)
  const spacingMm = spacingM * 1000
  return spacingMm < 0.01 ? spacingMm.toExponential(2) + ' mm' : spacingMm.toFixed(3) + ' mm'
}

export function formatWhiteLightFringeRange(params: DoubleSlitParams): string {
  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const minMm = (L * 400e-9 / d) * 1000
  const maxMm = (L * 700e-9 / d) * 1000
  const fmt = (v: number) => v < 0.01 ? v.toExponential(2) : v.toFixed(3)
  return `${fmt(minMm)}–${fmt(maxMm)} mm`
}

function drawEyepieceBorder(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const edgeGradient = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius)
  edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
  ctx.fillStyle = edgeGradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
}

// ========== Performance: reusable buffers ==========

let _imgData: ImageData | null = null
let _imgDataU32: Uint32Array | null = null
let _accR: Float32Array | null = null
let _accG: Float32Array | null = null
let _accB: Float32Array | null = null
let _bufCapacity = 0

function ensureBuffers(ctx: CanvasRenderingContext2D, n: number): { imgData: ImageData; imgDataU32: Uint32Array; accR: Float32Array; accG: Float32Array; accB: Float32Array } {
  if (n > _bufCapacity) {
    _accR = new Float32Array(n)
    _accG = new Float32Array(n)
    _accB = new Float32Array(n)
    _bufCapacity = n
    _imgData = null
  }
  if (!_imgData || _imgData.width !== ctx.canvas.width || _imgData.height !== ctx.canvas.height) {
    _imgData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height)
    _imgDataU32 = new Uint32Array(_imgData.data.buffer)
  }
  return { imgData: _imgData!, imgDataU32: _imgDataU32!, accR: _accR!, accG: _accG!, accB: _accB! }
}

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

interface CachedPattern {
  key: string
  accR: Float32Array
  accG: Float32Array
  accB: Float32Array
}

const PATTERN_CACHE_BUDGET = 30 * 1024 * 1024 // 30MB
const _patternCacheBudget = PATTERN_CACHE_BUDGET
let _patternCacheBytes = 0
const patternCache: CachedPattern[] = []

function entryBytes(entry: CachedPattern): number {
  return entry.accR.byteLength + entry.accG.byteLength + entry.accB.byteLength
}

function getCachedPattern(key: string, n: number): CachedPattern | null {
  const idx = patternCache.findIndex((c) => c.key === key)
  if (idx === -1) return null
  if (patternCache[idx].accR.length < n) {
    _patternCacheBytes -= entryBytes(patternCache[idx])
    patternCache.splice(idx, 1)
    return null
  }
  if (idx > 0) {
    const [entry] = patternCache.splice(idx, 1)
    patternCache.unshift(entry)
  }
  return patternCache[0]
}

function storeCachedPattern(key: string, accR: Float32Array, accG: Float32Array, accB: Float32Array): void {
  const newEntry: CachedPattern = {
    key,
    accR: new Float32Array(accR),
    accG: new Float32Array(accG),
    accB: new Float32Array(accB),
  }
  const newBytes = entryBytes(newEntry)
  // Evict oldest entries until budget allows new entry
  while (_patternCacheBytes + newBytes > _patternCacheBudget && patternCache.length > 0) {
    const evicted = patternCache.pop()!
    _patternCacheBytes -= entryBytes(evicted)
  }
  patternCache.unshift(newEntry)
  _patternCacheBytes += newBytes
}

export function setPatternCacheMax(maxEntries: number): void {
  // Clamp cache to at most maxEntries entries (byte budget is computed from actual sizes).
  while (patternCache.length > maxEntries) {
    const evicted = patternCache.pop()!
    _patternCacheBytes -= entryBytes(evicted)
  }
}

function buildPatternCacheKey(params: DoubleSlitParams, filterColor: FilterColor, doubleSlitAngle: number, singleSlitAngle: number, wavelengthStep: number, width: number, height: number): string {
  return `${width}_${height}_${params.slitDistance.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.slitWidth.toFixed(3)}_${filterColor}_${doubleSlitAngle.toFixed(1)}_${singleSlitAngle.toFixed(1)}_${wavelengthStep}`
}

// ========== Performance: circle mask ==========

const circleMaskCache = new Map<string, { rowMinX: Int32Array; rowMaxX: Int32Array }>()
const CIRCLE_MASK_CACHE_MAX = 8

function getCircleMask(w: number, h: number, cx: number, cy: number, radius: number) {
  const key = `${w}_${h}_${cx}_${cy}_${radius}`
  let cached = circleMaskCache.get(key)
  if (cached) return cached

  const rowMinX = new Int32Array(h)
  const rowMaxX = new Int32Array(h)
  const rSq = radius * radius

  for (let y = 0; y < h; y++) {
    const dy = y - cy
    const dySq = dy * dy
    if (dySq > rSq) {
      rowMinX[y] = 0
      rowMaxX[y] = -1
      continue
    }
    const dxMax = Math.sqrt(rSq - dySq)
    rowMinX[y] = Math.max(0, Math.ceil(cx - dxMax))
    rowMaxX[y] = Math.min(w - 1, Math.floor(cx + dxMax))
  }

  cached = { rowMinX, rowMaxX }
  circleMaskCache.set(key, cached)
  if (circleMaskCache.size > CIRCLE_MASK_CACHE_MAX) {
    const oldest = circleMaskCache.keys().next().value
    if (oldest !== undefined) circleMaskCache.delete(oldest)
  }
  return cached
}

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

export function fastPow08(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const x2 = x * x
  return x * (1.0 + 0.21875 * (1 - x) + 0.3125 * x * (1 - x) + 0.0625 * x2 * (1 - x))
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
  const scale = maxVal > 0 ? 255 / maxVal : 1
  const data = imgData.data
  for (let y = 0; y < height; y++) {
    const minX = rowMinX[y]
    const maxX = rowMaxX[y]
    if (minX > maxX) continue
    const rowBase = y * width
    const rowOffset = rowBase * 4
    for (let px = minX; px <= maxX; px++) {
      const idx = rowBase + px
      const pi = rowOffset + px * 4
      data[pi] = srcR[idx] * scale
      data[pi + 1] = srcG[idx] * scale
      data[pi + 2] = srcB[idx] * scale
      data[pi + 3] = 255
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

  const filterProfile = filterColor !== 'none' ? FILTER_PROFILES[filterColor] : null
  const cacheKey = buildPatternCacheKey(params, filterColor, doubleSlitAngle, singleSlitAngle, wavelengthStep, width, height)

  const { rowMinX, rowMaxX } = getCircleMask(width, height, cx, cy, radius)
  const { imgData } = ensureBuffers(ctx, n)

  // Zero-copy cache hit: normalize directly from cached accumulators
  const cached = getCachedPattern(cacheKey, n)
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
    let filterWeight = 1.0
    if (filterProfile) {
      const dist = Math.abs(wl - filterProfile.center)
      filterWeight = dist <= filterProfile.halfWidth
        ? 1.0 - 0.7 * (dist / filterProfile.halfWidth) ** 2
        : 0.15
    }

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

  storeCachedPattern(cacheKey, accR, accG, accB)
  normalizeToImageData(imgData, accR, accG, accB, width, height, rowMinX, rowMaxX)
  ctx.putImageData(imgData, 0, 0)
  drawEyepieceBorder(ctx, cx, cy, radius)
}
