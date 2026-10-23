import type { ReactNode } from 'react'
import { Answer } from '../../ui/notes/Answer'
import { DataRows } from '../../ui/panels/DataRows'
import { RANGE, voltAmmeter } from './model'
import type { MultimeterSceneState } from './useMultimeterSceneState'

function formatReading(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return '—'
  if (value === Number.POSITIVE_INFINITY) return '∞ Ω'
  if (unit === 'Ω' && Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)} MΩ`
  if (unit === 'Ω' && Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)} kΩ`
  if (unit === 'Ω') return `${value.toFixed(Math.abs(value) < 10 ? 2 : 1)} Ω`
  return `${value.toFixed(2)} ${unit}`
}

/** The data panel for each stage: 多用电表的使用, 电表改装, 伏安法, 滑动变阻器. */
export function MultimeterReadings({
  state,
  comparison,
}: {
  state: MultimeterSceneState
  comparison: ReturnType<typeof voltAmmeter>
}): ReactNode {
  const selectedComparison = comparison[state.contactMethod]
  const slide = state.rheostatResult
  const activeRheostatOutput = state.rheostatOutput
  return (
    <DataRows
      className="multimeter-telemetry"
      rows={[
        { label: '挡位', value: state.rangeLabel, when: state.stage === 'use' },
        { label: '指针', value: state.fraction.toFixed(3), when: state.stage === 'use' },
        {
          label: '表盘读数',
          value: state.reading.warning || <Answer>{formatReading(state.reading.indicated, state.reading.unit)}</Answer>,
          when: state.stage === 'use',
        },
        {
          label: '调零',
          value: (
            <>
              {state.mechanicalOk ? '机械已对准' : '机械未对准'} ·{' '}
              {RANGE[state.range].kind === 'ohm' ? (state.ohmOk ? '欧姆已调零' : '欧姆未调零') : '非欧姆挡'}
            </>
          ),
          when: state.stage === 'use',
        },
        {
          label: '表笔',
          value:
            RANGE[state.range].kind === 'ohm'
              ? state.task === 'D'
                ? state.swapped
                  ? '反向：黑笔接 N 区'
                  : '正向：黑笔接 P 区'
                : '欧姆挡内黑笔为正，测量前断电'
              : state.swapped
                ? '红黑已对调，指针反偏'
                : state.task === 'I'
                  ? '红表笔接入电流正向'
                  : '红笔接高电势',
          when: state.stage === 'use',
        },
        {
          label: '改装目标',
          value:
            state.convKind === 'V'
              ? `电压表 · ${state.convRange.toFixed(1)} V`
              : `电流表 · ${state.convRange.toFixed(2)} A`,
          when: state.stage === 'convert',
        },
        {
          label: '所需电阻',
          value: (
            <>
              {state.requiredResistance.toFixed(2)} Ω · {state.convKind === 'V' ? '串联' : '并联'}
            </>
          ),
          answer: true,
          when: state.stage === 'convert',
        },
        {
          label: '校准输入',
          value: (
            <>
              {(state.convRange * state.convTest).toFixed(state.convKind === 'V' ? 2 : 3)}{' '}
              {state.convKind === 'V' ? 'V' : 'A'}
            </>
          ),
          when: state.stage === 'convert',
        },
        {
          label: '接入状态',
          value: state.convResistance === null ? '尚未接入' : `已接入 ${state.convResistance.toFixed(2)} Ω`,
          when: state.stage === 'convert',
        },
        { label: '表头偏转', value: <>{state.fraction.toFixed(3)} / 1.000</>, when: state.stage === 'convert' },
        // 伏安法: the givens, the two meter readings, then the conclusions to predict.
        {
          label: '已知',
          value: (
            <>
              Rx = {(10 ** state.lgRx).toFixed(1)} Ω · {state.contactMethod === 'external' ? '外接法' : '内接法'}
            </>
          ),
          when: state.stage === 'va',
        },
        {
          label: '电压 U',
          value: (
            <>
              {selectedComparison.U.toFixed(3)} V{state.fraction > 1 ? ' · 超量程' : ''}
            </>
          ),
          when: state.stage === 'va',
        },
        { label: '电流 I', value: <>{selectedComparison.I.toFixed(4)} A</>, when: state.stage === 'va' },
        {
          label: '测得 R=U/I',
          value: <>{selectedComparison.R.toFixed(2)} Ω</>,
          answer: true,
          when: state.stage === 'va',
        },
        {
          label: '误差较小',
          value: comparison.better === 'external' ? '外接法' : '内接法',
          answer: true,
          when: state.stage === 'va',
        },
        // 滑动变阻器: the circuit, what the load gets, and how far each connection can adjust it.
        {
          label: '电路',
          value: (
            <>
              {state.rheostatMode === 'limit' ? '限流式' : '分压式'} · {state.rheostatClosed ? '开关闭合' : '开关断开'}
            </>
          ),
          when: state.stage === 'rheostat',
        },
        {
          label: '负载电压 U',
          value: (
            <>
              {activeRheostatOutput.U.toFixed(3)} V{state.fraction > 1 ? ' · 超量程' : ''}
            </>
          ),
          when: state.stage === 'rheostat',
        },
        { label: '负载电流 I', value: <>{activeRheostatOutput.I.toFixed(4)} A</>, when: state.stage === 'rheostat' },
        {
          label: '调节范围',
          value: (
            <>
              限流 {slide.limitRange[0].toFixed(2)}–{slide.limitRange[1].toFixed(2)} V · 分压 0–
              {slide.dividerRange[1].toFixed(2)} V
            </>
          ),
          answer: true,
          when: state.stage === 'rheostat',
        },
      ]}
    />
  )
}
