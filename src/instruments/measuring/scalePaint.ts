import { MAIN_SCALE_END_MM, vernier, type VernierDivisions } from './model'
import type { ScalePaint } from './usePaintedTexture'

const MAIN_PX = 24.5
const MAIN_M0 = -6
const MAIN_M1 = MAIN_SCALE_END_MM + 11

export function paintMainScale(context: CanvasRenderingContext2D, _width: number, height: number) {
  context.fillStyle = '#172125'
  context.strokeStyle = '#172125'
  for (let mark = 0; mark <= MAIN_SCALE_END_MM; mark += 1) {
    const x = (mark - MAIN_M0) * MAIN_PX
    const length = mark % 10 === 0 ? 5.2 : mark % 5 === 0 ? 3.7 : 2.5
    context.lineWidth = mark % 10 === 0 ? 5.2 : 3.8
    context.beginPath()
    context.moveTo(x, height)
    context.lineTo(x, height - length * MAIN_PX)
    context.stroke()
    if (mark % 10 === 0) {
      context.font = `600 ${Math.round(3.3 * MAIN_PX)}px Arial`
      context.textAlign = 'center'
      context.fillText(String(mark / 10), x, height - 6.4 * MAIN_PX)
    }
  }
  context.font = `600 ${Math.round(2.4 * MAIN_PX)}px Arial`
  context.textAlign = 'left'
  context.fillText('cm', (MAIN_SCALE_END_MM + 2.5 - MAIN_M0) * MAIN_PX, height - 6.6 * MAIN_PX)
}

export type VernierTickKind = 'major' | 'mid' | 'minor'

/** Tick hierarchy used by exam figures: 10 → 0/5/10, 20 → 0/10/20 (5,15 mid), 50 → every 5th. */
export function vernierTickKind(divisions: VernierDivisions, mark: number): VernierTickKind {
  if (divisions === 20) return mark % 10 === 0 ? 'major' : mark % 5 === 0 ? 'mid' : 'minor'
  return mark % 5 === 0 ? 'major' : 'minor'
}

/** Printed vernier numbers: "0 5 10", "0 10 20" and "0 1 2 … 9 0" for 10/20/50 divisions. */
export function vernierLabel(divisions: VernierDivisions, mark: number): string | null {
  if (vernierTickKind(divisions, mark) !== 'major') return null
  if (divisions === 50) return String((mark / 5) % 10)
  return String(mark)
}

export function paintVernier(divisions: VernierDivisions): ScalePaint {
  const spec = vernier(divisions)
  const px = 40
  const origin = -3
  return (context, _width, height) => {
    context.clearRect(0, 0, context.canvas.width, height)
    context.strokeStyle = '#152025'
    context.fillStyle = '#152025'
    for (let mark = 0; mark <= divisions; mark += 1) {
      const x = (mark * spec.spacing - origin) * px
      const kind = vernierTickKind(divisions, mark)
      context.lineWidth = kind === 'minor' ? 4 : 5
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, (kind === 'major' ? 3.4 : kind === 'mid' ? 2.8 : 2.2) * px)
      context.stroke()
      const label = vernierLabel(divisions, mark)
      if (label !== null) {
        context.font = `600 ${Math.round((divisions === 50 ? 1.9 : 2.2) * px)}px Arial`
        context.textAlign = 'center'
        context.fillText(label, x, 5.9 * px)
      }
    }
    context.font = `600 ${Math.round(1.8 * px)}px Arial`
    context.textAlign = 'left'
    context.fillText(`${spec.precision.toFixed(2).replace(/0$/, '')} mm`, (spec.span + 3.2 - origin) * px, 4.4 * px)
  }
}

export const MAIN_SCALE_SIZE = {
  width: Math.round((MAIN_M1 - MAIN_M0) * MAIN_PX),
  height: Math.round(10.4 * MAIN_PX),
  plane: [MAIN_M1 - MAIN_M0, 10.4] as [number, number],
  position: [(MAIN_M0 + MAIN_M1) / 2 - 96.5, 2.2, 1.76] as [number, number, number],
}

export const VERNIER_SCALE_SIZE = {
  width: 59 * 40,
  height: 10 * 40,
  plane: [59, 10] as [number, number],
  position: [26.5, 0, 3.01] as [number, number, number],
}

const SLEEVE_PX = 54
const SLEEVE_X0 = 38
const THIMBLE_PITCH_X = 44

export function paintSleeveScale(context: CanvasRenderingContext2D, width: number, height: number) {
  const ref = (28 * Math.PI) / 180
  const phi0 = ref - (55 * Math.PI) / 180
  const phi1 = ref + (55 * Math.PI) / 180
  const yRef = height * (1 - (ref - phi0) / (phi1 - phi0))
  const backing = context.createLinearGradient(0, 0, 0, height)
  backing.addColorStop(0, '#c8d1d4')
  backing.addColorStop(0.5, '#eef2f3')
  backing.addColorStop(1, '#bec9cd')
  context.fillStyle = backing
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#9aa7ac'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, 3)
  context.lineTo(width, 3)
  context.moveTo(0, height - 3)
  context.lineTo(width, height - 3)
  context.stroke()
  context.strokeStyle = '#141c1f'
  context.fillStyle = '#141c1f'
  context.lineWidth = 7
  context.beginPath()
  context.moveTo((THIMBLE_PITCH_X - 1.2 - SLEEVE_X0) * SLEEVE_PX, yRef)
  context.lineTo(width, yRef)
  context.stroke()
  for (let mark = 0; mark <= 25; mark += 1) {
    const x = (THIMBLE_PITCH_X + mark - SLEEVE_X0) * SLEEVE_PX
    context.lineWidth = mark % 5 === 0 ? 5 : 4
    context.beginPath()
    context.moveTo(x, yRef)
    context.lineTo(x, yRef - (mark % 5 === 0 ? 2.7 : 2.0) * SLEEVE_PX)
    context.stroke()
    if (mark < 25) {
      const half = x + 0.5 * SLEEVE_PX
      context.beginPath()
      context.moveTo(half, yRef)
      context.lineWidth = 4.2
      context.lineTo(half, yRef + 1.55 * SLEEVE_PX)
      context.stroke()
    }
    if (mark % 5 === 0) {
      context.font = `600 ${Math.round(1.9 * SLEEVE_PX)}px Arial`
      context.textAlign = 'center'
      context.fillText(String(mark), x, yRef - 3.1 * SLEEVE_PX)
    }
  }
}

export function paintThimbleScale(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#c9d1d4')
  gradient.addColorStop(1, '#dde3e5')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#11191c'
  context.fillStyle = '#11191c'
  const profile = Math.hypot(3, 1.8) + 13
  const pixelsPerMm = 2200 / (2 * Math.PI * 7.1)
  const bevelU = Math.hypot(3, 1.8) / profile
  for (let mark = 0; mark < 50; mark += 1) {
    const y = height * (1 - mark / 50)
    const rows = mark === 0 ? [0, height] : [y]
    for (const row of rows) {
      context.lineWidth = mark % 5 === 0 ? 5 : 3.8
      context.beginPath()
      context.moveTo(0, row)
      context.lineTo(width * (bevelU + (mark % 5 === 0 ? 0.1 : 0.055)), row)
      context.stroke()
      if (mark % 5 === 0) {
        context.font = `600 ${Math.round(1.55 * pixelsPerMm)}px Arial`
        context.textAlign = 'left'
        context.textBaseline = 'middle'
        context.fillText(String(mark), width * (bevelU + 0.125), row)
      }
    }
  }
}

export const SLEEVE_TEXTURE = {
  width: Math.round((77 - 38) * SLEEVE_PX),
  height: Math.round(4.62 * ((110 * Math.PI) / 180) * SLEEVE_PX),
}

export const THIMBLE_TEXTURE = {
  width: Math.round((Math.hypot(3, 1.8) + 13) * (2200 / (2 * Math.PI * 7.1))),
  height: 2200,
}
