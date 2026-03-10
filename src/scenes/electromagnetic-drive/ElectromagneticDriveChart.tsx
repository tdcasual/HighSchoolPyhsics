import { useId, useMemo } from 'react'

type ElectromagneticDriveChartProps = {
  magnetSpeeds: number[]
  frameSpeeds: number[]
}

type ChartPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

const VIEWBOX_WIDTH = 360
const VIEWBOX_HEIGHT = 220
const PADDING: ChartPadding = {
  top: 16,
  right: 14,
  bottom: 22,
  left: 18,
}

function resolveMaxValue(magnetSpeeds: number[], frameSpeeds: number[]): number {
  return Math.max(5, ...magnetSpeeds, ...frameSpeeds)
}

function createLinePath(values: number[], maxValue: number, padding: ChartPadding): string {
  if (values.length === 0) {
    return ''
  }

  const innerWidth = VIEWBOX_WIDTH - padding.left - padding.right
  const innerHeight = VIEWBOX_HEIGHT - padding.top - padding.bottom
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0

  return values
    .map((value, index) => {
      const x = padding.left + stepX * index
      const y = padding.top + innerHeight - (value / maxValue) * innerHeight
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function createAreaPath(values: number[], maxValue: number, padding: ChartPadding): string {
  const linePath = createLinePath(values, maxValue, padding)
  if (!linePath) {
    return ''
  }

  const innerWidth = VIEWBOX_WIDTH - padding.left - padding.right
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0
  const baseY = VIEWBOX_HEIGHT - padding.bottom
  const firstX = padding.left
  const lastX = padding.left + stepX * Math.max(values.length - 1, 0)

  return `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${firstX.toFixed(2)} ${baseY.toFixed(2)} Z`
}

export function ElectromagneticDriveChart({ magnetSpeeds, frameSpeeds }: ElectromagneticDriveChartProps) {
  const magnetGradientId = useId()
  const frameGradientId = useId()
  const maxValue = useMemo(
    () => resolveMaxValue(magnetSpeeds, frameSpeeds),
    [frameSpeeds, magnetSpeeds],
  )
  const magnetLinePath = useMemo(
    () => createLinePath(magnetSpeeds, maxValue, PADDING),
    [magnetSpeeds, maxValue],
  )
  const frameLinePath = useMemo(
    () => createLinePath(frameSpeeds, maxValue, PADDING),
    [frameSpeeds, maxValue],
  )
  const magnetAreaPath = useMemo(
    () => createAreaPath(magnetSpeeds, maxValue, PADDING),
    [magnetSpeeds, maxValue],
  )
  const frameAreaPath = useMemo(
    () => createAreaPath(frameSpeeds, maxValue, PADDING),
    [frameSpeeds, maxValue],
  )

  return (
    <div className="electromagnetic-drive-chart-shell" aria-label="实时转速对比图">
      <div className="electromagnetic-drive-chart-title-row">
        <p className="electromagnetic-drive-chart-title">实时转速对比</p>
        <div className="electromagnetic-drive-chart-legend">
          <span className="magnet">磁铁转速</span>
          <span className="frame">铝框转速</span>
        </div>
      </div>
      <svg
        className="electromagnetic-drive-chart"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="磁铁与铝框转速折线图"
      >
        <defs>
          <linearGradient id={magnetGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--electromagnetic-drive-chart-magnet-fill-top)" />
            <stop offset="100%" stopColor="var(--electromagnetic-drive-chart-magnet-fill-bottom)" />
          </linearGradient>
          <linearGradient id={frameGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--electromagnetic-drive-chart-frame-fill-top)" />
            <stop offset="100%" stopColor="var(--electromagnetic-drive-chart-frame-fill-bottom)" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PADDING.top + (VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom) * ratio
          return (
            <line
              key={`grid-${ratio}`}
              x1={PADDING.left}
              y1={y}
              x2={VIEWBOX_WIDTH - PADDING.right}
              y2={y}
              stroke="var(--electromagnetic-drive-chart-grid-line)"
              strokeWidth="1"
            />
          )
        })}

        <line
          x1={PADDING.left}
          y1={VIEWBOX_HEIGHT - PADDING.bottom}
          x2={VIEWBOX_WIDTH - PADDING.right}
          y2={VIEWBOX_HEIGHT - PADDING.bottom}
          stroke="var(--electromagnetic-drive-chart-axis-line)"
          strokeWidth="1.2"
        />

        {magnetAreaPath ? <path d={magnetAreaPath} fill={`url(#${magnetGradientId})`} /> : null}
        {frameAreaPath ? <path d={frameAreaPath} fill={`url(#${frameGradientId})`} /> : null}
        {magnetLinePath ? (
          <path d={magnetLinePath} fill="none" stroke="var(--electromagnetic-drive-chart-magnet-line)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
        {frameLinePath ? (
          <path d={frameLinePath} fill="none" stroke="var(--electromagnetic-drive-chart-frame-line)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        ) : null}

        <text x={PADDING.left} y={PADDING.top - 2} fill="var(--electromagnetic-drive-chart-axis-text)" fontSize="11">
          {maxValue.toFixed(1)} rad/s
        </text>
        <text x={PADDING.left} y={VIEWBOX_HEIGHT - 4} fill="var(--electromagnetic-drive-chart-axis-subtext)" fontSize="11">
          0
        </text>
      </svg>
    </div>
  )
}
