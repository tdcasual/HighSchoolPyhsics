export type LayoutTier = 'desktop' | 'tablet' | 'mobile'

export const DEFAULT_LEFT_PANEL_WIDTH_PX = 320
export const MIN_VIEWPORT_WIDTH_PX = 320

export function resolveLayoutTier(width: number): LayoutTier {
  if (width >= 1200) return 'desktop'
  if (width >= 768) return 'tablet'
  return 'mobile'
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
