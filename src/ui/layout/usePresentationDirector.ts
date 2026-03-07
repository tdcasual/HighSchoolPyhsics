import { useEffect, useState, type RefObject } from 'react'
import type { PresentationLayoutMode } from '../../store/useAppStore'
import {
  canUseRuntimePreferredLayout,
  resolveSmartStickySummaryPreference,
  type SmartPresentationContract,
} from '../../app/sceneCatalog'
import {
  hasChartLikeSignal,
  hasResultLikeSignal,
  type PresentationSignal,
} from './presentationSignals'
import {
  resolvePresentationDirectorDecision,
  type PresentationDirectorDecision,
  type PresentationMoment,
} from './presentationDirector'

export type PresentationIntent = {
  moment?: PresentationMoment
  stickySummaryPreferred?: boolean
  userInteracting?: boolean
  preferredLayout?: 'split' | 'viewport'
}

type UsePresentationDirectorOptions = {
  presentationMode: boolean
  routeMode: PresentationLayoutMode
  autoSignalScore: number
  presentationSignals: PresentationSignal[]
  controlsRef: RefObject<HTMLElement | null>
  presentationIntent?: PresentationIntent
  smartPresentation?: SmartPresentationContract | null
}

function readViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function measureControlsState(
  controlsRef: RefObject<HTMLElement | null>,
  stickySummaryPreferred: boolean,
): { controlsScrollable: boolean; controlsTopSignalInView: boolean } {
  const controlsHost = controlsRef.current
  if (!controlsHost) {
    return {
      controlsScrollable: stickySummaryPreferred,
      controlsTopSignalInView: false,
    }
  }

  if (stickySummaryPreferred) {
    return {
      controlsScrollable: true,
      controlsTopSignalInView: false,
    }
  }

  const signalNodes = controlsHost.querySelectorAll('[data-presentation-signal]')
  const scrollable = controlsHost.scrollHeight - controlsHost.clientHeight > 12

  if (signalNodes.length === 0) {
    return {
      controlsScrollable: scrollable,
      controlsTopSignalInView: !scrollable,
    }
  }

  const firstSignalNode = signalNodes[0] as HTMLElement
  const topSignalInView = !scrollable || firstSignalNode.offsetTop <= controlsHost.scrollTop + 120

  return {
    controlsScrollable: scrollable,
    controlsTopSignalInView: topSignalInView,
  }
}

function computeDecision({
  presentationMode,
  routeMode,
  autoSignalScore,
  presentationSignals,
  controlsRef,
  presentationIntent,
  smartPresentation,
}: UsePresentationDirectorOptions): PresentationDirectorDecision {
  const viewport = readViewportSize()
  const stickySummaryPreferred = resolveSmartStickySummaryPreference(
    smartPresentation,
    presentationIntent?.stickySummaryPreferred ?? hasChartLikeSignal(presentationSignals),
  )
  const controlsState = measureControlsState(controlsRef, stickySummaryPreferred)

  return resolvePresentationDirectorDecision({
    width: viewport.width,
    height: viewport.height,
    presentationMode,
    routeMode,
    autoSignalScore,
    hasChartSignal: hasChartLikeSignal(presentationSignals),
    hasResultSignal: hasResultLikeSignal(presentationSignals),
    stickySummaryEnabled: stickySummaryPreferred,
    controlsTopSignalInView: controlsState.controlsTopSignalInView,
    controlsScrollable: controlsState.controlsScrollable,
    userInteracting: presentationIntent?.userInteracting ?? false,
    manualLayoutLocked: routeMode !== 'auto',
    intentLayout: canUseRuntimePreferredLayout(smartPresentation) ? presentationIntent?.preferredLayout ?? null : null,
    lastStableLayoutDecision: routeMode === 'auto' ? 'split' : routeMode,
    moment: presentationIntent?.moment ?? 'overview',
  })
}

export function usePresentationDirector(options: UsePresentationDirectorOptions): PresentationDirectorDecision {
  const [decision, setDecision] = useState<PresentationDirectorDecision>(() => computeDecision(options))

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setDecision(computeDecision(options))
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [options])

  return decision
}
