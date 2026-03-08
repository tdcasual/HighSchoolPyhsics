import { useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react'
import type { PresentationLayoutMode } from '../../store/useAppStore'
import { findRuntimeSceneCatalogEntry, resolveClassroomSceneKind, resolveSceneKindMinimumAutoSignalScore } from '../../app/sceneCatalog'
import {
  parsePresentationSignals,
  scorePresentationSignals,
  type PresentationSignal,
} from './presentationSignals'
import type { PresentationStrategy } from './layoutPolicy'

function readCurrentPathname(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  const normalized = window.location.pathname.replace(/\/+$/, '')
  return normalized || '/'
}

export function resolvePresentationStrategy(
  routeMode: PresentationLayoutMode,
  autoSignalScore: number,
): PresentationStrategy {
  if (routeMode !== 'auto') {
    return routeMode
  }
  return autoSignalScore >= 2 ? 'split' : 'viewport'
}

type UsePresentationStrategyOptions = {
  presentationSignals: PresentationSignal[]
  controls: ReactNode
  controlsRef: RefObject<HTMLElement | null>
  viewportRef: RefObject<HTMLElement | null>
  activeScenePath: string
  presentationRouteModes: Partial<Record<string, Exclude<PresentationLayoutMode, 'auto'>>>
}

type UsePresentationStrategyResult = {
  routeMode: PresentationLayoutMode
  presentationStrategy: PresentationStrategy
  autoSignalScore: number
}

function collectSignalsFromHost(host: HTMLElement, nextSignals: Set<PresentationSignal>) {
  parsePresentationSignals(host.getAttribute('data-presentation-signal')).forEach((signal) => {
    nextSignals.add(signal)
  })

  const signalNodes = host.querySelectorAll('[data-presentation-signal]')
  signalNodes.forEach((node) => {
    parsePresentationSignals(node.getAttribute('data-presentation-signal')).forEach((signal) => {
      nextSignals.add(signal)
    })
  })
}

export function usePresentationStrategy({
  presentationSignals,
  controls,
  controlsRef,
  viewportRef,
  activeScenePath,
  presentationRouteModes,
}: UsePresentationStrategyOptions): UsePresentationStrategyResult {
  const sceneKindAutoSignalFloor = resolveSceneKindMinimumAutoSignalScore(
    resolveClassroomSceneKind(findRuntimeSceneCatalogEntry(activeScenePath)?.classroom),
  )
  const [autoSignalScore, setAutoSignalScore] = useState<number>(() =>
    Math.max(scorePresentationSignals(new Set(presentationSignals)), sceneKindAutoSignalFloor),
  )

  const routePathKey = typeof window === 'undefined' ? activeScenePath || '/' : readCurrentPathname()
  const routeMode = presentationRouteModes[routePathKey] ?? 'auto'

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const nextSignals = new Set<PresentationSignal>(presentationSignals)
      const signalHosts = [controlsRef.current, viewportRef.current].filter(
        (host): host is HTMLElement => host instanceof HTMLElement,
      )

      signalHosts.forEach((host) => {
        collectSignalsFromHost(host, nextSignals)
      })

      setAutoSignalScore(
        Math.max(scorePresentationSignals(nextSignals), sceneKindAutoSignalFloor),
      )
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [activeScenePath, controls, controlsRef, presentationSignals, sceneKindAutoSignalFloor, viewportRef])

  const presentationStrategy = useMemo(
    () => resolvePresentationStrategy(routeMode, autoSignalScore),
    [autoSignalScore, routeMode],
  )

  return {
    routeMode,
    presentationStrategy,
    autoSignalScore,
  }
}
