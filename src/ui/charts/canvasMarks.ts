/** Overlays drawn on optics canvases (field of view, eyepiece reticle), in CSS pixels. */

/** A bar `length` px long centred on (x, y) — or starting at x when `from` is 'start' — with end ticks and a label below. */
export function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  { x, y, length, label, from = 'center', alpha = 0.55 }: { x: number; y: number; length: number; label: string; from?: 'center' | 'start'; alpha?: number },
) {
  const start = from === 'center' ? x - length / 2 : x
  ctx.save()
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(start, y)
  ctx.lineTo(start + length, y)
  ctx.moveTo(start, y - 3)
  ctx.lineTo(start, y + 3)
  ctx.moveTo(start + length, y - 3)
  ctx.lineTo(start + length, y + 3)
  ctx.stroke()
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.1)})`
  ctx.font = '11px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(label, start + length / 2, y + 12)
  ctx.restore()
}

/**
 * The eyepiece field: a faint outline when the lamp is off, then a crosshair of half-length
 * 0.48·radius rotated by `angleDeg` about (cx + offsetX, cy), clipped to the circle, with a
 * centre dot.
 */
export function drawReticle(
  ctx: CanvasRenderingContext2D,
  { cx, cy, radius, angleDeg = 0, offsetX = 0, lit }: { cx: number; cy: number; radius: number; angleDeg?: number; offsetX?: number; lit: boolean },
) {
  if (!lit) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()
  ctx.translate(cx + offsetX, cy)
  ctx.rotate((angleDeg * Math.PI) / 180)
  ctx.strokeStyle = lit ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.75)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-radius * 0.48, 0)
  ctx.lineTo(radius * 0.48, 0)
  ctx.moveTo(0, -radius * 0.48)
  ctx.lineTo(0, radius * 0.48)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.beginPath()
  ctx.arc(0, 0, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Fills the canvas (device pixels) with the dark of an unlit screen. */
export function drawDark(ctx: CanvasRenderingContext2D, color = '#050505') {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}
