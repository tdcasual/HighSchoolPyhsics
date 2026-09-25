import { useEffect, useRef, useState } from 'react'
import type { ElementKind, MaterialKey } from './model'
import { meterReading } from './model'
import {
  createResistivityState,
  errorOf,
  fillSamples,
  isAnimating,
  liveElement,
  liveMeasurement,
  meanDiameter,
  recordDiameter,
  recordPoint,
  seatOnWire,
  setClosed,
  setGap,
  stepGap,
  wireLabel,
  type ResistivityStage,
  type ResistivityState,
} from './state'
import type { CircuitControl, CircuitMethod } from './model'
import type { ViewPreset } from '../measuring-tools/pose'

export function useResistivitySceneState() {
  const [simulation, setSimulation] = useState(createResistivityState)
  const simulationRef = useRef(simulation)
  const animating = isAnimating(simulation)

  useEffect(() => {
    simulationRef.current = simulation
  }, [simulation])

  useEffect(() => {
    if (!animating) return
    let frame = 0
    let last = 0
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const next = stepGap(simulationRef.current, dt)
      simulationRef.current = next
      setSimulation(next)
      if (isAnimating(next)) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [animating])

  const commit = (updater: (state: ResistivityState) => ResistivityState) => {
    setSimulation((previous) => {
      const next = updater(previous)
      simulationRef.current = next
      return next
    })
  }

  const reading = liveMeasurement(simulation)
  const ammeterKey = simulation.ammeter === 'A3' ? 'A3' : 'A06'
  const voltmeterKey = simulation.voltmeter === 'V15' ? 'V15' : 'V3'
  const current = meterReading(reading.Imeter, ammeterKey)
  const voltage = meterReading(reading.Umeter, voltmeterKey)
  const elementNow = liveElement(simulation)

  return {
    ...simulation,
    animating,
    wireName: wireLabel(simulation),
    meanDiameter: meanDiameter(simulation),
    reading,
    ammeterReading: current,
    voltmeterReading: voltage,
    elementNow,
    error: errorOf(simulation),
    setStage: (stage: ResistivityStage) => commit((state) => ({
      ...state,
      stage,
      view: stage === 'diameter' ? 'focus' : 'home',
      notice: stage === 'diameter' ? '测三个位置的直径。' : stage === 'circuit' ? '连接电路后闭合开关，记录多组 U、I。' : stage === 'analysis' ? '用图像斜率求电阻，再算电阻率。' : '对比金属丝、小灯泡和二极管的 I–U 曲线。',
    })),
    setView: (view: ViewPreset) => commit((state) => ({ ...state, view })),
    setMaterial: (material: MaterialKey) => commit((state) => ({ ...state, material, mystery: false, notice: '已更换金属丝，直径和记录需要重测。', diameters: [null, null, null], records: [] })),
    setMystery: (mystery: boolean) => commit((state) => ({ ...state, mystery, diameters: [null, null, null], records: [], notice: mystery ? '这是一根未知金属丝，测完后用电阻率辨认。' : '已取消未知样品。' })),
    setNominal: (nominal: number) => commit((state) => ({ ...state, nominal, diameters: [null, null, null] })),
    setPosition: (position: 0 | 1 | 2) => commit((state) => ({ ...state, position, notice: `当前测量位置 ${position + 1}。` })),
    setGap: (gap: number) => commit((state) => setGap(state, gap)),
    seat: () => commit(seatOnWire),
    recordDiameter: () => commit(recordDiameter),
    setStep: (step: number) => commit((state) => ({ ...state, step, closed: step < 3 ? false : state.closed })),
    setMethod: (method: CircuitMethod) => commit((state) => ({ ...state, method })),
    setControl: (control: CircuitControl) => commit((state) => ({ ...state, control, slider: control === 'limit' ? 1 : 0, notice: control === 'limit' ? '限流接法：滑片先放在 b 端。' : '分压接法：滑片先放在 a 端。' })),
    setAmmeter: (ammeter: 'A06' | 'A3') => commit((state) => ({ ...state, ammeter })),
    setVoltmeter: (voltmeter: 'V3' | 'V15') => commit((state) => ({ ...state, voltmeter })),
    setSlider: (slider: number) => commit((state) => ({ ...state, slider })),
    setLength: (lengthCm: number) => commit((state) => ({ ...state, lengthCm })),
    toggleClosed: () => commit((state) => setClosed(state, !state.closed)),
    recordPoint: () => commit(recordPoint),
    fillSamples: () => commit(fillSamples),
    clearRecords: () => commit((state) => ({ ...state, records: [], notice: '已清空数据。' })),
    setGraph: (graph: ResistivityState['graph']) => commit((state) => ({ ...state, graph })),
    setFit: (fit: ResistivityState['fit']) => commit((state) => ({ ...state, fit })),
    setElement: (elementKind: ElementKind) => commit((state) => ({ ...state, element: elementKind })),
    setVoltage: (voltage: number) => commit((state) => ({ ...state, voltage })),
    reset: () => {
      const next = createResistivityState()
      simulationRef.current = next
      setSimulation(next)
    },
  }
}

export type ResistivitySceneState = ReturnType<typeof useResistivitySceneState>
