/**
 * Double-slit interference simulation model
 * Pure physics — no React dependencies
 */

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

/**
 * Draw the interference pattern onto a canvas context with a circular eyepiece viewport.
 * The canvas is assumed to have width/height set.
 */
export function drawInterferencePattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
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

  // Physical width represented by the viewport diameter (e.g. 1.5 cm)
  const physicalViewWidth = 0.015

  // Clear background (black outside the eyepiece)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Create circular clipping region for the eyepiece viewport
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  // Single ImageData for entire canvas — much faster than 800 putImageData calls
  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4
    for (let i = 0; i < width; i++) {
      const x = (i / width - 0.5) * physicalViewWidth
      const sinTheta = x / L

      // Double-slit interference: cos²(π d sinθ / λ)
      const phaseInterference = (Math.PI * d * sinTheta) / lambda
      const interferenceIntensity = Math.pow(Math.cos(phaseInterference), 2)

      // Single-slit diffraction envelope: sinc²(π a sinθ / λ)
      let diffractionIntensity = 1.0
      if (Math.abs(x) > 1e-12) {
        const phaseDiffraction = (Math.PI * a * sinTheta) / lambda
        const sinc = Math.sin(phaseDiffraction) / phaseDiffraction
        diffractionIntensity = Math.pow(sinc, 2)
      }

      let intensity = interferenceIntensity * diffractionIntensity
      intensity = Math.pow(intensity, 0.8)

      const idx = rowOffset + i * 4
      data[idx] = rgb[0] * intensity
      data[idx + 1] = rgb[1] * intensity
      data[idx + 2] = rgb[2] * intensity
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)

  ctx.restore()

  // Eyepiece ring border
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Subtle inner glow at the edge
  const edgeGradient = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius)
  edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
  ctx.fillStyle = edgeGradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
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
