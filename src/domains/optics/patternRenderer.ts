import { filterTransmission, type FilterColor } from './filters'
import { createBufferPool, createPatternCache, drawEyepieceBorder, fastPow08, getCircleMask } from './patternCanvas'
import { waveLengthToRGB } from './spectrum'

/**
 * Renders the optics patterns (double slit, single slit, apertures, gratings) into a canvas.
 * A model supplies the physics as a 1D profile per wavelength; this module owns the field of
 * view, the pixel loops, white-light summation and caching, and the brightness mapping.
 */

/** 'round': the eyepiece field; 'strip': a horizontal band (slits and gratings on a screen). */
export type FieldShape = 'round' | 'strip'

/** A linear lookup table over a physical coordinate: index = coord · scale + half. */
export type Lut = { values: Float32Array; scale: number; half: number }

export type Profile =
  /** Brightness per pixel column (already gamma-shaped), the same down every row. */
  | { kind: 'columns'; values: Float32Array }
  /** Brightness per whole-pixel distance from the centre (already gamma-shaped). */
  | { kind: 'radial'; values: Float32Array }
  /**
   * Two intensity profiles across the field, each turned by its own angle (degrees), multiplied
   * and gamma-shaped per pixel: fringes from two slits whose orientations can differ.
   */
  | { kind: 'crossed'; a: Lut; angleA: number; b: Lut; angleB: number; viewWidth: number }

type Field = { width: number; height: number; rowMin: Int32Array; rowMax: Int32Array; rowWeight: Float32Array }

/** Outside the strip the screen is lit only faintly. */
const STRIP_HALF_HEIGHT = 0.35
const STRIP_OUTSIDE = 0.08

function fieldOf(shape: FieldShape, width: number, height: number): Field {
  const rowWeight = new Float32Array(height).fill(1)
  if (shape === 'round') {
    const { rowMinX, rowMaxX } = getCircleMask(width, height, width / 2, height / 2, eyepieceRadius(width, height))
    return { width, height, rowMin: rowMinX, rowMax: rowMaxX, rowWeight }
  }
  const [top, bottom] = stripRows(height)
  for (let y = 0; y < height; y++) if (y < top || y > bottom) rowWeight[y] = STRIP_OUTSIDE
  return { width, height, rowMin: new Int32Array(height), rowMax: new Int32Array(height).fill(width - 1), rowWeight }
}

function eyepieceRadius(width: number, height: number) {
  return Math.min(width, height) / 2 - 2
}

function stripRows(height: number): [number, number] {
  const cy = height / 2
  return [Math.round(cy - height * STRIP_HALF_HEIGHT), Math.round(cy + height * STRIP_HALF_HEIGHT)]
}

function readLut(lut: Lut, coord: number): number {
  const index = coord * lut.scale + lut.half
  const values = lut.values
  if (index < 0 || index >= values.length) return 0
  const i = index | 0
  const v0 = values[i]
  return i + 1 < values.length ? v0 + (index - i) * (values[i + 1] - v0) : v0
}

let columnX = new Float32Array(0)
/** Screen x of each pixel column for a field `viewWidth` wide (reused between draws). */
function columnCoordinates(width: number, viewWidth: number): Float32Array {
  if (columnX.length !== width) columnX = new Float32Array(width)
  for (let px = 0; px < width; px++) columnX[px] = (px / width - 0.5) * viewWidth
  return columnX
}

type Sums = { accR: Float32Array; accG: Float32Array; accB: Float32Array }

/**
 * Adds r/g/b × brightness of `profile` over the field into the sums. One loop per profile kind
 * keeps each hot loop monomorphic. Radial and crossed profiles are only drawn in the round
 * field, whose rows all have weight 1.
 */
function accumulate(sums: Sums, field: Field, profile: Profile, r: number, g: number, b: number) {
  if (profile.kind === 'columns') accumulateColumns(sums, field, profile.values, r, g, b)
  else if (profile.kind === 'radial') accumulateRadial(sums, field, profile.values, r, g, b)
  else accumulateCrossed(sums, field, profile, r, g, b)
}

function accumulateColumns(
  { accR, accG, accB }: Sums,
  { width, height, rowMin, rowMax, rowWeight }: Field,
  values: Float32Array,
  r: number,
  g: number,
  b: number,
) {
  for (let py = 0; py < height; py++) {
    const weight = rowWeight[py]
    const rowBase = py * width
    for (let px = rowMin[py]; px <= rowMax[py]; px++) {
      const v = values[px] * weight
      const i = rowBase + px
      accR[i] += r * v
      accG[i] += g * v
      accB[i] += b * v
    }
  }
}

function accumulateRadial(
  { accR, accG, accB }: Sums,
  { width, height, rowMin, rowMax }: Field,
  values: Float32Array,
  r: number,
  g: number,
  b: number,
) {
  const cx = width / 2
  const cy = height / 2
  const last = values.length - 1
  for (let py = 0; py < height; py++) {
    const dy = py - cy
    const rowBase = py * width
    for (let px = rowMin[py]; px <= rowMax[py]; px++) {
      const dx = px - cx
      const v = values[Math.min(Math.round(Math.sqrt(dx * dx + dy * dy)), last)]
      const i = rowBase + px
      accR[i] += r * v
      accG[i] += g * v
      accB[i] += b * v
    }
  }
}

function accumulateCrossed(
  { accR, accG, accB }: Sums,
  { width, height, rowMin, rowMax }: Field,
  profile: Extract<Profile, { kind: 'crossed' }>,
  r: number,
  g: number,
  b: number,
) {
  const { a, b: lutB, viewWidth } = profile
  const cosA = Math.cos((profile.angleA * Math.PI) / 180)
  const sinA = Math.sin((profile.angleA * Math.PI) / 180)
  const cosB = Math.cos((profile.angleB * Math.PI) / 180)
  const sinB = Math.sin((profile.angleB * Math.PI) / 180)
  const columnX = columnCoordinates(width, viewWidth)
  for (let py = 0; py < height; py++) {
    const dy = (py / height - 0.5) * viewWidth
    const yA = dy * sinA
    const yB = dy * sinB
    const rowBase = py * width
    for (let px = rowMin[py]; px <= rowMax[py]; px++) {
      const dx = columnX[px]
      const v = fastPow08(readLut(a, dx * cosA + yA) * readLut(lutB, dx * cosB + yB))
      const i = rowBase + px
      accR[i] += r * v
      accG[i] += g * v
      accB[i] += b * v
    }
  }
}

/**
 * White-light sums to pixels: each pixel keeps its hue (channels over their maximum), and its
 * brightness follows the brightest pixel with a 0.3 gamma so dim fringes stay visible.
 */
function normalize(data: Uint8ClampedArray, acc: Sums, field: Field) {
  const { accR, accG, accB } = acc
  const { width, height, rowMin, rowMax } = field
  let maxVal = 0
  for (let y = 0; y < height; y++) {
    for (let i = y * width + rowMin[y], end = y * width + rowMax[y]; i <= end; i++) {
      const v = Math.max(accR[i], accG[i], accB[i])
      if (v > maxVal) maxVal = v
    }
  }
  const noise = maxVal * 0.0005
  for (let y = 0; y < height; y++) {
    for (let i = y * width + rowMin[y], end = y * width + rowMax[y]; i <= end; i++) {
      const local = Math.max(accR[i], accG[i], accB[i])
      if (local <= noise) continue
      const brightness = Math.max(0.15, Math.pow(local / maxVal, 0.3))
      const p = i * 4
      data[p] = Math.min(255, (accR[i] / local) * 255 * brightness)
      data[p + 1] = Math.min(255, (accG[i] / local) * 255 * brightness)
      data[p + 2] = Math.min(255, (accB[i] / local) * 255 * brightness)
      data[p + 3] = 255
    }
  }
}

/** One renderer per model: its own reusable buffers and white-light cache. */
export function createPatternRenderer() {
  const buffers = createBufferPool()
  const cache = createPatternCache()

  const begin = (ctx: CanvasRenderingContext2D, shape: FieldShape) => {
    const { width, height } = ctx.canvas
    const pool = buffers(ctx, width * height)
    pool.imgDataU32.fill(0)
    return { pool, field: fieldOf(shape, width, height) }
  }
  const finish = (ctx: CanvasRenderingContext2D, shape: FieldShape, imgData: ImageData) => {
    ctx.putImageData(imgData, 0, 0)
    const { width, height } = ctx.canvas
    if (shape === 'round') {
      drawEyepieceBorder(ctx, width / 2, height / 2, eyepieceRadius(width, height))
      return
    }
    const [top, bottom] = stripRows(height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, top, width, bottom - top)
  }

  return {
    setCacheMax: (entries: number) => cache.setMax(entries),

    /** One wavelength in its own colour, brightness straight from the profile. */
    drawMonochrome(ctx: CanvasRenderingContext2D, shape: FieldShape, wavelengthNm: number, profile: Profile) {
      const { pool, field } = begin(ctx, shape)
      pool.accR.fill(0)
      pool.accG.fill(0)
      pool.accB.fill(0)
      const [r, g, b] = waveLengthToRGB(wavelengthNm)
      accumulate(pool, field, profile, r, g, b)
      const data = pool.imgData.data
      for (let y = 0; y < field.height; y++) {
        for (let i = y * field.width + field.rowMin[y], end = y * field.width + field.rowMax[y]; i <= end; i++) {
          const p = i * 4
          data[p] = pool.accR[i]
          data[p + 1] = pool.accG[i]
          data[p + 2] = pool.accB[i]
          data[p + 3] = 255
        }
      }
      finish(ctx, shape, pool.imgData)
    },

    /**
     * 400–700 nm in `step` nm steps through the filter, each wavelength's profile from
     * `profileAt`, summed and normalized. Sums are cached under `key` (which must name every
     * input the profiles depend on).
     */
    drawWhiteLight(
      ctx: CanvasRenderingContext2D,
      shape: FieldShape,
      options: { key: string; filterColor: FilterColor; step: number; profileAt: (wavelengthNm: number) => Profile },
    ) {
      const { pool, field } = begin(ctx, shape)
      const { width, height } = ctx.canvas
      const key = `${shape}_${width}_${height}_${options.filterColor}_${options.step}_${options.key}`
      const sums =
        cache.get(key, width * height) ??
        (() => {
          pool.accR.fill(0)
          pool.accG.fill(0)
          pool.accB.fill(0)
          for (let wl = 400; wl <= 700; wl += options.step) {
            const weight = filterTransmission(wl, options.filterColor)
            const [r, g, b] = waveLengthToRGB(wl)
            if (weight === 0 || r + g + b === 0) continue
            accumulate(pool, field, options.profileAt(wl), r * weight, g * weight, b * weight)
          }
          cache.store(key, pool.accR, pool.accG, pool.accB)
          return pool
        })()
      normalize(pool.imgData.data, sums, field)
      finish(ctx, shape, pool.imgData)
    },
  }
}
