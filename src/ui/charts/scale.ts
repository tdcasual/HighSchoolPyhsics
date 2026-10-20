export type Domain = [number, number]

/** A tick at `value`, drawn with `label` (defaults to formatTick(value)). */
export type Tick = number | { value: number; label: string }

/** "Nice" ticks (1, 2, 2.5, 5 × 10ⁿ) covering the domain, about `count` intervals. */
export function niceTicks([min, max]: Domain, count = 4): number[] {
  const span = max - min || 1
  const step = niceStep(span / count)
  const start = Math.ceil(min / step - 1e-9) * step
  const values: number[] = []
  for (let value = start; value <= max + step * 1e-6; value += step) values.push(Number(value.toFixed(10)))
  return values
}

/** The smallest of 1, 2, 2.5, 5, 10 × 10ⁿ at least `raw`. */
export function niceStep(raw: number): number {
  const safe = raw > 0 && Number.isFinite(raw) ? raw : 1
  const magnitude = 10 ** Math.floor(Math.log10(safe))
  return [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= safe * (1 - 1e-9)) ?? safe
}

/** Rounds `max` up to a whole number of nice steps so the top tick sits on the frame. */
export function niceMax(max: number, count = 4): number {
  const step = niceStep(Math.max(max, 1e-9) / count)
  return Math.max(step, Math.ceil(max / step - 1e-9) * step)
}

const MINUS = '\u2212'

/** Fewest decimals that write `step` exactly (0.25 → 2, 0.5 → 1, 20 → 0). */
function decimalsFor(step: number): number {
  for (let decimals = 0; decimals < 8; decimals += 1) {
    const scaled = step * 10 ** decimals
    if (Math.abs(scaled - Math.round(scaled)) < 1e-6 * Math.max(1, scaled)) return decimals
  }
  return 8
}

/** Textbook minus sign (−), not the hyphen toFixed produces. */
function withMinus(text: string): string {
  return text.startsWith('-') ? MINUS + text.slice(1) : text
}

export function formatTick(value: number): string {
  if (Math.abs(value) < 1e-9) return '0'
  const digits = Math.abs(value) >= 100 || Number.isInteger(value) ? 0 : Math.abs(value) >= 1 ? 1 : 2
  const text = value.toFixed(digits)
  return withMinus(text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text)
}

/**
 * A formatter fitted to a set of ticks: as many decimals as their spacing needs, or a × 10ⁿ
 * form when they are very small or very large (10⁻⁵ MeV, 10⁶ Hz …).
 */
export function tickFormatter(values: number[]): (value: number) => string {
  const sorted = [...values].sort((a, b) => a - b)
  const step = sorted.slice(1).reduce((min, value, index) => Math.min(min, value - sorted[index]), Infinity)
  const largest = Math.max(...sorted.map(Math.abs), 0)
  if (!Number.isFinite(step) || step <= 0) return formatTick
  if (step < 1e-3 || largest >= 1e5) {
    const exponent = Math.floor(Math.log10(largest || step))
    const superscript = String(exponent).replace('-', '⁻').replace(/\d/g, (digit) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)])
    const decimals = decimalsFor(step / 10 ** exponent)
    return (value) => (Math.abs(value) < step * 1e-6 ? '0' : `${withMinus((value / 10 ** exponent).toFixed(decimals))}×10${superscript}`)
  }
  const decimals = decimalsFor(step)
  return (value) => (Math.abs(value) < step * 1e-6 ? '0' : withMinus(value.toFixed(decimals)))
}

export function tickValue(tick: Tick): number {
  return typeof tick === 'number' ? tick : tick.value
}

export function tickLabel(tick: Tick, format: (value: number) => string = formatTick): string {
  return typeof tick === 'number' ? withMinus(format(tick)) : tick.label
}

/** Maps a domain onto a pixel range; `log` maps log10 of the value. */
export function scale(domain: Domain, range: Domain, kind: 'linear' | 'log' = 'linear'): (value: number) => number {
  const transform = kind === 'log' ? (value: number) => Math.log10(Math.max(value, 1e-300)) : (value: number) => value
  const d0 = transform(domain[0])
  const span = transform(domain[1]) - d0 || 1
  return (value) => range[0] + ((transform(value) - d0) / span) * (range[1] - range[0])
}

/** Min/max of values padded by `padFraction` of the span; a flat or empty series gets ±1 (or ±20 %). */
export function paddedExtent(values: number[], padFraction = 0.1): Domain {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return [-1, 1]
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.2 : 1
    return [min - pad, max + pad]
  }
  const pad = (max - min) * padFraction
  return [min - pad, max + pad]
}
