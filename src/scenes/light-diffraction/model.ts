/**
 * Light diffraction simulation model
 * Pure physics — no React dependencies
 *
 * Supports four diffraction modes:
 * - single-slit: Fraunhofer single-slit diffraction
 * - circular-aperture: Airy disk (Bessel J1)
 * - circular-obstacle: Poisson spot (Babinet's principle)
 * - diffraction-grating: Multi-slit diffraction grating
 */

export type DiffractionMode = 'single-slit' | 'circular-aperture' | 'circular-obstacle' | 'diffraction-grating'

export type FilterColor = 'none' | 'red' | 'green' | 'blue'

export const FILTER_HEX: Record<Exclude<FilterColor, 'none'>, number> = {
  red: 0xff4444,
  green: 0x44cc44,
  blue: 0x4488ff,
}

export const FILTER_RGB: Record<Exclude<FilterColor, 'none'>, [number, number, number]> = {
  red: [0xff, 0x44, 0x44],
  green: [0x44, 0xcc, 0x44],
  blue: [0x44, 0x88, 0xff],
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

export const MODE_LABEL: Record<DiffractionMode, string> = {
  'single-slit': '单缝衍射',
  'circular-aperture': '圆孔衍射',
  'circular-obstacle': '圆球衍射',
  'diffraction-grating': '衍射光栅',
}

export type DiffractionParams = {
  wavelength: number // nm (400 ~ 700)
  apertureSize: number // mm, range varies by mode
  screenDistance: number // m (0.5 ~ 2.0)
  gratingLines: number // lines/mm (100 ~ 600), only for grating mode
}

export const DEFAULT_PARAMS: DiffractionParams = {
  wavelength: 532,
  apertureSize: 0.10,
  screenDistance: 1.0,
  gratingLines: 300,
}

export const DEFAULT_MODE: DiffractionMode = 'single-slit'

// Physical view width on screen (m)
export const PHYSICAL_VIEW_WIDTH = 0.02
const PHYSICAL_VIEW_WIDTH_GRATING = 0.5

export function getPhysicalViewWidth(mode: DiffractionMode): number {
  return mode === 'diffraction-grating' ? PHYSICAL_VIEW_WIDTH_GRATING : PHYSICAL_VIEW_WIDTH
}

// Effective illuminated width on the grating (m)
const GRATING_ILLUMINATED_WIDTH = 1.5e-3

// ====== Wavelength utilities (shared with double-slit) ======

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

// ====== Bessel J1 approximation ======

function besselJ1(x: number): number {
  const ax = Math.abs(x)
  if (ax < 0.001) return x * 0.5

  if (ax < 3) {
    const z = x * x
    return x * (0.5 - z * (0.0625 - z * (0.0026041667 - z * 0.0000542535)))
  }

  // Asymptotic expansion for |x| >= 3
  const z = 3.0 / ax
  const xx = ax - 2.356194491
  const p1 = 1.0 + z * z * (0.00183105 + z * z * (-0.00003516396 + z * z * 0.00000245752))
  const p2 = z * (0.046875 + z * z * (-0.00020026909 + z * z * 0.0000084492))
  const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p1 - Math.sin(xx) * p2)
  return x < 0 ? -ans : ans
}

// ====== Intensity functions ======

export function fastPow08(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const x2 = x * x
  return x * (1.0 + 0.21875 * (1 - x) + 0.3125 * x * (1 - x) + 0.0625 * x2 * (1 - x))
}

/**
 * Single-slit diffraction intensity (Fraunhofer)
 * I(θ) = I0 * (sinβ/β)², β = (πa sinθ)/λ
 * For small angles: sinθ ≈ y/L, so β ≈ πa*y/(λ*L)
 */
export function singleSlitIntensity(y: number, params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const a = params.apertureSize * 1e-3
  const L = params.screenDistance
  const beta = (Math.PI * a * y) / (lambda * L)
  if (Math.abs(beta) < 1e-10) return 1.0
  const sinc = Math.sin(beta) / beta
  return sinc * sinc
}

/**
 * Circular aperture diffraction intensity (Airy pattern)
 * I(θ) = I0 * [2J1(x)/x]², x = (πD sinθ)/λ
 */
export function circularApertureIntensity(y: number, params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const D = params.apertureSize * 1e-3
  const L = params.screenDistance
  // For radial coordinate r = |y| on screen (small angle)
  const r = Math.abs(y)
  const x = (Math.PI * D * r) / (lambda * L)
  if (Math.abs(x) < 1e-10) return 1.0
  const j1 = besselJ1(x)
  const v = (2.0 * j1) / x
  return v * v
}

/**
 * Circular obstacle diffraction intensity (Poisson spot, Babinet's principle)
 * I(θ) ≈ I0 * [1 - 2J1(x)/x]²
 */
export function circularObstacleIntensity(y: number, params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const D = params.apertureSize * 1e-3
  const L = params.screenDistance
  const r = Math.abs(y)
  const x = (Math.PI * D * r) / (lambda * L)
  if (Math.abs(x) < 1e-10) {
    // Teaching compromise: Poisson spot is a near-field / Fresnel effect.
    // In the Fraunhofer limit the center goes to zero, but we keep a
    // visibly bright value so the Poisson spot can be seen in the pattern.
    return 0.40
  }
  const j1 = besselJ1(x)
  const v = 1.0 - (2.0 * j1) / x
  return v * v
}

/**
 * Diffraction grating intensity
 * I = I0 * (sinβ/β)² * (sin(Nγ)/sinγ)²
 * β = (πa sinθ)/λ  (single-slit envelope)
 * γ = (πd sinθ)/λ  (grating phase)
 * a = slit width, d = grating spacing, N = number of slits
 */
export function gratingIntensity(y: number, params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const d = 1e-3 / params.gratingLines // grating spacing in m
  const a = d * 0.2 // slit width = 20% of spacing
  const L = params.screenDistance
  const theta = y / L // small angle approximation
  const sinTheta = Math.sin(theta)

  // Single-slit envelope
  const beta = (Math.PI * a * sinTheta) / lambda
  const envelope = Math.abs(beta) < 1e-10 ? 1.0 : (Math.sin(beta) / beta) ** 2

  // Grating interference
  const gamma = (Math.PI * d * sinTheta) / lambda
  if (Math.abs(gamma) < 1e-10) return envelope
  const sinGamma = Math.sin(gamma)
  if (Math.abs(sinGamma) < 1e-10) {
    // gamma ≈ mπ, grating factor → 1 in the limit
    return envelope
  }
  const N = Math.max(10, Math.round(GRATING_ILLUMINATED_WIDTH * params.gratingLines))
  const grating = (Math.sin(N * gamma) / sinGamma) ** 2 / (N * N)

  return envelope * grating
}

/**
 * Get intensity function by mode
 */
export function getIntensityFunction(mode: DiffractionMode): (y: number, params: DiffractionParams) => number {
  switch (mode) {
    case 'single-slit': return singleSlitIntensity
    case 'circular-aperture': return circularApertureIntensity
    case 'circular-obstacle': return circularObstacleIntensity
    case 'diffraction-grating': return gratingIntensity
  }
}

// ====== Derived physical quantities ======

/**
 * Central maximum width (single-slit): Δy = 2λL/a
 */
export function singleSlitCentralWidth(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const a = params.apertureSize * 1e-3
  const L = params.screenDistance
  return (2 * lambda * L) / a
}

/**
 * Airy disk radius (circular aperture): r₁ ≈ 1.22λL/D
 */
export function airyDiskRadius(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const D = params.apertureSize * 1e-3
  const L = params.screenDistance
  return (1.22 * lambda * L) / D
}

/**
 * First minimum angle (single-slit): θ₁ = λ/a
 */
export function firstMinimumAngle(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const a = params.apertureSize * 1e-3
  return Math.asin(lambda / a) * (180 / Math.PI)
}

/**
 * Grating first-order angle: θ₁ = arcsin(λ/d)
 */
export function gratingFirstOrderAngle(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const d = 1e-3 / params.gratingLines
  const sinTheta = lambda / d
  if (sinTheta > 1) return 90
  return Math.asin(sinTheta) * (180 / Math.PI)
}

export function formatCentralWidth(params: DiffractionParams, mode: DiffractionMode): string {
  if (mode === 'single-slit' || mode === 'diffraction-grating') {
    const w = singleSlitCentralWidth(params) * 1000 // m -> mm
    return w < 0.01 ? w.toExponential(2) + ' mm' : w.toFixed(3) + ' mm'
  }
  if (mode === 'circular-aperture' || mode === 'circular-obstacle') {
    const r = airyDiskRadius(params) * 1000 // m -> mm
    return r < 0.01 ? r.toExponential(2) + ' mm' : r.toFixed(3) + ' mm'
  }
  return '--'
}

export function formatFeatureLabel(mode: DiffractionMode): string {
  switch (mode) {
    case 'single-slit': return '中央亮纹宽度'
    case 'circular-aperture': return '艾里斑半径'
    case 'circular-obstacle': return '第一暗环半径'
    case 'diffraction-grating': return '一级衍射角'
  }
}

export function formatFeatureValue(params: DiffractionParams, mode: DiffractionMode): string {
  switch (mode) {
    case 'single-slit':
    case 'circular-aperture':
    case 'circular-obstacle':
      return formatCentralWidth(params, mode)
    case 'diffraction-grating':
      return gratingFirstOrderAngle(params).toFixed(2) + '°'
  }
}

export function formatWhiteLightFeatureValue(params: DiffractionParams, mode: DiffractionMode): string {
  if (mode === 'diffraction-grating') {
    const minAngle = gratingFirstOrderAngle({ ...params, wavelength: 400 })
    const maxAngle = gratingFirstOrderAngle({ ...params, wavelength: 700 })
    return `${minAngle.toFixed(2)}°–${maxAngle.toFixed(2)}°`
  }
  const minParams = { ...params, wavelength: 400 }
  const maxParams = { ...params, wavelength: 700 }
  const minW = formatCentralWidth(minParams, mode)
  const maxW = formatCentralWidth(maxParams, mode)
  return `${minW}–${maxW}`
}

// ====== Aperture size range by mode ======

export function getApertureRange(mode: DiffractionMode): { min: number; max: number; step: number } {
  switch (mode) {
    case 'single-slit':
      return { min: 0.02, max: 0.30, step: 0.01 }
    case 'circular-aperture':
    case 'circular-obstacle':
      return { min: 0.05, max: 0.50, step: 0.01 }
    case 'diffraction-grating':
      return { min: 0.05, max: 0.20, step: 0.01 }
  }
}

export function clampApertureSize(mode: DiffractionMode, value: number): number {
  const range = getApertureRange(mode)
  return Math.max(range.min, Math.min(range.max, value))
}

// ====== Drawing utilities ======

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

// Reusable buffers
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

// Circle mask cache
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

// ====== Pattern drawing ======

export function drawDiffractionPattern(
  ctx: CanvasRenderingContext2D,
  params: DiffractionParams,
  mode: DiffractionMode,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const cx = width / 2
  const cy = height / 2

  const n = width * height
  const rgb = waveLengthToRGB(params.wavelength)
  const physicalViewWidth = getPhysicalViewWidth(mode)

  const { imgData, imgDataU32 } = ensureBuffers(ctx, n)
  const data = imgData.data

  const intensityFn = getIntensityFunction(mode)

  // Pre-compute per-column physical coordinates
  const colX = new Float32Array(width)
  for (let px = 0; px < width; px++) {
    colX[px] = (px / width - 0.5) * physicalViewWidth
  }

  imgDataU32.fill(0)

  if (mode === 'circular-aperture' || mode === 'circular-obstacle') {
    // 2D radial pattern — use radial LUT to avoid per-pixel intensityFn calls
    const radius = Math.min(width, height) / 2 - 2
    const { rowMinX, rowMaxX } = getCircleMask(width, height, cx, cy, radius)
    const scalePhys = physicalViewWidth / width
    const maxPxRadius = Math.ceil(radius)
    const radialLut = new Float32Array(maxPxRadius + 1)
    for (let rPx = 0; rPx <= maxPxRadius; rPx++) {
      radialLut[rPx] = fastPow08(intensityFn(rPx * scalePhys, params))
    }

    for (let py = 0; py < height; py++) {
      const minX = rowMinX[py]
      const maxX = rowMaxX[py]
      if (minX > maxX) continue
      const dyPx = py - cy
      const rowOffset = py * width * 4
      for (let px = minX; px <= maxX; px++) {
        const dxPx = px - cx
        const rPx = Math.round(Math.sqrt(dxPx * dxPx + dyPx * dyPx))
        const intensity = radialLut[Math.min(rPx, maxPxRadius)]
        const p4 = rowOffset + px * 4
        data[p4] = rgb[0] * intensity
        data[p4 + 1] = rgb[1] * intensity
        data[p4 + 2] = rgb[2] * intensity
        data[p4 + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)
    drawEyepieceBorder(ctx, cx, cy, radius)
  } else {
    // 1D horizontal pattern (single-slit or grating)
    // Compute intensity for each column, then replicate vertically
    const colInt = new Float32Array(width)
    for (let px = 0; px < width; px++) {
      colInt[px] = fastPow08(intensityFn(colX[px], params))
    }

    // For single-slit and grating, draw a rectangular strip with vertical fringes
    // Fill the full canvas but darken outside a central band
    const stripHalfHeight = height * 0.35
    const stripTop = Math.round(cy - stripHalfHeight)
    const stripBottom = Math.round(cy + stripHalfHeight)

    for (let py = 0; py < height; py++) {
      const rowOffset = py * width * 4
      const inStrip = py >= stripTop && py <= stripBottom
      const dimFactor = inStrip ? 1.0 : 0.08
      for (let px = 0; px < width; px++) {
        const intensity = colInt[px] * dimFactor
        const p4 = rowOffset + px * 4
        data[p4] = rgb[0] * intensity
        data[p4 + 1] = rgb[1] * intensity
        data[p4 + 2] = rgb[2] * intensity
        data[p4 + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)

    // Draw border around the strip
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, stripTop, width, stripBottom - stripTop)
  }
}

// White light cache (same pattern as double-slit)
interface CachedPattern {
  key: string
  accR: Float32Array
  accG: Float32Array
  accB: Float32Array
}

const PATTERN_CACHE_BUDGET = 30 * 1024 * 1024
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
  while (_patternCacheBytes + newBytes > PATTERN_CACHE_BUDGET && patternCache.length > 0) {
    const evicted = patternCache.pop()!
    _patternCacheBytes -= entryBytes(evicted)
  }
  patternCache.unshift(newEntry)
  _patternCacheBytes += newBytes
}

export function setPatternCacheMax(maxEntries: number): void {
  while (patternCache.length > maxEntries) {
    const evicted = patternCache.pop()!
    _patternCacheBytes -= entryBytes(evicted)
  }
}

function buildPatternCacheKey(
  mode: DiffractionMode,
  params: DiffractionParams,
  filterColor: FilterColor,
  width: number,
  height: number,
): string {
  // Wavelength is omitted because white-light patterns do not depend on the monochromatic wavelength
  return `${mode}_${width}_${height}_${params.apertureSize.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.gratingLines}_${filterColor}`
}

export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  mode: DiffractionMode,
  params: DiffractionParams,
  filterColor: FilterColor,
  wavelengthStep = 5,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const cx = width / 2
  const cy = height / 2
  const n = width * height

  const physicalViewWidth = getPhysicalViewWidth(mode)
  const filterProfile = filterColor !== 'none' ? FILTER_PROFILES[filterColor] : null
  const cacheKey = buildPatternCacheKey(mode, params, filterColor, width, height)

  const { rowMinX, rowMaxX } = getCircleMask(width, height, cx, cy, Math.min(width, height) / 2 - 2)
  const { imgData } = ensureBuffers(ctx, n)

  const cached = getCachedPattern(cacheKey, n)
  if (cached) {
    // For 1D modes, we don't use circle mask; normalize differently
    if (mode === 'circular-aperture' || mode === 'circular-obstacle') {
      normalizeToImageData(imgData, cached.accR, cached.accG, cached.accB, width, height, rowMinX, rowMaxX)
    } else {
      normalizeToRectImageData(imgData, cached.accR, cached.accG, cached.accB, width, height)
    }
    ctx.putImageData(imgData, 0, 0)
    if (mode === 'circular-aperture' || mode === 'circular-obstacle') {
      drawEyepieceBorder(ctx, cx, cy, Math.min(width, height) / 2 - 2)
    }
    return
  }

  const { accR, accG, accB } = ensureBuffers(ctx, n)
  accR.fill(0)
  accG.fill(0)
  accB.fill(0)

  // Pre-compute column physical coords
  const colX = new Float32Array(width)
  for (let px = 0; px < width; px++) {
    colX[px] = (px / width - 0.5) * physicalViewWidth
  }

  const is2D = mode === 'circular-aperture' || mode === 'circular-obstacle'
  const colY = is2D ? new Float32Array(height) : null
  if (colY) {
    for (let py = 0; py < height; py++) {
      colY[py] = (py / height - 0.5) * physicalViewWidth
    }
  }

  const intensityFn = getIntensityFunction(mode)

  // Pre-compute radial LUT for 2D modes to avoid per-pixel intensityFn calls
  const scalePhys = physicalViewWidth / width
  const maxPxRadius = is2D ? Math.ceil(Math.min(width, height) / 2 - 2) : 0
  const radialLut = is2D ? new Float32Array(maxPxRadius + 1) : null

  for (let wl = 400; wl <= 700; wl += wavelengthStep) {
    let filterWeight = 1.0
    if (filterProfile) {
      const dist = Math.abs(wl - filterProfile.center)
      filterWeight = dist <= filterProfile.halfWidth
        ? 1.0 - 0.7 * (dist / filterProfile.halfWidth) ** 2
        : 0.15
    }

    const rgb = waveLengthToRGB(wl)
    if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) continue

    const pR = rgb[0] * filterWeight
    const pG = rgb[1] * filterWeight
    const pB = rgb[2] * filterWeight

    if (is2D) {
      for (let rPx = 0; rPx <= maxPxRadius; rPx++) {
        radialLut![rPx] = fastPow08(intensityFn(rPx * scalePhys, { ...params, wavelength: wl }))
      }
      for (let py = 0; py < height; py++) {
        const minX = rowMinX[py]
        const maxX = rowMaxX[py]
        if (minX > maxX) continue
        const dyPx = py - cy
        const rowBase = py * width
        for (let px = minX; px <= maxX; px++) {
          const dxPx = px - cx
          const rPx = Math.round(Math.sqrt(dxPx * dxPx + dyPx * dyPx))
          const intensity = radialLut![Math.min(rPx, maxPxRadius)]
          const idx = rowBase + px
          accR[idx] += pR * intensity
          accG[idx] += pG * intensity
          accB[idx] += pB * intensity
        }
      }
    } else {
      // 1D: accumulate column intensities, then replicate
      const colInt = new Float32Array(width)
      for (let px = 0; px < width; px++) {
        colInt[px] = fastPow08(intensityFn(colX[px], { ...params, wavelength: wl }))
      }
      const stripHalfHeight = height * 0.35
      const stripTop = Math.round(cy - stripHalfHeight)
      const stripBottom = Math.round(cy + stripHalfHeight)
      for (let py = 0; py < height; py++) {
        const inStrip = py >= stripTop && py <= stripBottom
        const dimFactor = inStrip ? 1.0 : 0.08
        const rowBase = py * width
        for (let px = 0; px < width; px++) {
          const intensity = colInt[px] * dimFactor
          const idx = rowBase + px
          accR[idx] += pR * intensity
          accG[idx] += pG * intensity
          accB[idx] += pB * intensity
        }
      }
    }
  }

  storeCachedPattern(cacheKey, accR, accG, accB)
  if (is2D) {
    normalizeToImageData(imgData, accR, accG, accB, width, height, rowMinX, rowMaxX)
    ctx.putImageData(imgData, 0, 0)
    drawEyepieceBorder(ctx, cx, cy, Math.min(width, height) / 2 - 2)
  } else {
    normalizeToRectImageData(imgData, accR, accG, accB, width, height)
    ctx.putImageData(imgData, 0, 0)
  }
}

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
  // Global max for brightness reference
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
        // Local hue normalization preserves color regardless of brightness
        const nr = (rAcc / localMax) * 255
        const ng = (gAcc / localMax) * 255
        const nb = (bAcc / localMax) * 255
        // Global brightness with gamma so dim fringes remain visible
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

function normalizeToRectImageData(
  imgData: ImageData,
  srcR: Float32Array,
  srcG: Float32Array,
  srcB: Float32Array,
  width: number,
  height: number,
): void {
  let maxVal = 0
  const n = width * height
  for (let i = 0; i < n; i++) {
    const v = srcR[i] > srcG[i] ? (srcR[i] > srcB[i] ? srcR[i] : srcB[i]) : (srcG[i] > srcB[i] ? srcG[i] : srcB[i])
    if (v > maxVal) maxVal = v
  }

  const data = imgData.data
  const noiseThreshold = maxVal * 0.0005

  for (let i = 0; i < n; i++) {
    const rAcc = srcR[i]
    const gAcc = srcG[i]
    const bAcc = srcB[i]
    const localMax = Math.max(rAcc, gAcc, bAcc)

    if (localMax > noiseThreshold) {
      const nr = (rAcc / localMax) * 255
      const ng = (gAcc / localMax) * 255
      const nb = (bAcc / localMax) * 255
      const brightness = Math.max(0.15, Math.pow(localMax / maxVal, 0.3))
      const pi = i * 4
      data[pi] = Math.min(255, nr * brightness)
      data[pi + 1] = Math.min(255, ng * brightness)
      data[pi + 2] = Math.min(255, nb * brightness)
      data[pi + 3] = 255
    }
  }
}

// ====== Profile drawing for chart ======

export function drawDiffractionProfile(
  ctx: CanvasRenderingContext2D,
  mode: DiffractionMode,
  params: DiffractionParams,
  width: number,
  height: number,
  isWhiteLight?: boolean,
  filterColor?: FilterColor,
): void {
  const padding = 32
  const plotW = width - padding * 2
  const plotH = height - padding * 2 - 16 // extra for labels
  const bottom = padding + plotH

  ctx.clearRect(0, 0, width, height)

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding + (plotH * i) / 4
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }

  // Y-axis tick labels
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '10px ui-monospace, monospace'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const y = padding + (plotH * i) / 4
    const val = 1 - i / 4
    ctx.fillText(val.toFixed(2), padding - 6, y + 3)
  }

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, bottom)
  ctx.lineTo(width - padding, bottom)
  ctx.stroke()

  // Profile curve
  const intensityFn = getIntensityFunction(mode)
  const physicalViewWidth = getPhysicalViewWidth(mode)
  let colorStr: string
  if (isWhiteLight) {
    if (filterColor && filterColor !== 'none') {
      const rgb = FILTER_RGB[filterColor]
      colorStr = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
    } else {
      colorStr = '#e5e5e5'
    }
  } else {
    const rgb = waveLengthToRGB(params.wavelength)
    colorStr = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
  }

  ctx.strokeStyle = colorStr
  ctx.lineWidth = 2
  ctx.beginPath()

  const samples = mode === 'diffraction-grating' ? Math.min(plotW, 2400) : Math.min(plotW, 600)
  for (let i = 0; i <= samples; i++) {
    const frac = i / samples
    const yPhys = (frac - 0.5) * physicalViewWidth
    const intensity = intensityFn(yPhys, params)
    const px = padding + frac * plotW
    const py = bottom - intensity * plotH
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // Fill under curve
  ctx.fillStyle = colorStr.replace('rgb', 'rgba').replace(')', ',0.15)')
  ctx.lineTo(width - padding, bottom)
  ctx.lineTo(padding, bottom)
  ctx.closePath()
  ctx.fill()

  // X-axis physical ticks
  const halfW = physicalViewWidth / 2
  const useCm = halfW >= 0.05
  const unitScale = useCm ? 100 : 1000
  const unitName = useCm ? 'cm' : 'mm'
  const tickPositions = [
    { frac: 0, val: -halfW },
    { frac: 0.5, val: 0 },
    { frac: 1, val: halfW },
  ]
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '10px ui-monospace, monospace'
  ctx.textAlign = 'center'
  for (const tp of tickPositions) {
    const px = padding + tp.frac * plotW
    ctx.beginPath()
    ctx.moveTo(px, bottom)
    ctx.lineTo(px, bottom + 4)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
    const num = tp.val * unitScale
    const label = num === 0 ? '0' : `${num > 0 ? '+' : ''}${num.toFixed(useCm && Math.abs(num) % 1 > 0.01 ? 1 : 0)}`
    ctx.fillText(`${label}${unitName}`, px, bottom + 14)
  }

  // Labels
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('相对强度 I/I₀', padding + plotW / 2, padding - 8)
  ctx.fillText('屏上位置 y', padding + plotW / 2, height - 4)
}
