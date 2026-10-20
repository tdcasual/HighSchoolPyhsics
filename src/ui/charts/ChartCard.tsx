import type { ReactNode } from 'react'
import './charts.css'

export type LegendItem = {
  label: ReactNode
  color: string
  /** 'line' (default) for curves, 'dot' for measured points, 'dash' for fits and extrapolations. */
  shape?: 'line' | 'dot' | 'dash'
}

/**
 * The card every scene chart sits in: heading with a live status on the right, the plot(s),
 * a legend and an optional footer line. Colours come from theme tokens, so charts follow the
 * day/night theme; series colours use var(--chart-1 … 6) or any CSS colour.
 */
export function ChartCard({
  title,
  status,
  legend,
  footer,
  className,
  ariaLabel,
  children,
}: {
  title?: ReactNode
  status?: ReactNode
  legend?: LegendItem[]
  footer?: ReactNode
  className?: string
  /** Names the group when the card holds several plots. */
  ariaLabel?: string
  children: ReactNode
}) {
  return (
    <figure className={['chart-card', className].filter(Boolean).join(' ')} role={ariaLabel ? 'group' : undefined} aria-label={ariaLabel}>
      {title || status ? (
        <figcaption className="chart-card-heading">
          {title ? <span className="chart-card-title">{title}</span> : null}
          {status ? <span className="chart-card-status">{status}</span> : null}
        </figcaption>
      ) : null}
      {children}
      {legend?.length ? <ChartLegend items={legend} /> : null}
      {footer ? <p className="chart-card-footer">{footer}</p> : null}
    </figure>
  )
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="chart-legend" aria-label="图例">
      {items.map((item, index) => (
        <span key={index}>
          <i className={`chart-legend-${item.shape ?? 'line'}`} style={{ color: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
