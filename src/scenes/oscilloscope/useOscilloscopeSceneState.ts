import { useMemo, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { compileVoltageExpression } from './expression'
import { CUSTOM_PRESET_VALUE, derivePresetValue } from './presets'
import { deriveDeflectionFromVoltage } from './runtime'
import { buildDisplayTracePoints, buildDisplayTraceSegments } from './scopeTrace'
import { clampUnitDeflection } from './screenGeometry'
import { useOscilloscopeSimulation } from './useOscilloscopeSimulation'

export const DISPLAY_FULL_SCALE_V = 10
/** 单步: 0.05 s, a tenth of the default 2 Hz signal's period. */
const STEP_S = 0.05

/** Ux(t), Uy(t) as typed by the teacher, the time cursor, and the beam and trace they produce. */
export function useOscilloscopeSceneState() {
  const [timeRate, setTimeRate] = useState(() => recall('oscilloscope.timeRate', 1))
  const [xExpression, setXExpression] = useState(() => recall('oscilloscope.xExpression', '8*sawtooth(2*pi*2*t-pi)'))
  const [yExpression, setYExpression] = useState(() => recall('oscilloscope.yExpression', '6*sin(2*pi*2*t)'))
  useRemember('oscilloscope', { timeRate, xExpression, yExpression })

  // The trace is a pure function of the time cursor.
  const simulation = useOscilloscopeSimulation(timeRate, STEP_S)
  const timeCursor = simulation.timeS
  const compiledX = useMemo(() => compileVoltageExpression(xExpression), [xExpression])
  const compiledY = useMemo(() => compileVoltageExpression(yExpression), [yExpression])
  const ux = compiledX.evaluate(timeCursor)
  const uy = compiledY.evaluate(timeCursor)

  const rawBeamX = deriveDeflectionFromVoltage(ux, DISPLAY_FULL_SCALE_V)
  const rawBeamY = deriveDeflectionFromVoltage(uy, DISPLAY_FULL_SCALE_V)
  const [beamX, beamY] = clampUnitDeflection(rawBeamX, rawBeamY)
  const clippingReasons = [
    Math.abs(ux) > DISPLAY_FULL_SCALE_V + 1e-9 ? 'X 轴' : null,
    Math.abs(uy) > DISPLAY_FULL_SCALE_V + 1e-9 ? 'Y 轴' : null,
    Math.hypot(rawBeamX, rawBeamY) > 1 + 1e-9 ? '圆屏合成偏转' : null,
  ].filter((reason): reason is string => reason !== null)

  // timeCursor advances every animation frame, so memoizing on it never hit; build directly.
  const trace = buildDisplayTracePoints({
    timeCursor,
    fullScaleV: DISPLAY_FULL_SCALE_V,
    evaluateX: compiledX.evaluate,
    evaluateY: compiledY.evaluate,
  })

  const applyPreset = (axis: 'x' | 'y', value: string) => {
    if (value === CUSTOM_PRESET_VALUE) return
    if (axis === 'x') setXExpression(value)
    else setYExpression(value)
  }

  return {
    clock: simulation.clock,
    reset: simulation.reset,
    timeRate,
    setTimeRate,
    xExpression,
    setXExpression,
    yExpression,
    setYExpression,
    xPreset: derivePresetValue(xExpression),
    yPreset: derivePresetValue(yExpression),
    applyPreset,
    xError: compiledX.error,
    yError: compiledY.error,
    timeCursor,
    ux,
    uy,
    beamX,
    beamY,
    clippingReasons,
    traceSegments: buildDisplayTraceSegments(trace),
  }
}

export type OscilloscopeSceneState = ReturnType<typeof useOscilloscopeSceneState>
