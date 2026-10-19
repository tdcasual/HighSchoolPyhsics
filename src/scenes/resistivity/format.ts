import { formatScientific } from '../../core/formatNumber'

export function formatRho(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : `${formatScientific(value)} Ω·m`
}

export function formatElementResistance(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return Math.abs(value) >= 1e6 ? formatScientific(value) : value.toFixed(2)
}

export function formatCurrent(value: number): string {
  return `${formatScientific(value)} A`
}
