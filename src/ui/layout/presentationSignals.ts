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

export function parsePresentationSignals(raw: string | null): PresentationSignal[] {
  if (!raw) {
    return []
  }

  return raw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token): token is PresentationSignal => KNOWN_PRESENTATION_SIGNALS.has(token as PresentationSignal))
}

export function scorePresentationSignals(signals: Iterable<PresentationSignal>): number {
  let score = 0
  for (const signal of signals) {
    score += PRESENTATION_SIGNAL_WEIGHTS[signal]
  }
  return score
}
