/**
 * Double-slit interference simulation model
 * Pure physics — no React dependencies
 */

export type FilterColor = 'none' | 'red' | 'green' | 'blue'

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
  slitWidth: 0.05,
}

/**
 * Convert wavelength (nm) to RGB color array [r, g, b] (0-255)
 */
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

  // Light intensity attenuation at edges
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

/**
 * Convert wavelength (nm) to hex color string
 */
export function waveLengthToHex(wl: number): number {
  const [r, g, b] = waveLengthToRGB(wl)
  return (r << 16) | (g << 8) | b
}

/**
 * Compute fringe spacing Δx = Lλ / d
 * Returns value in meters
 */
export function computeFringeSpacing(params: DoubleSlitParams): number {
  const lambda = params.wavelength * 1e-9 // m
  const d = params.slitDistance * 1e-3 // m
  const L = params.screenDistance // m
  return (L * lambda) / d
}

/**
 * Format fringe spacing for display (in mm)
 */
export function formatFringeSpacing(params: DoubleSlitParams): string {
  const spacingM = computeFringeSpacing(params)
  const spacingMm = spacingM * 1000
  return spacingMm < 0.01 ? spacingMm.toExponential(2) + ' mm' : spacingMm.toFixed(3) + ' mm'
}

/** Compute double-slit interference intensity: cos²(π d sinθ / λ) */
function computeInterference(x: number, lambda: number, d: number, L: number): number {
  const sinTheta = x / L
  const phase = (Math.PI * d * sinTheta) / lambda
  return Math.cos(phase) ** 2
}

/** Compute single-slit diffraction envelope intensity: sinc²(π a sinθ / λ) */
function computeDiffraction(x: number, lambda: number, a: number, L: number): number {
  if (Math.abs(x) < 1e-12) return 1.0
  const sinTheta = x / L
  const phase = (Math.PI * a * sinTheta) / lambda
  const sinc = Math.sin(phase) / phase
  return sinc ** 2
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

/**
 * Draw the interference pattern onto a canvas context with a circular eyepiece viewport.
 * Interference fringes are rotated by doubleSlitAngle.
 * Diffraction envelope is rotated by singleSlitAngle.
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

  const lambda = params.wavelength * 1e-9
  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const a = params.slitWidth * 1e-3
  const rgb = waveLengthToRGB(params.wavelength)
  const physicalViewWidth = 0.015

  const fringeAngleRad = doubleSlitAngle * Math.PI / 180
  const envAngleRad = singleSlitAngle * Math.PI / 180
  const cosF = Math.cos(fringeAngleRad)
  const sinF = Math.sin(fringeAngleRad)
  const cosE = Math.cos(envAngleRad)
  const sinE = Math.sin(envAngleRad)

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  for (let py = 0; py < height; py++) {
    const rowOffset = py * width * 4
    for (let px = 0; px < width; px++) {
      // Position relative to center in physical units
      const dx = (px / width - 0.5) * physicalViewWidth
      const dy = (py / height - 0.5) * physicalViewWidth

      // Position along the direction perpendicular to the double slit (fringes vary here)
      const xFringe = -dx * sinF + dy * cosF
      // Position along the direction perpendicular to the single slit width (envelope varies here)
      const xEnv = -dx * sinE + dy * cosE

      const interference = computeInterference(xFringe, lambda, d, L)
      const diffraction = computeDiffraction(xEnv, lambda, a, L)
      const intensity = Math.pow(interference * diffraction, 0.8)

      const idx = rowOffset + px * 4
      data[idx] = rgb[0] * intensity
      data[idx + 1] = rgb[1] * intensity
      data[idx + 2] = rgb[2] * intensity
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  ctx.restore()

  drawEyepieceBorder(ctx, cx, cy, radius)
}

/**
 * Draw white-light interference pattern with optional filter.
 * Composites visible spectrum (400-700nm) at 5nm steps.
 * Interference fringes rotated by doubleSlitAngle, envelope by singleSlitAngle.
 */
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  filterColor: FilterColor,
  doubleSlitAngle = 0,
  singleSlitAngle = 0,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 2

  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const a = params.slitWidth * 1e-3
  const physicalViewWidth = 0.015

  const filterProfile = filterColor !== 'none' ? FILTER_PROFILES[filterColor] : null

  const fringeAngleRad = doubleSlitAngle * Math.PI / 180
  const envAngleRad = singleSlitAngle * Math.PI / 180
  const cosF = Math.cos(fringeAngleRad)
  const sinF = Math.sin(fringeAngleRad)
  const cosE = Math.cos(envAngleRad)
  const sinE = Math.sin(envAngleRad)

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  const accR = new Float32Array(width * height)
  const accG = new Float32Array(width * height)
  const accB = new Float32Array(width * height)

  for (let wl = 400; wl <= 700; wl += 5) {
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

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const dx = (px / width - 0.5) * physicalViewWidth
        const dy = (py / height - 0.5) * physicalViewWidth

        const xFringe = -dx * sinF + dy * cosF
        const xEnv = -dx * sinE + dy * cosE

        const interference = computeInterference(xFringe, lambda, d, L)
        const diffraction = computeDiffraction(xEnv, lambda, a, L)
        const intensity = Math.pow(interference * diffraction, 0.8) * filterWeight

        const idx = py * width + px
        accR[idx] += rgb[0] * intensity
        accG[idx] += rgb[1] * intensity
        accB[idx] += rgb[2] * intensity
      }
    }
  }

  let maxVal = 0
  for (let i = 0; i < accR.length; i++) {
    const v = Math.max(accR[i], accG[i], accB[i])
    if (v > maxVal) maxVal = v
  }
  const scale = maxVal > 0 ? 255 / maxVal : 1

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4
    for (let i = 0; i < width; i++) {
      const idx = y * width + i
      const pi = rowOffset + i * 4
      data[pi] = Math.min(255, accR[idx] * scale)
      data[pi + 1] = Math.min(255, accG[idx] * scale)
      data[pi + 2] = Math.min(255, accB[idx] * scale)
      data[pi + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  ctx.restore()

  drawEyepieceBorder(ctx, cx, cy, radius)
}

export function formatWavelengthLabel(wavelength: number): string {
  return `${Math.round(wavelength)} nm`
}

export function formatSlitDistanceLabel(slitDistance: number): string {
  return `${slitDistance.toFixed(2)} mm`
}

export function formatScreenDistanceLabel(screenDistance: number): string {
  return `${screenDistance.toFixed(2)} m`
}
