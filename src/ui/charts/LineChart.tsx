import type { ReactNode } from 'react'
import { ChartCard } from './ChartCard'
import { ChartFrame, Cursor, Dot, Series } from './ChartFrame'
import type { Domain, Tick } from './scale'

export type LineSeries = {
  id: string
  label: ReactNode
  color: string
  points: Array<[number, number]>
  dashed?: boolean
  /** Hidden while prediction mode masks answers. */
  answer?: boolean
}

export type LineMarker = { id: string; x: number; y: number; color: string; testId?: string; answer?: boolean }

type LineChartProps = {
  title: ReactNode
  /** Accessible description of what is plotted. */
  ariaLabel: string
  xLabel: ReactNode
  yLabel: ReactNode
  series: LineSeries[]
  xDomain: Domain
  yDomain: Domain
  xTicks?: Tick[]
  yTicks?: Tick[]
  /** Vertical cursor at the current time. */
  cursorX?: number
  /** Points on the curves at the cursor (current readings). */
  markers?: LineMarker[]
  status?: ReactNode
  footer?: ReactNode
  height?: number
}

/** The common case: a few curves against x with a "now" cursor, in a ChartCard with a legend. */
export function LineChart({ title, ariaLabel, xLabel, yLabel, series, xDomain, yDomain, xTicks, yTicks, cursorX, markers, status, footer, height }: LineChartProps) {
  return (
    <ChartCard
      title={title}
      status={status}
      footer={footer}
      legend={series.map((line) => ({ label: line.label, color: line.color, shape: line.dashed ? 'dash' : 'line' }))}
    >
      <ChartFrame ariaLabel={ariaLabel} xLabel={xLabel} yLabel={yLabel} xDomain={xDomain} yDomain={yDomain} xTicks={xTicks} yTicks={yTicks} height={height}>
        {(plot) => (
          <>
            {series.map((line) => (
              <Series key={line.id} plot={plot} points={line.points} color={line.color} dashed={line.dashed} answer={line.answer} />
            ))}
            {cursorX !== undefined ? <Cursor plot={plot} x={cursorX} /> : null}
            {markers?.map((marker) => (
              <Dot key={marker.id} plot={plot} x={marker.x} y={marker.y} color={marker.color} ring testId={marker.testId} answer={marker.answer} />
            ))}
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
