import type { ReactNode } from 'react'
import { Answer } from '../notes/Answer'

export type DataRow = {
  label: ReactNode
  value: ReactNode
  /** A conclusion the class can predict first: masked by prediction mode until revealed. */
  answer?: boolean
  /** Rows that only apply in some modes; false leaves the row out. */
  when?: boolean
  testId?: string
  /** Extra class on the row (e.g. a warning colour) and on its value. */
  className?: string
  valueClassName?: string
}

/** Readings the data panel should hold at once (AGENTS.md: 3–5 results, not parameter echoes). */
export const MAX_DATA_ROWS = 5

/**
 * The data zone of every scene: one "label · value" line per reading, answers wrapped for
 * prediction mode, same markup in the floating panel and the mobile strip.
 */
export function DataRows({ rows, className, note }: { rows: DataRow[]; className?: string; note?: ReactNode }) {
  const shown = rows.filter((row) => row.when !== false)
  if (import.meta.env.DEV && shown.length > MAX_DATA_ROWS) {
    console.warn(`DataRows: ${shown.length} rows shown; keep the data panel to ${MAX_DATA_ROWS} readings.`)
  }
  return (
    <div className={className ? `scene-core-summary-stack ${className}` : 'scene-core-summary-stack'}>
      {shown.map((row, index) => (
        <p key={index} className={row.className}>
          <span>{row.label}</span>
          <strong data-testid={row.testId} className={row.valueClassName}>
            {row.answer ? <Answer>{row.value}</Answer> : row.value}
          </strong>
        </p>
      ))}
      {note}
    </div>
  )
}
