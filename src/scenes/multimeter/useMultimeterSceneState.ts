import { useState } from 'react'
import type { ViewPreset } from '../measuring-tools/pose'
import { RANGE, type RangeKey } from './model'
import {
  chooseOhmRange,
  connectConversion,
  createMultimeterState,
  displayFraction,
  isMechanicallyZero,
  isOhmZero,
  ohmZeroFactor,
  requiredConversion,
  taskTarget,
  readingOf,
  zeroMechanical,
  zeroOhm,
  type MeterStage,
  type MultimeterState,
  type UseTask,
} from './state'

export function useMultimeterSceneState() {
  const [simulation, setSimulation] = useState(createMultimeterState)
  const commit = (updater: (state: MultimeterState) => MultimeterState) => {
    setSimulation((previous) => updater(previous))
  }
  const reading = readingOf(simulation)
  return {
    ...simulation,
    fraction: displayFraction(simulation),
    reading,
    requiredResistance: requiredConversion(simulation),
    mechanicalOk: isMechanicallyZero(simulation),
    ohmOk: isOhmZero(simulation),
    zeroFactor: ohmZeroFactor(simulation),
    target: taskTarget(simulation.task),
    rangeLabel: RANGE[simulation.range].label,
    setStage: (stage: MeterStage) => commit((state) => ({
      ...state,
      stage,
      view: stage === 'use' ? 'home' : 'home',
      notice: stage === 'convert' ? '先算改装电阻，再接入，看表头是否满偏。' : stage === 'va' ? '改变待测电阻，比较外接偏小和内接偏大。' : stage === 'rheostat' ? '分压可以从 0 调起，限流有一个调不到的下限。' : '选择挡位和测量对象，红表笔接高电势。',
    })),
    setView: (view: ViewPreset) => commit((state) => ({ ...state, view })),
    setConvKind: (convKind: 'V' | 'A') => commit((state) => ({ ...state, convKind, convRange: convKind === 'V' ? 3 : 0.6, convResistance: null })),
    setConvRange: (convRange: number) => commit((state) => ({ ...state, convRange, convResistance: null })),
    setConvTest: (convTest: number) => commit((state) => ({ ...state, convTest })),
    connectConversion: () => commit(connectConversion),
    setLgRx: (lgRx: number) => commit((state) => ({ ...state, lgRx })),
    setSlider: (slider: number) => commit((state) => ({ ...state, slider })),
    setLoad: (loadResistance: number) => commit((state) => ({ ...state, loadResistance })),
    setRange: (range: RangeKey) => commit((state) => ({ ...state, range, ohmKnob: RANGE[range].kind === 'ohm' ? 0 : state.ohmKnob, notice: RANGE[range].kind === 'ohm' ? '已换欧姆挡，短接后重新调零。' : `当前挡位 ${RANGE[range].label}。` })),
    setTask: (task: UseTask) => commit((state) => ({ ...state, task })),
    toggleSwapped: () => commit((state) => ({ ...state, swapped: !state.swapped, notice: state.swapped ? '红表笔回到高电势一侧。' : '红黑表笔已对调。欧姆挡里黑表笔接内部电池正极。' })),
    setMechanical: (mechanical: number) => commit((state) => ({ ...state, mechanical })),
    setOhmKnob: (ohmKnob: number) => commit((state) => ({ ...state, ohmKnob })),
    setResistance: (resistance: number) => commit((state) => ({ ...state, resistance, task: 'R' })),
    zeroMechanical: () => commit(zeroMechanical),
    zeroOhm: () => commit(zeroOhm),
    chooseOhmRange: () => commit(chooseOhmRange),
    reset: () => setSimulation(createMultimeterState()),
  }
}

export type MultimeterSceneState = ReturnType<typeof useMultimeterSceneState>
