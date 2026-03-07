import type { PresentationLayoutMode } from '../../store/useAppStore'

export type PresentationMoment = 'overview' | 'focus' | 'compare' | 'result' | 'interact'
export type PresentationLayoutDecision = 'split' | 'viewport' | 'split-sticky-summary'
export type PresentationSummaryMode = 'hidden' | 'fallback' | 'sticky' | 'emphasis'

export type PresentationDirectorInput = {
  width: number
  height: number
  presentationMode: boolean
  routeMode: PresentationLayoutMode
  autoSignalScore: number
  hasChartSignal: boolean
  hasResultSignal: boolean
  stickySummaryEnabled: boolean
  controlsTopSignalInView: boolean
  controlsScrollable: boolean
  userInteracting: boolean
  manualLayoutLocked: boolean
  intentLayout: Exclude<PresentationLayoutDecision, 'split-sticky-summary'> | null
  lastStableLayoutDecision?: Exclude<PresentationLayoutDecision, 'split-sticky-summary'>
  moment: PresentationMoment
}

export type PresentationDirectorDecision = {
  layoutDecision: PresentationLayoutDecision
  summaryMode: PresentationSummaryMode
}

function isDesktop1080Presentation(width: number, height: number): boolean {
  return width >= 1200 && height >= 900
}

function resolveBaseLayoutDecision(
  routeMode: PresentationLayoutMode,
  autoSignalScore: number,
): Exclude<PresentationLayoutDecision, 'split-sticky-summary'> {
  if (routeMode === 'split') {
    return 'split'
  }
  if (routeMode === 'viewport') {
    return 'viewport'
  }
  return autoSignalScore >= 2 ? 'split' : 'viewport'
}

export function resolvePresentationDirectorDecision(
  input: PresentationDirectorInput,
): PresentationDirectorDecision {
  if (!input.presentationMode) {
    return {
      layoutDecision: 'split',
      summaryMode: 'hidden',
    }
  }

  const baseLayoutDecision = input.intentLayout && input.routeMode === 'auto'
    ? input.intentLayout
    : resolveBaseLayoutDecision(input.routeMode, input.autoSignalScore)
  const interactionLockedLayout = input.lastStableLayoutDecision ?? 'split'
  const frozenLayout = input.manualLayoutLocked || input.userInteracting
  const resolvedLayout = frozenLayout ? interactionLockedLayout : baseLayoutDecision
  const supportsStickySummary =
    !input.manualLayoutLocked &&
    isDesktop1080Presentation(input.width, input.height) &&
    resolvedLayout === 'split' &&
    input.stickySummaryEnabled &&
    input.controlsScrollable &&
    !input.controlsTopSignalInView

  if (input.moment === 'result' && (resolvedLayout === 'viewport' || !input.hasChartSignal || input.hasResultSignal)) {
    return {
      layoutDecision: resolvedLayout,
      summaryMode: 'emphasis',
    }
  }

  if (supportsStickySummary) {
    return {
      layoutDecision: 'split-sticky-summary',
      summaryMode: 'sticky',
    }
  }

  if (resolvedLayout === 'viewport') {
    return {
      layoutDecision: 'viewport',
      summaryMode: 'fallback',
    }
  }

  return {
    layoutDecision: 'split',
    summaryMode: 'hidden',
  }
}
