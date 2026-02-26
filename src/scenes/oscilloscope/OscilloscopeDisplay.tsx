import { useMemo } from 'react'

type OscilloscopeDisplayProps = {
  beamX: number
  beamY: number
  traceSegments: Array<Array<[number, number]>>
  running: boolean
}

const SCREEN_WIDTH = 320
const SCREEN_HEIGHT = 220

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value))
}

function toScreenPoint(x: number, y: number): [number, number] {
  const sx = ((clampUnit(x) + 1) / 2) * SCREEN_WIDTH
  const sy = ((1 - clampUnit(y)) / 2) * SCREEN_HEIGHT
  return [sx, sy]
}

export function OscilloscopeDisplay({ beamX, beamY, traceSegments, running }: OscilloscopeDisplayProps) {
  const tracePolylines = useMemo(
    () =>
      traceSegments
        .map((segment) =>
          segment
            .map(([x, y]) => {
              const [sx, sy] = toScreenPoint(x, y)
              return `${sx.toFixed(2)},${sy.toFixed(2)}`
            })
            .join(' '),
        )
        .filter((points) => points.length > 0),
    [traceSegments],
  )
  const [cursorX, cursorY] = toScreenPoint(beamX, beamY)

  return (
    <div className="scope-card">
      <h3>荧光屏显示</h3>
      <div className="scope-screen">
        <svg
          className="scope-svg"
          viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
          aria-label="示波器荧光屏"
        >
          <defs>
            <filter id="scopeGlow">
              <feGaussianBlur stdDeviation="2.2" result="blurred" />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="scope-grid">
            {Array.from({ length: 11 }).map((_, index) => {
              const x = (SCREEN_WIDTH / 10) * index
              return (
                <line
                  key={`grid-x-${x}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={SCREEN_HEIGHT}
                />
              )
            })}
            {Array.from({ length: 9 }).map((_, index) => {
              const y = (SCREEN_HEIGHT / 8) * index
              return (
                <line
                  key={`grid-y-${y}`}
                  x1={0}
                  y1={y}
                  x2={SCREEN_WIDTH}
                  y2={y}
                />
              )
            })}
          </g>

          <line
            className="scope-axis"
            x1={SCREEN_WIDTH / 2}
            y1={0}
            x2={SCREEN_WIDTH / 2}
            y2={SCREEN_HEIGHT}
          />
          <line
            className="scope-axis"
            x1={0}
            y1={SCREEN_HEIGHT / 2}
            x2={SCREEN_WIDTH}
            y2={SCREEN_HEIGHT / 2}
          />

          {tracePolylines.length > 0 ? (
            <g filter="url(#scopeGlow)">
              {tracePolylines.map((points, index) => (
                <g key={`scope-trace-${index}`}>
                  <polyline className="scope-trace-halo" points={points} />
                  <polyline className="scope-trace-core" points={points} />
                </g>
              ))}
            </g>
          ) : null}

          <circle className="scope-cursor" cx={cursorX} cy={cursorY} r={3.2} />
        </svg>
      </div>
      <p className="scope-status">{running ? '运行中' : '已暂停'}</p>
    </div>
  )
}
