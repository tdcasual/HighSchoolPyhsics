import type { PresentationLayoutMode } from '../../store/useAppStore'

export type LayoutTier = 'desktop' | 'tablet' | 'mobile'
export type PresentationStrategy = Exclude<PresentationLayoutMode, 'auto'>

const DEFAULT_LEFT_PANEL_WIDTH_PX = 320
const DEFAULT_PRESENTATION_SPLIT_RATIO = 1 / 3
export const SPLIT_DIVIDER_WIDTH_PX = 24
const MIN_LEFT_PANEL_WIDTH_PX = 240
const MIN_SPLIT_LEFT_PANEL_WIDTH_PX = 320
const MIN_VIEWPORT_WIDTH_PX = 320

export function resolveLayoutTier(width: number): LayoutTier {
  if (width < 768) {
    return 'mobile'
  }
  if (width < 1200) {
    return 'tablet'
  }
  return 'desktop'
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function isPresentationSplit(
  presentationMode: boolean,
  presentationStrategy: PresentationStrategy,
): boolean {
  return presentationMode && presentationStrategy === 'split'
}

export function resolvePreferredLeftWidthPx(
  viewportWidth: number,
  presentationMode: boolean,
  presentationStrategy: PresentationStrategy,
): number {
  if (isPresentationSplit(presentationMode, presentationStrategy)) {
    return Math.round((viewportWidth - SPLIT_DIVIDER_WIDTH_PX) * DEFAULT_PRESENTATION_SPLIT_RATIO)
  }

  return DEFAULT_LEFT_PANEL_WIDTH_PX
}

export function resolveLeftPanelBounds(
  viewportWidth: number,
  presentationMode: boolean,
  presentationStrategy: PresentationStrategy,
): { preferred: number; min: number; max: number } {
  const min = isPresentationSplit(presentationMode, presentationStrategy)
    ? MIN_SPLIT_LEFT_PANEL_WIDTH_PX
    : MIN_LEFT_PANEL_WIDTH_PX
  const max = Math.max(min + 80, viewportWidth - MIN_VIEWPORT_WIDTH_PX)
  const preferred = clamp(
    resolvePreferredLeftWidthPx(viewportWidth, presentationMode, presentationStrategy),
    min,
    max,
  )

  return { preferred, min, max }
}
