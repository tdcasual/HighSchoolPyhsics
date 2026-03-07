import { useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react'
import type { PresentationLayoutMode } from '../../store/useAppStore'
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
  const [autoSignalScore, setAutoSignalScore] = useState<number>(() =>
    scorePresentationSignals(new Set(presentationSignals)),
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

      setAutoSignalScore(scorePresentationSignals(nextSignals))
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [controls, controlsRef, presentationSignals, viewportRef])

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
