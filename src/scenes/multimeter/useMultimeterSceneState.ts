import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useState } from 'react'
import type { ViewPreset } from '../../scene3d/orbitFraming'
import { RANGE, rheostat, trialContact, type RangeKey } from './model'
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
  selectRheostatMode,
  parkRheostat as parkRheostatState,
  toggleRheostat as toggleRheostatState,
  zeroMechanical,
  zeroOhm,
  type ContactMethod,
  type MeterStage,
  type MultimeterState,
  type UseTask,
} from './state'

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['stage', 'convKind', 'convRange', 'convTest', 'lgRx', 'ammeterResistance', 'voltmeterResistance', 'contactMethod', 'slider', 'rheostatMode', 'loadResistance', 'rheostatResistance', 'range', 'task'] as const

export function useMultimeterSceneState() {
  const [simulation, setSimulation] = useState(() => rememberFields('multimeter', createMultimeterState(), REMEMBERED_FIELDS))
  useRememberFields('multimeter', simulation, REMEMBERED_FIELDS)
  const commit = (updater: (state: MultimeterState) => MultimeterState) => {
    setSimulation((previous) => updater(previous))
  }
  const reading = readingOf(simulation)
  const recommendation = trialContact({ Rx: 10 ** simulation.lgRx, RA: simulation.ammeterResistance, RV: simulation.voltmeterResistance, E: 3, Rs: 10 })
  const rheostatResult = rheostat({ E: 3, r: 0.5, R0: simulation.rheostatResistance, Rx: simulation.loadResistance, s: simulation.slider })
  const selectedRheostatOutput = rheostatResult[simulation.rheostatMode]
  const rheostatOutput = simulation.rheostatClosed ? selectedRheostatOutput : { U: 0, I: 0 }
  const instruction = simulation.stage === 'convert'
    ? simulation.convResistance === null
      ? '先计算并接入串联电阻或分流电阻，再观察表头偏转。'
      : `已接入 ${simulation.convResistance.toFixed(2)} Ω；校准比例 ${(simulation.convTest * 100).toFixed(0)}% 时，表头应偏转约 ${displayFraction(simulation).toFixed(3)}。`
    : simulation.stage === 'va'
      ? `改变 Rx，比较内外接法的误差。当前${simulation.contactMethod === 'external' ? '外接' : '内接'}；${recommendation.choose === simulation.contactMethod ? '当前接法更合适。' : `建议${recommendation.choose === 'external' ? '外接' : '内接'}。`}`
      : simulation.stage === 'rheostat'
        ? simulation.rheostatClosed
          ? `当前为${simulation.rheostatMode === 'limit' ? '限流式' : '分压式'}，负载电压 ${rheostatOutput.U.toFixed(2)} V。可移动滑片观察电压和电流变化。`
          : `当前为${simulation.rheostatMode === 'limit' ? '限流式' : '分压式'}。先把滑片移到${simulation.rheostatMode === 'limit' ? 'b 端（最大串联电阻）' : 'a 端（输出 0 V）'}，再闭合开关。`
        : reading.warning || (simulation.task === 'V'
          ? '电压挡并联测量；红表笔接电源正极，黑表笔接负极。'
          : simulation.task === 'I'
            ? '断开回路，将电流挡串联接入；禁止把电流挡直接并接在电源两端。'
            : simulation.task === 'R'
              ? RANGE[simulation.range].kind !== 'ohm'
                ? '先断开电源，再选择欧姆挡测电阻。'
                : !isMechanicallyZero(simulation)
                  ? '先完成机械调零；之后切换到“短接”挡，短接表笔并调欧姆零点。'
                  : !isOhmZero(simulation)
                    ? '切换到“短接”挡，短接表笔并按欧姆调零；调好后切回电阻挡。'
                    : '机械零点和欧姆零点已校准；断开待测电路后再测量。'
              : simulation.task === 'D'
                ? RANGE[simulation.range].kind !== 'ohm'
                  ? '判断二极管极性要用欧姆挡。'
                  : '欧姆挡黑表笔为内部电池正极；对调表笔比较二极管正反向。'
                : RANGE[simulation.range].kind !== 'ohm'
                  ? '短接红黑表笔并选择欧姆挡，再进行欧姆调零。'
                  : !isMechanicallyZero(simulation)
                    ? '先完成机械调零，再短接表笔进行欧姆调零。'
                    : !isOhmZero(simulation)
                      ? '表笔已短接；按欧姆调零后，再切回电阻挡测量。'
                      : '欧姆调零完成；切回电阻挡，测量前断开待测电路。')
  return {
    ...simulation,
    fraction: displayFraction(simulation),
    reading,
    instruction,
    requiredResistance: requiredConversion(simulation),
    rheostatResult,
    rheostatOutput,
    mechanicalOk: isMechanicallyZero(simulation),
    ohmOk: isOhmZero(simulation),
    zeroFactor: ohmZeroFactor(simulation),
    target: taskTarget(simulation.task),
    rangeLabel: RANGE[simulation.range].label,
    setStage: (stage: MeterStage) => commit((state) => ({
      ...state,
      stage,
      rheostatClosed: stage === 'rheostat' ? false : state.rheostatClosed,
      range: (stage === 'va' || stage === 'rheostat') && RANGE[state.range].kind !== 'V' ? 'V10' : state.range,
      view: 'home',
      notice: stage === 'convert' ? '先算改装电阻，再接入，看表头是否满偏。' : stage === 'va' ? '改变待测电阻，比较外接偏小和内接偏大。' : stage === 'rheostat' ? '分压从 a 端 0 V 起调；限流从 b 端最大串联电阻起调。' : '选择挡位和测量对象，红表笔接高电势。',
    })),
    setView: (view: ViewPreset) => commit((state) => ({ ...state, view })),
    setConvKind: (convKind: 'V' | 'A') => commit((state) => ({ ...state, convKind, convRange: convKind === 'V' ? 3 : 0.6, convResistance: null, notice: '参数已更改；请重新计算并接入改装电阻。' })),
    setConvRange: (convRange: number) => commit((state) => ({ ...state, convRange, convResistance: null, notice: '量程已更改；请重新计算并接入改装电阻。' })),
    setConvTest: (convTest: number) => commit((state) => ({ ...state, convTest })),
    connectConversion: () => commit(connectConversion),
    setContactMethod: (contactMethod: ContactMethod) => commit((state) => ({ ...state, contactMethod })),
    setLgRx: (lgRx: number) => commit((state) => ({ ...state, lgRx })),
    setSlider: (slider: number) => commit((state) => ({ ...state, slider })),
    setRheostatMode: (mode: MultimeterState['rheostatMode']) => commit((state) => selectRheostatMode(state, mode)),
    parkRheostat: () => commit(parkRheostatState),
    toggleRheostat: () => commit(toggleRheostatState),
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
