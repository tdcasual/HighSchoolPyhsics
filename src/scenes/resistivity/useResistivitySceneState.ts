import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useEffect, useRef, useState } from 'react'
import { ELEMENTS, type ElementKind, type MaterialKey } from './model'
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

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['stage', 'material', 'mystery', 'nominal', 'method', 'control', 'ammeter', 'voltmeter', 'lengthCm', 'graph', 'fit', 'element'] as const

export function useResistivitySceneState() {
  const [simulation, setSimulation] = useState(() => rememberFields('resistivity', createResistivityState(), REMEMBERED_FIELDS))
  useRememberFields('resistivity', simulation, REMEMBERED_FIELDS)
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
      closed: false,
      view: 'home',
      notice: stage === 'diameter' ? '测三个位置的直径。' : stage === 'circuit' ? '连接电路后闭合开关，记录多组 U、I。' : stage === 'analysis' ? '用图像斜率求电阻，再算电阻率。' : '对比金属丝、小灯泡和二极管的 I–U 曲线。',
    })),
    setView: (view: ViewPreset) => commit((state) => ({ ...state, view })),
    setMaterial: (material: MaterialKey) => commit((state) => ({
      ...state, material, mystery: false, step: 0, closed: false, diameters: [null, null, null], records: [],
      notice: '已更换金属丝，需重测直径并重新接线。',
    })),
    setMystery: (mystery: boolean) => commit((state) => ({
      ...state, mystery, step: 0, closed: false, diameters: [null, null, null], records: [],
      notice: mystery ? '这是一根未知金属丝，测完后用电阻率辨认。' : '已取消未知样品。',
    })),
    setNominal: (nominal: number) => commit((state) => ({
      ...state, nominal, step: 0, closed: false, diameters: [null, null, null], records: [],
      notice: '标称直径已改变，请重测直径并重新采集电学数据。',
    })),
    setZero: (zero: number) => commit((state) => ({
      ...state, zero, gapAnim: null,
      notice: '零点误差已更新；记录时会同时保存示数、零点和修正后的直径。',
    })),
    setPosition: (position: 0 | 1 | 2) => commit((state) => ({ ...state, position, notice: `当前测量位置 ${position + 1}。` })),
    setGap: (gap: number) => commit((state) => setGap(state, gap)),
    seat: () => commit(seatOnWire),
    recordDiameter: () => commit(recordDiameter),
    setStep: (step: number) => commit((state) => {
      const nextStep = Math.max(0, Math.min(2, Math.round(step)))
      return {
        ...state,
        step: nextStep,
        closed: nextStep === 2 ? state.closed : false,
        notice: nextStep === 0
          ? '先连接电源、开关、滑动变阻器、电流表和金属丝主回路。'
          : nextStep === 1
            ? '主回路已接好；下一步将电压表并联在待测金属丝两端。'
            : '电压表已接入；确认量程与安全滑片位置后即可闭合。',
      }
    }),
    setMethod: (method: CircuitMethod) => commit((state) => ({
      ...state, method, step: 0, closed: false, notice: '测量接法已改变，请断开并重新连接电路。',
    })),
    setControl: (control: CircuitControl) => commit((state) => ({
      ...state, control, slider: control === 'limit' ? 1 : 0, step: 0, closed: false,
      notice: control === 'limit' ? '限流接法：滑片先放在 b 端，并重新连接主回路。' : '分压接法：滑片先放在 a 端，并重新连接主回路。',
    })),
    setAmmeter: (ammeter: 'A06' | 'A3') => commit((state) => ({
      ...state, ammeter, step: 0, closed: false, notice: '电流表量程已改变，请断开并重新连接后再测量。',
    })),
    setVoltmeter: (voltmeter: 'V3' | 'V15') => commit((state) => ({
      ...state, voltmeter, step: 0, closed: false, notice: '电压表量程已改变，请断开并重新连接后再测量。',
    })),
    setSlider: (slider: number) => commit((state) => ({ ...state, slider })),
    setLength: (lengthCm: number) => commit((state) => ({
      ...state, lengthCm, closed: false, notice: '接入长度已改变，开关已断开；调整后可重新闭合。',
    })),
    toggleClosed: () => commit((state) => setClosed(state, !state.closed)),
    recordPoint: () => commit(recordPoint),
    fillSamples: () => commit(fillSamples),
    clearRecords: () => commit((state) => ({ ...state, records: [], notice: '已清空数据。' })),
    setGraph: (graph: ResistivityState['graph']) => commit((state) => ({ ...state, graph })),
    setFit: (fit: ResistivityState['fit']) => commit((state) => ({ ...state, fit })),
    setElement: (elementKind: ElementKind) => commit((state) => ({
      ...state,
      element: elementKind,
      voltage: Math.max(ELEMENTS[elementKind].min, Math.min(ELEMENTS[elementKind].max, state.voltage)),
    })),
    setVoltage: (voltage: number) => commit((state) => ({
      ...state, voltage: Math.max(ELEMENTS[state.element].min, Math.min(ELEMENTS[state.element].max, voltage)),
    })),
    reset: () => {
      const next = createResistivityState()
      simulationRef.current = next
      setSimulation(next)
    },
  }
}

export type ResistivitySceneState = ReturnType<typeof useResistivitySceneState>
