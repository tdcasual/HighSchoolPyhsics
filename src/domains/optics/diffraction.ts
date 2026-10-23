import { formatScientific } from '../../ui/formatNumber'
import { FILTER_PROFILES, FILTER_RGB, filterTransmission, type FilterColor } from './filters'
import { fastPow08 } from './patternCanvas'
import { createPatternRenderer, type Profile } from './patternRenderer'
import { waveLengthToRGB } from './spectrum'

export { FILTER_HEX, FILTER_LABEL, FILTER_PROFILES, FILTER_RGB, filterTransmission, type FilterColor } from './filters'
export { fastPow08 } from './patternCanvas'
export { waveLengthToHex, waveLengthToRGB } from './spectrum'
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

export const MODE_LABEL: Record<DiffractionMode, string> = {
  'single-slit': '单缝衍射',
  'circular-aperture': '圆孔衍射',
  'circular-obstacle': '圆盘衍射（泊松亮斑）',
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
  apertureSize: 0.1,
  screenDistance: 1.0,
  gratingLines: 300,
}

export const DEFAULT_MODE: DiffractionMode = 'single-slit'

// Minimum physical viewport widths (m). The final view expands with the
// selected parameters so the feature being measured stays inside the screen.
export const PHYSICAL_VIEW_WIDTH = 0.008
const PHYSICAL_VIEW_WIDTH_GRATING = 0.08

export function getPhysicalViewWidth(mode: DiffractionMode, params: DiffractionParams = DEFAULT_PARAMS): number {
  switch (mode) {
    case 'single-slit':
      return Math.max(PHYSICAL_VIEW_WIDTH, singleSlitCentralWidth(params) * 2.4)
    case 'circular-aperture':
      return Math.max(PHYSICAL_VIEW_WIDTH, airyDiskRadius(params) * 4.2)
    case 'circular-obstacle':
      return Math.max(PHYSICAL_VIEW_WIDTH, poissonSpotFirstDarkRadius(params) * 5)
    case 'diffraction-grating': {
      const firstOrder = gratingFirstOrderDisplacement(params)
      return Math.max(
        PHYSICAL_VIEW_WIDTH_GRATING,
        Number.isFinite(firstOrder) ? firstOrder * 2.6 : PHYSICAL_VIEW_WIDTH_GRATING,
      )
    }
  }
}

export const GRATING_ILLUMINATED_WIDTH_MM = 0.5
export const MAX_FAR_FIELD_FRESNEL_NUMBER = 0.1

/** Grating spacing d in meters for a line density given in lines/mm. */
export function gratingSpacing(gratingLines: number): number {
  return 1e-3 / gratingLines
}

/** The rendered grating model uses a slit width equal to 20% of d. */
export function gratingSlitWidth(gratingLines: number): number {
  return gratingSpacing(gratingLines) * 0.2
}

/** Number of slits illuminated by the fixed 0.5 mm beam. */
export function gratingIlluminatedSlitCount(gratingLines: number): number {
  return Math.max(1, Math.round(GRATING_ILLUMINATED_WIDTH_MM * gratingLines))
}

export function formatScreenDistance(value: number): string {
  const roundedUp = Math.ceil((value - 1e-9) * 1000) / 1000
  return `${Number(roundedUp.toFixed(3))} m`
}

/**
 * Conservative screen-distance floor for the Fraunhofer model. wavelengthNm
 * should be the shortest wavelength contributing to the pattern.
 */
export function getFarFieldMinimumScreenDistance(
  mode: DiffractionMode,
  params: DiffractionParams,
  wavelengthNm = params.wavelength,
): number {
  let halfWidthM = 0
  switch (mode) {
    case 'single-slit':
    case 'circular-aperture':
      halfWidthM = (params.apertureSize * 1e-3) / 2
      break
    case 'diffraction-grating':
      halfWidthM = (GRATING_ILLUMINATED_WIDTH_MM * 1e-3) / 2
      break
    case 'circular-obstacle':
      // This mode uses a separate near-axis Poisson-spot approximation.
      return 0
  }

  const wavelengthM = wavelengthNm * 1e-9
  if (!(wavelengthM > 0) || !Number.isFinite(halfWidthM)) return Number.POSITIVE_INFINITY
  return (halfWidthM * halfWidthM) / (wavelengthM * MAX_FAR_FIELD_FRESNEL_NUMBER)
}

/** Shortest screen distance that keeps the pattern in the far field (white light: for 400 nm), never under 0.5 m. */
export function resolveMinimumScreenDistance(
  mode: DiffractionMode,
  params: DiffractionParams,
  isWhiteLight: boolean,
): number {
  const shortestWavelength = isWhiteLight ? 400 : params.wavelength
  return Math.max(0.5, getFarFieldMinimumScreenDistance(mode, params, shortestWavelength))
}

/** `params` with the screen moved back to the far-field minimum if it is closer. */
export function constrainScreenDistance(
  mode: DiffractionMode,
  params: DiffractionParams,
  isWhiteLight: boolean,
): DiffractionParams {
  return {
    ...params,
    screenDistance: Math.max(params.screenDistance, resolveMinimumScreenDistance(mode, params, isWhiteLight)),
  }
}

// ====== Bessel approximations ======

function besselJ0(x: number): number {
  const ax = Math.abs(x)
  if (ax < 8) {
    const y = x * x
    const numerator =
      57568490574.0 +
      y * (-13362590354.0 + y * (651619640.7 + y * (-11214424.18 + y * (77392.33017 - y * 184.9052456))))
    const denominator =
      57568490411.0 + y * (1029532985.0 + y * (9494680.718 + y * (59272.64853 + y * (267.8532712 + y))))
    return numerator / denominator
  }
  const z = 8 / ax
  const y = z * z
  const phase = ax - 0.785398164
  const p = 1 + y * (-0.001098628627 + y * (0.00002734510407 + y * (-0.000002073370639 + y * 0.0000002093887211)))
  const q =
    -0.01562499995 +
    y * (0.0001430488765 + y * (-0.000006911147651 + y * (0.0000007621095161 - y * 0.0000000934945152)))
  return Math.sqrt(0.636619772 / ax) * (Math.cos(phase) * p - z * Math.sin(phase) * q)
}

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

/**
 * Single-slit diffraction intensity (Fraunhofer)
 * I(θ) = I0 * (sinβ/β)², β = (πa sinθ)/λ
 * A flat screen at distance L has sinθ = y / sqrt(L²+y²).
 */
function screenSinTheta(y: number, screenDistance: number): number {
  return y / Math.hypot(screenDistance, y)
}

export function singleSlitIntensity(y: number, params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const a = params.apertureSize * 1e-3
  const L = params.screenDistance
  const beta = (Math.PI * a * screenSinTheta(y, L)) / lambda
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
  const x = (Math.PI * D * screenSinTheta(r, L)) / lambda
  if (Math.abs(x) < 1e-10) return 1.0
  const j1 = besselJ1(x)
  const v = (2.0 * j1) / x
  return v * v
}

/**
 * Near-axis Fresnel/Babinet approximation for the Poisson spot behind a
 * circular opaque disk. For D << L, I(r)/I0 ≈ J0²(πDr/(λL)); the axis is bright.
 */
export function circularObstacleIntensity(y: number, params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const D = params.apertureSize * 1e-3
  const L = params.screenDistance
  const r = Math.abs(y)
  const radius = D / 2
  const effectiveDistance = Math.hypot(L, radius)
  const x = (Math.PI * D * r) / (lambda * effectiveDistance)
  const obliquity = (L / effectiveDistance) ** 2
  return obliquity * besselJ0(x) ** 2
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
  const d = gratingSpacing(params.gratingLines)
  const a = gratingSlitWidth(params.gratingLines)
  const L = params.screenDistance
  const sinTheta = screenSinTheta(y, L)

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
  const N = gratingIlluminatedSlitCount(params.gratingLines)
  const grating = (Math.sin(N * gamma) / sinGamma) ** 2 / (N * N)

  return envelope * grating
}

/**
 * Get intensity function by mode
 */
export function getIntensityFunction(mode: DiffractionMode): (y: number, params: DiffractionParams) => number {
  switch (mode) {
    case 'single-slit':
      return singleSlitIntensity
    case 'circular-aperture':
      return circularApertureIntensity
    case 'circular-obstacle':
      return circularObstacleIntensity
    case 'diffraction-grating':
      return gratingIntensity
  }
}

// ====== Derived physical quantities ======

/**
 * Central maximum width (single-slit): Δy = 2λL/a
 */
export function singleSlitCentralWidth(params: DiffractionParams): number {
  return 2 * singleSlitFirstMinimumPosition(params)
}

export function singleSlitFirstMinimumPosition(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const a = params.apertureSize * 1e-3
  const ratio = lambda / a
  if (ratio >= 1) return Number.POSITIVE_INFINITY
  return params.screenDistance * Math.tan(Math.asin(ratio))
}

/**
 * Airy disk radius (circular aperture): r₁ ≈ 1.22λL/D
 */
export function airyDiskRadius(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const D = params.apertureSize * 1e-3
  const ratio = (1.22 * lambda) / D
  if (ratio >= 1) return Number.POSITIVE_INFINITY
  return params.screenDistance * Math.tan(Math.asin(ratio))
}

/** First dark ring radius of the near-axis Poisson spot pattern. */
export function poissonSpotFirstDarkRadius(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const D = params.apertureSize * 1e-3
  const effectiveDistance = Math.hypot(params.screenDistance, D / 2)
  return (2.4048255577 * lambda * effectiveDistance) / (Math.PI * D)
}

/**
 * Grating first-order angle: θ₁ = arcsin(λ/d)
 */
export function gratingFirstOrderAngle(params: DiffractionParams): number {
  const lambda = params.wavelength * 1e-9
  const d = gratingSpacing(params.gratingLines)
  const sinTheta = lambda / d
  if (sinTheta >= 1) return 90
  return Math.asin(sinTheta) * (180 / Math.PI)
}

/** Screen displacement of the first grating order on a flat screen. */
export function gratingFirstOrderDisplacement(params: DiffractionParams): number {
  const angle = (gratingFirstOrderAngle(params) * Math.PI) / 180
  if (angle >= Math.PI / 2) return Number.POSITIVE_INFINITY
  return params.screenDistance * Math.tan(angle)
}

export function formatCentralWidth(params: DiffractionParams, mode: DiffractionMode): string {
  if (mode === 'single-slit' || mode === 'diffraction-grating') {
    const w = singleSlitCentralWidth(params) * 1000 // m -> mm
    return w < 0.01 ? formatScientific(w) + ' mm' : w.toFixed(3) + ' mm'
  }
  const r = (mode === 'circular-obstacle' ? poissonSpotFirstDarkRadius(params) : airyDiskRadius(params)) * 1000
  return r < 0.01 ? formatScientific(r) + ' mm' : r.toFixed(3) + ' mm'
}

export function formatFeatureLabel(mode: DiffractionMode): string {
  switch (mode) {
    case 'single-slit':
      return '中央亮纹宽度'
    case 'circular-aperture':
      return '艾里斑半径'
    case 'circular-obstacle':
      return '泊松亮斑第一暗环半径'
    case 'diffraction-grating':
      return '一级衍射角'
  }
}

export function formatFeatureValue(params: DiffractionParams, mode: DiffractionMode): string {
  switch (mode) {
    case 'single-slit':
    case 'circular-aperture':
    case 'circular-obstacle':
      return formatCentralWidth(params, mode)
    case 'diffraction-grating':
      return params.wavelength * 1e-9 >= gratingSpacing(params.gratingLines)
        ? '无一级衍射'
        : gratingFirstOrderAngle(params).toFixed(2) + '°'
  }
}

export function formatWhiteLightFeatureValue(
  params: DiffractionParams,
  mode: DiffractionMode,
  filterColor: FilterColor = 'none',
): string {
  const filterProfile = filterColor === 'none' ? null : FILTER_PROFILES[filterColor]
  const minWavelength = filterProfile ? filterProfile.center - filterProfile.halfWidth : 400
  const maxWavelength = filterProfile ? filterProfile.center + filterProfile.halfWidth : 700

  if (mode === 'diffraction-grating') {
    const minAngle = gratingFirstOrderAngle({ ...params, wavelength: minWavelength })
    const maxAngle = gratingFirstOrderAngle({ ...params, wavelength: maxWavelength })
    return `${minAngle.toFixed(2)}°–${maxAngle.toFixed(2)}°`
  }

  const minW = formatCentralWidth({ ...params, wavelength: minWavelength }, mode).replace(/ mm$/, '')
  const maxW = formatCentralWidth({ ...params, wavelength: maxWavelength }, mode)
  return `${minW}–${maxW}`
}

// ====== Aperture size range by mode ======

export function getApertureRange(mode: DiffractionMode): { min: number; max: number; step: number } {
  switch (mode) {
    case 'single-slit':
      return { min: 0.02, max: 0.3, step: 0.01 }
    case 'circular-aperture':
    case 'circular-obstacle':
      return { min: 0.05, max: 0.5, step: 0.01 }
    case 'diffraction-grating':
      return { min: 0.05, max: 0.2, step: 0.01 }
  }
}

export function clampApertureSize(mode: DiffractionMode, value: number): number {
  const range = getApertureRange(mode)
  return Math.max(range.min, Math.min(range.max, value))
}

const renderer = createPatternRenderer()

export function setPatternCacheMax(maxEntries: number): void {
  renderer.setCacheMax(maxEntries)
}

// ====== Pattern drawing ======

const isRound = (mode: DiffractionMode) => mode === 'circular-aperture' || mode === 'circular-obstacle'

/**
 * The screen at one wavelength: apertures and the Poisson spot as a radial profile in the
 * eyepiece; slits and gratings as a column profile on a strip (gratings averaged over 16
 * samples per pixel so their narrow orders are not missed).
 */
function patternProfile(
  mode: DiffractionMode,
  params: DiffractionParams,
  viewWidth: number,
  width: number,
  height: number,
): Profile {
  const intensity = getIntensityFunction(mode)
  if (isRound(mode)) {
    const pxToScreen = viewWidth / Math.min(width, height)
    const values = new Float32Array(Math.ceil(Math.min(width, height) / 2 - 2) + 1)
    for (let r = 0; r < values.length; r++) values[r] = fastPow08(intensity(r * pxToScreen, params))
    return { kind: 'radial', values }
  }
  const samples = mode === 'diffraction-grating' ? 16 : 1
  const values = new Float32Array(width)
  for (let px = 0; px < width; px++) {
    let sum = 0
    for (let sample = 0; sample < samples; sample++)
      sum += intensity(((px + (sample + 0.5) / samples) / width - 0.5) * viewWidth, params)
    values[px] = fastPow08(sum / samples)
  }
  return { kind: 'columns', values }
}

export function drawDiffractionPattern(
  ctx: CanvasRenderingContext2D,
  params: DiffractionParams,
  mode: DiffractionMode,
): void {
  const { width, height } = ctx.canvas
  const profile = patternProfile(mode, params, getPhysicalViewWidth(mode, params), width, height)
  renderer.drawMonochrome(ctx, isRound(mode) ? 'round' : 'strip', params.wavelength, profile)
}

/** White light (optionally filtered); the field is sized for the reddest, widest pattern. */
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  mode: DiffractionMode,
  params: DiffractionParams,
  filterColor: FilterColor,
  wavelengthStep = 5,
): void {
  const { width, height } = ctx.canvas
  const viewWidth = getPhysicalViewWidth(mode, { ...params, wavelength: 700 })
  renderer.drawWhiteLight(ctx, isRound(mode) ? 'round' : 'strip', {
    key: `${mode}_${params.apertureSize.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.gratingLines}`,
    filterColor,
    step: wavelengthStep,
    profileAt: (wl) => patternProfile(mode, { ...params, wavelength: wl }, viewWidth, width, height),
  })
}

// ====== Profile drawing for chart ======

export function whiteLightIntensity(
  y: number,
  mode: DiffractionMode,
  params: DiffractionParams,
  filterColor: FilterColor = 'none',
): number {
  const intensityFn = getIntensityFunction(mode)
  let weightedIntensity = 0
  let totalWeight = 0
  for (let wavelength = 400; wavelength <= 700; wavelength += 5) {
    const [red, green, blue] = waveLengthToRGB(wavelength)
    const luminanceWeight = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
    const weight = luminanceWeight * filterTransmission(wavelength, filterColor)
    if (weight === 0) continue
    weightedIntensity += weight * intensityFn(y, { ...params, wavelength })
    totalWeight += weight
  }
  return totalWeight > 0 ? weightedIntensity / totalWeight : 0
}

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
  const viewParams = { ...params, wavelength: isWhiteLight ? 700 : params.wavelength }
  const physicalViewWidth = getPhysicalViewWidth(mode, viewParams)
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

  const samples = mode === 'diffraction-grating' ? Math.min(8192, Math.max(1, plotW) * 32) : Math.min(plotW, 600)
  for (let i = 0; i <= samples; i++) {
    const frac = i / samples
    const yPhys = (frac - 0.5) * physicalViewWidth
    const intensity = isWhiteLight
      ? whiteLightIntensity(yPhys, mode, params, filterColor ?? 'none')
      : intensityFn(yPhys, params)
    const px = padding + frac * plotW
    const py = bottom - intensity * plotH
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // Fill under curve
  ctx.globalAlpha = 0.15
  ctx.fillStyle = colorStr
  ctx.lineTo(width - padding, bottom)
  ctx.lineTo(padding, bottom)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

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
