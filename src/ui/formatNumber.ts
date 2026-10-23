const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
}

/**
 * Textbook scientific notation: `5.97×10²⁴`, never `5.97e+24`.
 * Values whose exponent lies in [minPlain, maxPlain] are written as plain decimals with
 * the same number of significant figures, so `3.6` is not shown as `3.60×10⁰`.
 */
export function formatScientific(value: number, significant = 3, minPlain = -2, maxPlain = 3): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return (0).toFixed(Math.max(0, significant - 1))
  const [mantissaText, exponentText] = value.toExponential(significant - 1).split('e')
  const exponent = Number(exponentText)
  if (exponent >= minPlain && exponent <= maxPlain) {
    return value.toFixed(Math.max(0, significant - 1 - exponent))
  }
  const superscript = String(exponent)
    .split('')
    .map((digit) => SUPERSCRIPT[digit] ?? digit)
    .join('')
  return `${mantissaText}×10${superscript}`
}
