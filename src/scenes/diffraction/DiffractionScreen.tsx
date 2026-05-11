import { useEffect } from 'react'
import * as THREE from 'three'
import {
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
  getIntensityFunction,
  getPhysicalViewWidth,
  waveLengthToRGB,
  FILTER_PROFILES,
} from '../light-diffraction/model'

const CANVAS_SIZE = 512
const DPR = 1
const WHITE_LIGHT_STEP = 10
// Zoom factor for white light: makes dispersion occupy more of the canvas
const WHITE_LIGHT_ZOOM = 0.25

export type DiffractionScreenProps = {
  mode: DiffractionMode
  params: DiffractionParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  screenWidthM: number
  screenHeightM: number
}

function gamma(int: number): number {
  // stronger gamma for visible secondary maxima and Poisson spot
  return Math.pow(Math.max(0, int), 0.35)
}

// ====== Module-level canvas and texture (avoids hook mutability rules) ======
const _screenCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
if (_screenCanvas) {
  _screenCanvas.width = CANVAS_SIZE * DPR
  _screenCanvas.height = CANVAS_SIZE * DPR
}
const _screenTexture = _screenCanvas
  ? (() => {
      const t = new THREE.CanvasTexture(_screenCanvas)
      t.colorSpace = THREE.SRGBColorSpace
      t.minFilter = THREE.LinearFilter
      t.magFilter = THREE.LinearFilter
      return t
    })()
  : null

// ====== Reusable accumulation buffers ======
let _accR: Float32Array | null = null
let _accG: Float32Array | null = null
let _accB: Float32Array | null = null
let _colInt: Float32Array | null = null
let _radialLut: Float32Array | null = null
let _bufWidth = 0
let _bufHeight = 0

function ensureBuffers(width: number, height: number) {
  if (width > _bufWidth || height > _bufHeight || !_accR) {
    const n = width * height
    _accR = new Float32Array(n)
    _accG = new Float32Array(n)
    _accB = new Float32Array(n)
    _colInt = new Float32Array(width)
    _radialLut = new Float32Array(Math.ceil(Math.min(width, height) / 2) + 1)
    _bufWidth = width
    _bufHeight = height
  }
  return {
    accR: _accR!,
    accG: _accG!,
    accB: _accB!,
    colInt: _colInt!,
    radialLut: _radialLut!,
  }
}

// ====== Simple pattern cache ======
type CacheEntry = { key: string; imgData: ImageData }
let _cache: CacheEntry | null = null

function buildCacheKey(
  mode: DiffractionMode,
  params: DiffractionParams,
  isWhiteLight: boolean,
  filterColor: FilterColor,
  width: number,
  height: number,
): string {
  if (!isWhiteLight) {
    return `m_${mode}_${width}_${height}_${params.wavelength}_${params.apertureSize.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.gratingLines}`
  }
  return `wl_${mode}_${width}_${height}_${params.apertureSize.toFixed(3)}_${params.screenDistance.toFixed(2)}_${params.gratingLines}_${filterColor}`
}

function drawMonoPattern(
  ctx: CanvasRenderingContext2D,
  mode: DiffractionMode,
  params: DiffractionParams,
  width: number,
  height: number,
) {
  const intensityFn = getIntensityFunction(mode)
  const viewW = getPhysicalViewWidth(mode)
  const rgb = waveLengthToRGB(params.wavelength)

  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  if (mode === 'single-slit' || mode === 'diffraction-grating') {
    const colInt = new Float32Array(width)
    for (let x = 0; x < width; x++) {
      const yPhys = ((x / (width - 1)) * 2 - 1) * viewW
      colInt[x] = gamma(intensityFn(yPhys, params))
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const int = colInt[x]
        data[i] = Math.min(255, rgb[0] * int)
        data[i + 1] = Math.min(255, rgb[1] * int)
        data[i + 2] = Math.min(255, rgb[2] * int)
        data[i + 3] = 255
      }
    }
  } else {
    const cx = width / 2
    const cy = height / 2
    const scale = viewW / Math.max(width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx
        const dy = y - cy
        const r = Math.sqrt(dx * dx + dy * dy)
        const yPhys = r * scale
        const int = gamma(intensityFn(yPhys, params))
        const i = (y * width + x) * 4
        data[i] = Math.min(255, rgb[0] * int)
        data[i + 1] = Math.min(255, rgb[1] * int)
        data[i + 2] = Math.min(255, rgb[2] * int)
        data[i + 3] = 255
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return imgData
}

function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  mode: DiffractionMode,
  params: DiffractionParams,
  filterColor: FilterColor,
  width: number,
  height: number,
) {
  const intensityFn = getIntensityFunction(mode)
  const viewW = getPhysicalViewWidth(mode)
  const effectiveViewW = viewW * WHITE_LIGHT_ZOOM
  const filterProfile = filterColor !== 'none' ? FILTER_PROFILES[filterColor] : null

  const { accR, accG, accB, colInt, radialLut } = ensureBuffers(width, height)
  const n = width * height
  accR.fill(0)
  accG.fill(0)
  accB.fill(0)

  const is2D = mode === 'circular-aperture' || mode === 'circular-obstacle'
  const cx = width / 2
  const cy = height / 2
  const scale = effectiveViewW / Math.max(width, height)

  for (let wl = 400; wl <= 700; wl += WHITE_LIGHT_STEP) {
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
      const maxR = Math.ceil(Math.min(width, height) / 2)
      for (let rPx = 0; rPx <= maxR; rPx++) {
        radialLut[rPx] = intensityFn(rPx * scale, { ...params, wavelength: wl })
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - cx
          const dy = y - cy
          const rPx = Math.round(Math.sqrt(dx * dx + dy * dy))
          const intensity = radialLut[Math.min(rPx, maxR)]
          const idx = y * width + x
          accR[idx] += pR * intensity
          accG[idx] += pG * intensity
          accB[idx] += pB * intensity
        }
      }
    } else {
      for (let x = 0; x < width; x++) {
        const yPhys = ((x / (width - 1)) * 2 - 1) * effectiveViewW
        colInt[x] = intensityFn(yPhys, { ...params, wavelength: wl })
      }
      const stripHalf = height * 0.35
      const stripTop = Math.round(cy - stripHalf)
      const stripBottom = Math.round(cy + stripHalf)
      for (let y = 0; y < height; y++) {
        const inStrip = y >= stripTop && y <= stripBottom
        const dim = inStrip ? 1.0 : 0.08
        const rowBase = y * width
        for (let x = 0; x < width; x++) {
          const intensity = colInt[x] * dim
          const idx = rowBase + x
          accR[idx] += pR * intensity
          accG[idx] += pG * intensity
          accB[idx] += pB * intensity
        }
      }
    }
  }

  // Find global max for brightness reference
  let maxVal = 0
  for (let i = 0; i < n; i++) {
    maxVal = Math.max(maxVal, accR[i], accG[i], accB[i])
  }

  const imgData = ctx.createImageData(width, height)
  const data = imgData.data
  const noiseThreshold = maxVal * 0.0005

  for (let i = 0; i < n; i++) {
    const rAcc = accR[i]
    const gAcc = accG[i]
    const bAcc = accB[i]
    const localMax = Math.max(rAcc, gAcc, bAcc)

    if (localMax > noiseThreshold) {
      // Local hue normalization: preserves color regardless of absolute brightness
      const nr = (rAcc / localMax) * 255
      const ng = (gAcc / localMax) * 255
      const nb = (bAcc / localMax) * 255
      // Global brightness with gamma so dim fringes remain visible
      const brightness = Math.max(0.15, Math.pow(localMax / maxVal, 0.3))

      data[i * 4] = Math.min(255, nr * brightness)
      data[i * 4 + 1] = Math.min(255, ng * brightness)
      data[i * 4 + 2] = Math.min(255, nb * brightness)
    } else {
      data[i * 4] = 0
      data[i * 4 + 1] = 0
      data[i * 4 + 2] = 0
    }
    data[i * 4 + 3] = 255
  }
  ctx.putImageData(imgData, 0, 0)
  return imgData
}

export function DiffractionScreen({
  mode,
  params,
  isLightOn,
  isWhiteLight,
  filterColor,
  screenWidthM,
  screenHeightM,
}: DiffractionScreenProps) {
  // Draw only when parameters change — removes per-frame redraw cost
  useEffect(() => {
    if (!_screenCanvas || !_screenTexture) return
    const ctx = _screenCanvas.getContext('2d')
    if (!ctx) return

    const w = _screenCanvas.width
    const h = _screenCanvas.height
    const cacheKey = buildCacheKey(mode, params, isWhiteLight, filterColor, w, h)

    // Check cache
    if (_cache && _cache.key === cacheKey) {
      ctx.putImageData(_cache.imgData, 0, 0)
      _screenTexture.needsUpdate = true
      return
    }

    let imgData: ImageData | undefined
    if (!isLightOn) {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, w, h)
    } else if (isWhiteLight) {
      imgData = drawWhiteLightPattern(ctx, mode, params, filterColor, w, h)
    } else {
      imgData = drawMonoPattern(ctx, mode, params, w, h)
    }

    if (imgData) {
      _cache = { key: cacheKey, imgData }
    }
    _screenTexture.needsUpdate = true
  }, [mode, params, isLightOn, isWhiteLight, filterColor])

  if (!_screenTexture) return null

  return (
    <mesh position={[0, 0, params.screenDistance]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[screenWidthM, screenHeightM]} />
      <meshBasicMaterial map={_screenTexture} toneMapped={false} />
    </mesh>
  )
}
