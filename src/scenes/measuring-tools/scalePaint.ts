import { vernier, type VernierDivisions } from './model'
import type { ScalePaint } from './usePaintedTexture'

const MAIN_PX = 24.5
const MAIN_M0 = -6
const MAIN_M1 = 161

export function paintMainScale(context: CanvasRenderingContext2D, _width: number, height: number) {
  context.fillStyle = '#1d2629'
  context.strokeStyle = '#1d2629'
  for (let mark = 0; mark <= 150; mark += 1) {
    const x = (mark - MAIN_M0) * MAIN_PX
    const length = mark % 10 === 0 ? 5.2 : mark % 5 === 0 ? 3.7 : 2.5
    context.lineWidth = mark % 10 === 0 ? 4 : 3
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
  context.fillText('cm', (152.5 - MAIN_M0) * MAIN_PX, height - 6.6 * MAIN_PX)
}

export function paintVernier(divisions: VernierDivisions): ScalePaint {
  const spec = vernier(divisions)
  const px = 40
  const origin = -3
  const every = divisions === 20 ? 4 : 5
  return (context, _width, height) => {
    context.clearRect(0, 0, context.canvas.width, height)
    context.strokeStyle = '#182124'
    context.fillStyle = '#182124'
    for (let mark = 0; mark <= divisions; mark += 1) {
      const x = (mark * spec.spacing - origin) * px
      const labeled = mark % every === 0
      context.lineWidth = labeled ? 4.5 : 3.4
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, (labeled ? 3.4 : 2.2) * px)
      context.stroke()
      if (labeled) {
        const tenth = (mark / divisions) * 10
        const label = tenth === Math.round(tenth) ? String(tenth) : String(mark)
        context.font = `600 ${Math.round(2.2 * px)}px Arial`
        context.textAlign = 'center'
        context.fillText(label, x, 5.9 * px)
      }
    }
    context.font = `600 ${Math.round(1.8 * px)}px Arial`
    context.textAlign = 'left'
    context.fillText(`${spec.precision.toFixed(2).replace(/0$/, '')} mm`, (spec.span + 3.2 - origin) * px, 4.4 * px)
  }
}

export function paintBrand(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#34464d'
  context.font = '600 58px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('0–150 mm   STAINLESS', width / 2, height / 2)
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
  const ref = 28 * Math.PI / 180
  const phi0 = ref - 55 * Math.PI / 180
  const phi1 = ref + 55 * Math.PI / 180
  const yRef = height * (1 - (ref - phi0) / (phi1 - phi0))
  context.strokeStyle = '#141c1f'
  context.fillStyle = '#141c1f'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo((THIMBLE_PITCH_X - 1.2 - SLEEVE_X0) * SLEEVE_PX, yRef)
  context.lineTo(width, yRef)
  context.stroke()
  for (let mark = 0; mark <= 25; mark += 1) {
    const x = (THIMBLE_PITCH_X + mark - SLEEVE_X0) * SLEEVE_PX
    context.lineWidth = 3.6
    context.beginPath()
    context.moveTo(x, yRef)
    context.lineTo(x, yRef - (mark % 5 === 0 ? 2.5 : 2.0) * SLEEVE_PX)
    context.stroke()
    if (mark < 25) {
      const half = x + 0.5 * SLEEVE_PX
      context.beginPath()
      context.moveTo(half, yRef)
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
      context.lineWidth = 4
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
  height: Math.round(4.62 * (110 * Math.PI / 180) * SLEEVE_PX),
}

export const THIMBLE_TEXTURE = {
  width: Math.round((Math.hypot(3, 1.8) + 13) * (2200 / (2 * Math.PI * 7.1))),
  height: 2200,
}
