/**
 * Pixel machinery for the optics patterns drawn on a canvas: reusable ImageData and colour
 * accumulators, a byte-budgeted cache of white-light sums, the eyepiece rim, and a fast x^0.8
 * for gamma-like brightness. Each model creates its own pool and cache.
 */

/** x^0.8 on [0, 1] without Math.pow (a polynomial fit; exact at 0 and 1). */
export function fastPow08(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const x2 = x * x
  return x * (1.0 + 0.21875 * (1 - x) + 0.3125 * x * (1 - x) + 0.0625 * x2 * (1 - x))
}

/** The faint rim and edge glow of a round eyepiece field. */
export function drawEyepieceBorder(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
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

const circleMaskCache = new Map<string, { rowMinX: Int32Array; rowMaxX: Int32Array }>()
const CIRCLE_MASK_CACHE_MAX = 8

/** Per-row pixel span inside a round field of view, so drawing skips the dark corners. */
export function getCircleMask(w: number, h: number, cx: number, cy: number, radius: number) {
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

export type PatternBuffers ={ imgData: ImageData; imgDataU32: Uint32Array; accR: Float32Array; accG: Float32Array; accB: Float32Array }

/** ImageData sized to the canvas plus RGB accumulators for `n` pixels, reused between draws. */
export function createBufferPool(): (ctx: CanvasRenderingContext2D, n: number) => PatternBuffers {
  let imgData: ImageData | null = null
  let imgDataU32: Uint32Array | null = null
  let accR = new Float32Array(0)
  let accG = new Float32Array(0)
  let accB = new Float32Array(0)
  return (ctx, n) => {
    if (n > accR.length) {
      accR = new Float32Array(n)
      accG = new Float32Array(n)
      accB = new Float32Array(n)
      imgData = null
    }
    if (!imgData || imgData.width !== ctx.canvas.width || imgData.height !== ctx.canvas.height) {
      imgData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height)
      imgDataU32 = new Uint32Array(imgData.data.buffer)
    }
    return { imgData, imgDataU32: imgDataU32!, accR, accG, accB }
  }
}

export type CachedPattern = { key: string; accR: Float32Array; accG: Float32Array; accB: Float32Array }

/**
 * Most-recently-used cache of white-light RGB sums (summing 60+ wavelengths per pixel is the
 * slow part), bounded by an entry count (from the device profile) and a byte budget.
 */
export function createPatternCache(budgetBytes = 30 * 1024 * 1024, initialMaxEntries = 3) {
  const entries: CachedPattern[] = []
  let bytes = 0
  let maxEntries = initialMaxEntries
  const sizeOf = (entry: CachedPattern) => entry.accR.byteLength + entry.accG.byteLength + entry.accB.byteLength
  const evictTo = (count: number) => {
    while (entries.length > count) bytes -= sizeOf(entries.pop()!)
  }
  return {
    /** The cached sums for `key` if they cover `n` pixels (moved to the front), else null. */
    get(key: string, n: number): CachedPattern | null {
      const index = entries.findIndex((entry) => entry.key === key)
      if (index === -1) return null
      if (entries[index].accR.length < n) {
        bytes -= sizeOf(entries[index])
        entries.splice(index, 1)
        return null
      }
      if (index > 0) entries.unshift(entries.splice(index, 1)[0])
      return entries[0]
    },
    /** Stores copies of the sums under `key`, evicting the least recently used to fit. */
    store(key: string, accR: Float32Array, accG: Float32Array, accB: Float32Array): void {
      if (maxEntries === 0) return
      const existing = entries.findIndex((entry) => entry.key === key)
      if (existing >= 0) bytes -= sizeOf(entries.splice(existing, 1)[0])
      const entry: CachedPattern = { key, accR: new Float32Array(accR), accG: new Float32Array(accG), accB: new Float32Array(accB) }
      const size = sizeOf(entry)
      if (size > budgetBytes) return
      while (entries.length >= maxEntries || bytes + size > budgetBytes) {
        const evicted = entries.pop()
        if (!evicted) break
        bytes -= sizeOf(evicted)
      }
      entries.unshift(entry)
      bytes += size
    },
    setMax(count: number): void {
      maxEntries = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 3
      evictTo(maxEntries)
    },
    size: () => entries.length,
  }
}
