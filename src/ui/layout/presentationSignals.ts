const PRESENTATION_SIGNALS = [
  'chart',
  'live-metric',
  'time-series',
  'interactive-readout',
] as const

export type PresentationSignal = (typeof PRESENTATION_SIGNALS)[number]

const PRESENTATION_SIGNAL_WEIGHTS: Record<PresentationSignal, number> = {
  chart: 2,
  'live-metric': 1,
  'time-series': 1,
  'interactive-readout': 1,
}

const KNOWN_PRESENTATION_SIGNALS = new Set<PresentationSignal>(PRESENTATION_SIGNALS)
const RESULT_LIKE_PRESENTATION_SIGNALS = new Set<PresentationSignal>([
  'live-metric',
  'interactive-readout',
])

export function isPresentationSignal(value: string): value is PresentationSignal {
  return KNOWN_PRESENTATION_SIGNALS.has(value as PresentationSignal)
}

export function parsePresentationSignals(raw: string | null): PresentationSignal[] {
  if (!raw) {
    return []
  }

  return raw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token): token is PresentationSignal => KNOWN_PRESENTATION_SIGNALS.has(token as PresentationSignal))
}

export function scorePresentationSignals(signals: Iterable<PresentationSignal | string>): number {
  let score = 0
  for (const signal of signals) {
    if (!isPresentationSignal(signal)) {
      continue
    }
    score += PRESENTATION_SIGNAL_WEIGHTS[signal]
  }
  return score
}

export function hasChartLikeSignal(signals: Iterable<PresentationSignal>): boolean {
  for (const signal of signals) {
    if (signal === 'chart' || signal === 'time-series') {
      return true
    }
  }
  return false
}

export function hasResultLikeSignal(signals: Iterable<PresentationSignal>): boolean {
  for (const signal of signals) {
    if (RESULT_LIKE_PRESENTATION_SIGNALS.has(signal)) {
      return true
    }
  }
  return false
}

export function resolveBasePresentationScore(signals: Iterable<PresentationSignal>): number {
  return scorePresentationSignals(signals)
}
