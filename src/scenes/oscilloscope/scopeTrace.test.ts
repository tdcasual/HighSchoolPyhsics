import { describe, expect, it } from 'vitest'
import {
  buildDisplayTracePoints,
  buildDisplayTraceSegments,
  DEFAULT_TRACE_WINDOW_S,
  DEFAULT_TRACE_SAMPLES,
} from './scopeTrace'

describe('oscilloscope phosphor trace', () => {
  it('uses 2-second persistence window for stable waveform readability', () => {
    expect(DEFAULT_TRACE_WINDOW_S).toBe(2)
  })

  it('builds dense trace samples across the persistence window', () => {
    const trace = buildDisplayTracePoints({
      timeCursor: 1.2,
      fullScaleV: 10,
      samples: DEFAULT_TRACE_SAMPLES,
      windowS: DEFAULT_TRACE_WINDOW_S,
      evaluateX: (t) => 6 * Math.sin(2 * Math.PI * 2 * t),
      evaluateY: (t) => 5 * Math.sin(2 * Math.PI * 45 * t),
    })

    expect(trace.length).toBe(DEFAULT_TRACE_SAMPLES)
    expect(new Set(trace.map(([x]) => x.toFixed(3))).size).toBeGreaterThan(30)
    expect(new Set(trace.map(([, y]) => y.toFixed(3))).size).toBeGreaterThan(30)
  })

  it('splits trace into segments when x performs a retrace jump', () => {
    const points: Array<[number, number]> = [
      [-0.9, 0.1],
      [-0.2, 0.2],
      [0.5, 0.3],
      [0.95, 0.4],
      [-0.95, -0.1],
      [-0.5, 0],
      [0.2, 0.1],
    ]

    const segments = buildDisplayTraceSegments(points)

    expect(segments.length).toBeGreaterThanOrEqual(2)
    expect(segments[0][segments[0].length - 1][0]).toBeCloseTo(0.95)
    expect(segments[1][0][0]).toBeCloseTo(-0.95)
  })
})
