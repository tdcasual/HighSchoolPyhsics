/**
 * Reading figures drawn the way 高考 papers print them: black line art on white,
 * no perspective, the vernier sliding directly under the main-scale tick edge and
 * the thimble edge sitting on the sleeve datum line. Colour only appears after a
 * reading has been revealed.
 */
import { useId } from 'react'
import { usePredictionMasked } from '../../ui/notes/predictionContext'
import { MAIN_SCALE_END_MM, caliperReading, micrometerReading, vernier, type VernierDivisions } from './model'
import { vernierLabel, vernierTickKind } from './scalePaint'

const INK = '#111'
const PAPER = '#fff'
const HIGHLIGHT = '#d4532b'
const FONT = '"Times New Roman", "Songti SC", "SimSun", serif'

const WIDTH = 720
const HEIGHT = 220

/** Visible main-scale window: a few millimetres before the vernier zero and after its last line. */
function caliperWindow(x: number, n: VernierDivisions): { start: number; end: number } {
  const span = vernier(n).span
  const pad = n === 10 ? 6 : n === 20 ? 6 : 5
  return { start: x - pad, end: x + span + pad }
}

export function CaliperFigure({ x, divisions, reveal: revealed }: { x: number; divisions: VernierDivisions; reveal: boolean }) {
  // Prediction mode keeps the scale but hides the marked answer until it is revealed.
  const masked = usePredictionMasked()
  const reveal = revealed && !masked
  const reading = caliperReading(x, divisions)
  const { start, end } = caliperWindow(reading.value, divisions)
  const left = 24
  const right = WIDTH - 24
  const px = (right - left) / (end - start)
  const map = (mm: number) => left + (mm - start) * px
  const edge = 100
  const mainTop = 18
  const vernierBottom = 168
  const vx = reading.value
  const marks: number[] = []
  for (let mark = Math.max(0, Math.ceil(start)); mark <= Math.min(MAIN_SCALE_END_MM, Math.floor(end)); mark += 1) marks.push(mark)
  // Vernier line k sits at main + k/n + k·(n−1)/n = main + k, so it meets main line main + k.
  const alignedMain = reading.main + reading.line
  const vernierLeft = map(vx) - Math.min(26, 3 * px)
  const vernierRight = map(vx + reading.span) + Math.min(34, 4 * px)

  return (
    <svg className="measure-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="游标卡尺读数放大" fontFamily={FONT}>
      <rect width={WIDTH} height={HEIGHT} fill={PAPER} />
      {/* main scale body: open at both ends like a cut-away figure */}
      <line x1={left - 8} y1={mainTop} x2={right + 8} y2={mainTop} stroke={INK} strokeWidth="1.4" />
      <line x1={left - 8} y1={edge} x2={right + 8} y2={edge} stroke={INK} strokeWidth="1.4" />
      {marks.map((mark) => {
        const length = mark % 10 === 0 ? 28 : mark % 5 === 0 ? 20 : 14
        const hot = reveal && mark === alignedMain
        return (
          <g key={mark}>
            <line
              data-testid={hot ? 'aligned-main' : undefined}
              x1={map(mark)}
              y1={edge}
              x2={map(mark)}
              y2={edge - length}
              stroke={hot ? HIGHLIGHT : INK}
              strokeWidth={hot ? 2.6 : 1.5}
            />
            {mark % 10 === 0 ? (
              <text x={map(mark)} y={edge - 35} textAnchor="middle" fontSize="23" fill={INK}>{mark / 10}</text>
            ) : null}
          </g>
        )
      })}
      <text x={right - 2} y={mainTop + 16} textAnchor="end" fontSize="18" fill={INK}>cm</text>
      <text x={left + 2} y={mainTop + 15} fontSize="13" fill="#666">主尺</text>

      {/* vernier plate */}
      <rect x={vernierLeft} y={edge} width={vernierRight - vernierLeft} height={vernierBottom - edge} fill={PAPER} stroke={INK} strokeWidth="1.4" />
      {Array.from({ length: divisions + 1 }, (_, mark) => {
        const kind = vernierTickKind(divisions, mark)
        const length = kind === 'major' ? 26 : kind === 'mid' ? 20 : 14
        const hot = reveal && mark === reading.line
        const label = vernierLabel(divisions, mark)
        const position = map(vx + mark * reading.spacing)
        return (
          <g key={mark}>
            <line
              data-testid={mark === 0 ? 'vernier-zero' : hot ? 'aligned-vernier' : undefined}
              data-line={mark}
              x1={position}
              y1={edge}
              x2={position}
              y2={edge + length}
              stroke={hot ? HIGHLIGHT : INK}
              strokeWidth={hot ? 2.6 : 1.5}
            />
            {label !== null ? (
              <text x={position} y={edge + length + 20} textAnchor="middle" fontSize="20" fill={INK}>{label}</text>
            ) : null}
          </g>
        )
      })}
      <text x={vernierRight - 4} y={vernierBottom - 6} textAnchor="end" fontSize="13" fill="#666">游标尺</text>

      <text x={left} y={HEIGHT - 14} fontSize="14" fill="#4d5a5f">
        {divisions} 分度（精度 {reading.precision} mm）
      </text>
      <text data-testid="caliper-reading" x={right} y={HEIGHT - 14} textAnchor="end" fontSize="14" fontWeight="700" fill={reveal ? '#1f7a4a' : '#8a5a32'}>
        {reveal ? `${reading.main} mm + ${reading.line} × ${reading.precision} mm = ${reading.text} mm` : '读数在判定后显示'}
      </text>
    </svg>
  )
}

/** Uniform thimble line spacing, as printed in exam figures (no cylinder foreshortening). */
const THIMBLE_STEP = 12
const SLEEVE_PX_PER_MM = 58

export function MicrometerFigure({ reading, zero, reveal: revealed, click }: { reading: number; zero: number; reveal: boolean; click: number }) {
  const masked = usePredictionMasked()
  const reveal = revealed && !masked
  const value = micrometerReading(reading)
  const clipId = `thimble-clip-${useId().replace(/:/g, '')}`
  const datum = 102
  const edgeX = 452
  const sleeveLeft = 24
  const sleeveTop = datum - 42
  const sleeveBottom = datum + 42
  const thimbleTop = 8
  const thimbleBottom = 196
  const thimbleRight = 664
  const map = (mm: number) => edgeX - (reading - mm) * SLEEVE_PX_PER_MM
  // The sleeve body starts a little before its 0 line; before that is the frame boss.
  const sleeveStart = Math.max(sleeveLeft, map(-1.2))
  const marks: number[] = []
  for (let half = Math.max(0, Math.ceil((reading - (edgeX - sleeveLeft) / SLEEVE_PX_PER_MM) * 2)); half / 2 <= reading + 1e-9; half += 1) {
    marks.push(half)
  }
  const visibleMarks = marks.filter((half) => map(half / 2) < edgeX - 1.5)
  const lastVisible = visibleMarks.at(-1)
  // Thimble divisions measured upward from the datum; the line value increases upward.
  const position = (reading - value.fixed) / 0.01
  const base = Math.floor(position)
  const alignedDivision = Math.round(position)
  const rows: number[] = []
  for (let division = base - 9; division <= base + 10; division += 1) rows.push(division)

  return (
    <svg className="measure-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="螺旋测微器读数放大" fontFamily={FONT}>
      <rect width={WIDTH} height={HEIGHT} fill={PAPER} />
      <defs>
        <clipPath id={clipId}>
          <rect x={edgeX} y={thimbleTop} width={thimbleRight - edgeX} height={thimbleBottom - thimbleTop} />
        </clipPath>
      </defs>

      {/* sleeve (固定套管) with the datum line, mm ticks above and half-mm ticks below */}
      <line x1={sleeveStart} y1={sleeveTop} x2={edgeX} y2={sleeveTop} stroke={INK} strokeWidth="1.4" />
      <line x1={sleeveStart} y1={sleeveBottom} x2={edgeX} y2={sleeveBottom} stroke={INK} strokeWidth="1.4" />
      {sleeveStart > sleeveLeft + 1 ? (
        <line x1={sleeveStart} y1={sleeveTop} x2={sleeveStart} y2={sleeveBottom} stroke={INK} strokeWidth="1.4" />
      ) : null}
      <line data-testid="sleeve-datum" x1={sleeveStart} y1={datum} x2={edgeX} y2={datum} stroke={INK} strokeWidth="1.5" />
      {/* A figure the thimble would half cover is left out rather than drawn cut off. */}
      {visibleMarks.map((half) => {
        const integer = half % 2 === 0
        const x = map(half / 2)
        const hot = reveal && half === lastVisible
        return (
          <g key={half}>
            <line
              data-testid={hot ? 'last-sleeve-line' : undefined}
              x1={x}
              y1={datum}
              x2={x}
              y2={integer ? datum - 18 : datum + 18}
              stroke={hot ? HIGHLIGHT : INK}
              strokeWidth={hot ? 2.6 : 1.5}
            />
            {integer && (half / 2) % 5 === 0 && x + String(half / 2).length * 5.5 + 1 < edgeX ? (
              <text x={x} y={datum - 24} textAnchor="middle" fontSize="20" fill={INK}>{half / 2}</text>
            ) : null}
          </g>
        )
      })}

      {/* thimble (微分筒): left edge on the sleeve, divisions start at the edge */}
      <rect data-testid="thimble-body" x={edgeX} y={thimbleTop} width={thimbleRight - edgeX} height={thimbleBottom - thimbleTop} fill={PAPER} stroke={INK} strokeWidth="1.4" />
      <line x1={edgeX + 12} y1={thimbleTop} x2={edgeX + 12} y2={thimbleBottom} stroke="#999" strokeWidth="0.8" />
      <g clipPath={`url(#${clipId})`}>
        {rows.map((division) => {
          const y = datum - (division - position) * THIMBLE_STEP
          const label = ((division % 50) + 50) % 50
          const major = label % 5 === 0
          const hot = reveal && division === alignedDivision
          return (
            <g key={division}>
              <line
                data-testid={hot ? 'aligned-thimble' : undefined}
                x1={edgeX}
                y1={y}
                x2={edgeX + (major ? 30 : 20)}
                y2={y}
                stroke={hot ? HIGHLIGHT : INK}
                strokeWidth={hot ? 2.6 : 1.5}
              />
              {/* Only whole numbers: a figure half cut by the thimble outline reads as another value. */}
              {major && y - 13 >= thimbleTop && y + 6 <= thimbleBottom ? (
                <text x={edgeX + 38} y={y + 6} fontSize="18" fill={INK}>{label}</text>
              ) : null}
            </g>
          )
        })}
      </g>
      <text x={thimbleRight - 6} y={thimbleBottom - 6} textAnchor="end" fontSize="13" fill="#666">微分筒</text>
      <text x={sleeveStart + 6} y={sleeveBottom + 18} fontSize="13" fill="#666">固定刻度</text>

      <text data-testid="micrometer-reading" x={24} y={HEIGHT - 10} fontSize="14" fontWeight="700" fill={reveal ? '#1f7a4a' : '#8a5a32'}>
        {reveal
          ? `${value.fixed.toFixed(1)} mm + ${value.divisions.toFixed(1)} × 0.01 mm = ${value.text} mm${zero ? `（零点 ${zero > 0 ? '+' : ''}${zero.toFixed(3)} mm）` : ''}`
          : '螺距 0.5 mm · 可动刻度 50 格 · 估读到 0.001 mm'}
      </text>
      {click > 0 ? <text x={WIDTH - 24} y={HEIGHT - 10} textAnchor="end" fill="#2f7563" fontSize="14">喀喀！已接触</text> : null}
    </svg>
  )
}
