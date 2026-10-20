/**
 * The colour filters placed in front of a white-light source. One table for every optics scene,
 * so 红/绿/蓝 filters pass the same band in 双缝干涉, 光的衍射 and 衍射图样.
 */

export type FilterColor = 'none' | 'red' | 'green' | 'blue'

export const FILTER_HEX: Record<Exclude<FilterColor, 'none'>, number> = {
  red: 0xff4444,
  green: 0x44cc44,
  blue: 0x4488ff,
}

export const FILTER_RGB: Record<Exclude<FilterColor, 'none'>, [number, number, number]> = {
  red: [0xff, 0x44, 0x44],
  green: [0x44, 0xcc, 0x44],
  blue: [0x44, 0x88, 0xff],
}

export const FILTER_LABEL: Record<FilterColor, string> = {
  none: '',
  red: '红',
  green: '绿',
  blue: '蓝',
}

/** Pass band of each filter (nm): transmission falls to zero `halfWidth` either side of `center`. */
export const FILTER_PROFILES: Record<Exclude<FilterColor, 'none'>, { center: number; halfWidth: number }> = {
  red: { center: 650, halfWidth: 30 },
  green: { center: 532, halfWidth: 25 },
  blue: { center: 460, halfWidth: 25 },
}

/** Raised-cosine pass band; wavelengths outside the filter band are blocked. */
export function filterTransmission(wavelength: number, filterColor: FilterColor): number {
  if (filterColor === 'none') return 1
  const { center, halfWidth } = FILTER_PROFILES[filterColor]
  const normalizedDistance = Math.abs(wavelength - center) / halfWidth
  if (normalizedDistance >= 1) return 0
  return 0.5 * (1 + Math.cos(Math.PI * normalizedDistance))
}
