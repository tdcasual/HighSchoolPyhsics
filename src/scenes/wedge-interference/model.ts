import { waveLengthToRGB, fastPow08, waveLengthToHex } from '../double-slit/model'

export type WedgeMode = 'flat' | 'bump'

export type WedgeParams = {
  wavelength: number
  wedgeAngle: number
  maxThickness: number
  mode: WedgeMode
  bumpHeight: number
  bumpPosition: number
}

export const DEFAULT_PARAMS: WedgeParams = {
  wavelength: 550,
  wedgeAngle: 0.05,
  maxThickness: 20,
  mode: 'flat',
  bumpHeight: 0.5,
  bumpPosition: 0.5,
}

export { waveLengthToHex }

export const PHYSICAL_VIEW_WIDTH = 0.005

export function computeFringeSpacing(lambdaNm: number, thetaDeg: number): number {
  const lambdaM = lambdaNm * 1e-9
  const sinTheta = Math.sin(thetaDeg * Math.PI / 180)
  return (lambdaM / (2 * sinTheta)) * 1e6
}

export function computeWedgeIntensity(lambdaNm: number, thicknessUm: number): number {
  const lambdaUm = lambdaNm * 1e-3
  const phase = 2 * Math.PI * thicknessUm / lambdaUm
  return Math.sin(phase) ** 2
}

export function computeFringeCount(params: WedgeParams): number {
  const maxD = PHYSICAL_VIEW_WIDTH * Math.tan(params.wedgeAngle * Math.PI / 180) * 1e6
  const lambdaUm = params.wavelength * 1e-3
  return Math.floor(2 * maxD / lambdaUm)
}

function computeThickness(xM: number, yM: number, params: WedgeParams): number {
  const theta = params.wedgeAngle * Math.PI / 180
  let d = xM * Math.tan(theta) * 1e6

  if (params.mode === 'bump' && params.bumpHeight > 0) {
    const viewHeight = PHYSICAL_VIEW_WIDTH / 2
    const bumpX = params.bumpPosition * PHYSICAL_VIEW_WIDTH
    const bumpY = viewHeight / 2
    const sigma = PHYSICAL_VIEW_WIDTH * 0.06
    const dist2 = (xM - bumpX) ** 2 + (yM - bumpY) ** 2
    // Bump on bottom plate bulges UP → air gap shrinks
    d -= params.bumpHeight * Math.exp(-dist2 / (2 * sigma * sigma))
    d = Math.max(0, d)
  }

  return d
}

export function formatFringeSpacing(params: WedgeParams): string {
  const spacing = computeFringeSpacing(params.wavelength, params.wedgeAngle)
  if (spacing < 1) return spacing.toFixed(3) + ' μm'
  if (spacing < 100) return spacing.toFixed(1) + ' μm'
  return (spacing / 1000).toFixed(3) + ' mm'
}

// Reusable buffers for wedge pattern rendering
let _wedgeImgData: ImageData | null = null
let _wedgeImgDataU32: Uint32Array | null = null

function ensureWedgeBuffers(ctx: CanvasRenderingContext2D): { imgData: ImageData; imgDataU32: Uint32Array } {
  if (!_wedgeImgData || _wedgeImgData.width !== ctx.canvas.width || _wedgeImgData.height !== ctx.canvas.height) {
    _wedgeImgData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height)
    _wedgeImgDataU32 = new Uint32Array(_wedgeImgData.data.buffer)
  }
  return { imgData: _wedgeImgData!, imgDataU32: _wedgeImgDataU32! }
}

function packRGBA(r: number, g: number, b: number, a: number): number {
  return (a << 24) | (b << 16) | (g << 8) | r
}

export function drawWedgePattern(
  ctx: CanvasRenderingContext2D,
  params: WedgeParams,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  const lambda = params.wavelength
  const rgb = waveLengthToRGB(params.wavelength)

  const { imgData, imgDataU32 } = ensureWedgeBuffers(ctx)
  const viewWidth = PHYSICAL_VIEW_WIDTH
  const viewHeight = viewWidth / 2

  if (params.mode === 'flat') {
    const theta = params.wedgeAngle * Math.PI / 180
    const tanTheta = Math.tan(theta)
    const invLambda = 2 * Math.PI / (lambda * 1e-3)

    // Pre-compute per-column intensity
    const colInt = new Float32Array(width)
    for (let px = 0; px < width; px++) {
      const xM = (px / width) * viewWidth
      const thickness = xM * tanTheta * 1e6
      const phase = invLambda * thickness
      colInt[px] = Math.sin(phase) ** 2
    }

    for (let py = 0; py < height; py++) {
      const rowOffset = py * width
      for (let px = 0; px < width; px++) {
        const intensity = fastPow08(colInt[px])
        imgDataU32[rowOffset + px] = packRGBA(
          (rgb[0] * intensity) | 0,
          (rgb[1] * intensity) | 0,
          (rgb[2] * intensity) | 0,
          255,
        )
      }
    }
  } else {
    for (let py = 0; py < height; py++) {
      const yM = (py / height) * viewHeight
      const rowOffset = py * width
      for (let px = 0; px < width; px++) {
        const xM = (px / width) * viewWidth
        const thickness = computeThickness(xM, yM, params)
        const intensity = fastPow08(computeWedgeIntensity(lambda, thickness))
        imgDataU32[rowOffset + px] = packRGBA(
          (rgb[0] * intensity) | 0,
          (rgb[1] * intensity) | 0,
          (rgb[2] * intensity) | 0,
          255,
        )
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
}
