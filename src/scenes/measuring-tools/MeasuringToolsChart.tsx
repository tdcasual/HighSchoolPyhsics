import { caliperReading, micrometerReading, type VernierDivisions } from './model'
import type { InstrumentTool } from './pose'

type MeasuringToolsChartProps = {
  tool: InstrumentTool
  reveal: boolean
  divisions: VernierDivisions
  caliperX: number
  micGap: number
  micZero: number
  click: number
}

function mapRange(value: number, start: number, end: number, left: number, right: number) {
  return left + ((value - start) / (end - start)) * (right - left)
}

export function MeasuringToolsChart(props: MeasuringToolsChartProps) {
  if (props.tool === 'caliper') {
    return <CaliperStrip divisions={props.divisions} x={props.caliperX} reveal={props.reveal} />
  }
  return <MicrometerStrip gap={props.micGap} zero={props.micZero} reveal={props.reveal} click={props.click} />
}

function CaliperStrip({ x, divisions, reveal }: { x: number; divisions: VernierDivisions; reveal: boolean }) {
  const reading = caliperReading(x, divisions)
  const start = reading.x - 6
  const end = reading.x + reading.span + 8
  const map = (mm: number) => mapRange(mm, start, end, 28, 692)
  const marks = []
  for (let mark = Math.ceil(start); mark <= Math.floor(end); mark += 1) {
    marks.push(mark)
  }
  return (
    <svg className="measure-chart" viewBox="0 0 720 188" role="img" aria-label="游标卡尺读数放大">
      <rect width="720" height="188" rx="12" fill="#f7fbfb" />
      <text x="20" y="24" fill="#24525c" fontSize="14" fontWeight="700">读数放大 · 游标零线与对齐刻度</text>
      <text x="700" y="24" textAnchor="end" fill={reveal ? '#1f7a4a' : '#8a5a32'} fontSize="12">
        {reveal ? `${reading.main} mm + 第 ${reading.line} 条 × ${reading.precision} mm = ${reading.text} mm` : '读数在判定后显示'}
      </text>
      <line x1="20" y1="78" x2="700" y2="78" stroke="#1b2528" strokeWidth="1.4" />
      {marks.map((mark) => (
        <g key={mark}>
          <line x1={map(mark)} y1="78" x2={map(mark)} y2={mark % 10 === 0 ? 48 : mark % 5 === 0 ? 58 : 66} stroke="#1b2528" strokeWidth={mark % 10 === 0 ? 1.6 : 1} />
          {mark % 10 === 0 ? <text x={map(mark)} y="42" textAnchor="middle" fontSize="11" fill="#1b2528">{mark}</text> : null}
        </g>
      ))}
      {Array.from({ length: divisions + 1 }, (_, mark) => {
        const mm = reading.x + mark * reading.spacing
        const aligned = reveal && mark === reading.line
        return (
          <g key={mark}>
            <line
              data-testid={mark === 0 ? 'vernier-zero' : aligned ? 'aligned-vernier' : undefined}
              data-line={mark}
              x1={map(mm)}
              y1="86"
              x2={map(mm)}
              y2={aligned ? 128 : 112}
              stroke={aligned ? '#c96b3f' : '#24525c'}
              strokeWidth={aligned ? 2.4 : 1.2}
            />
          </g>
        )
      })}
      <text x="20" y="168" fill="#4d646c" fontSize="12">{divisions} 分度 · 精度 {reading.precision} mm · 尺框 {reading.x.toFixed(2)} mm</text>
    </svg>
  )
}

function MicrometerStrip({ gap, zero, reveal, click }: { gap: number; zero: number; reveal: boolean; click: number }) {
  const indicated = gap + zero
  const reading = micrometerReading(indicated)
  const start = reading.fixed - 2
  const end = reading.fixed + 3
  const map = (mm: number) => mapRange(mm, start, end, 36, 430)
  const marks = []
  for (let mark = Math.ceil(start * 2) / 2; mark <= end; mark += 0.5) marks.push(Number(mark.toFixed(1)))
  return (
    <svg className="measure-chart" viewBox="0 0 720 188" role="img" aria-label="螺旋测微器读数放大">
      <rect width="720" height="188" rx="12" fill="#f7fbfb" />
      <text x="20" y="24" fill="#24525c" fontSize="14" fontWeight="700">读数放大 · 固定刻度与微分筒</text>
      <text x="700" y="24" textAnchor="end" fill={reveal ? '#1f7a4a' : '#8a5a32'} fontSize="12">
        {reveal ? `${reading.fixed.toFixed(1)} mm + ${reading.divisions.toFixed(1)} × 0.01 mm = ${reading.text} mm` : '读数在判定后显示'}
      </text>
      <rect x="24" y="48" width="420" height="78" rx="8" fill="#e7eef0" />
      <line x1="36" y1="86" x2="430" y2="86" stroke={reveal ? '#c96b3f' : '#1b2528'} strokeWidth="1.6" />
      {marks.map((mark) => {
        const half = Math.abs(mark * 2 - Math.round(mark) * 2) > 0.1
        return (
          <line
            key={mark}
            x1={map(mark)}
            y1="86"
            x2={map(mark)}
            y2={half ? 108 : 62}
            stroke="#1b2528"
            strokeWidth="1.3"
          />
        )
      })}
      <rect x="454" y="46" width="242" height="96" rx="10" fill="#f4f7f8" stroke="#c5d2d6" />
      <line data-testid="thimble-datum" x1="470" y1="94" x2="680" y2="94" stroke="#c96b3f" strokeWidth="1.4" />
      {[-2, -1, 0, 1, 2].map((offset) => {
        const division = reading.divisions + offset
        const y = 94 - offset * 16
        return (
          <text key={offset} x="560" y={y} textAnchor="middle" fontSize="13" fill={offset === 0 ? '#c96b3f' : '#1b2528'}>
            {((Math.round(division * 10) / 10 + 50) % 50).toFixed(1)}
          </text>
        )
      })}
      <text data-testid="micrometer-reading" x="20" y="168" fill="#4d646c" fontSize="12">
        螺距 0.5 mm · 示数 {reading.text} mm{zero ? ` · 零点 ${zero > 0 ? '+' : ''}${zero.toFixed(3)} mm` : ''}{reading.halfLine ? ' · 半毫米已露出' : ''}
      </text>
      {click > 0 ? <text x="700" y="168" textAnchor="end" fill="#2f7563" fontSize="12">喀喀！已接触</text> : null}
    </svg>
  )
}
