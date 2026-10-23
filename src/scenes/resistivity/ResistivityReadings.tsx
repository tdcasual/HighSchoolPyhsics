import type { ReactNode } from 'react'
import { micrometerReading } from '../../instruments/measuring/model'
import { DataRows } from '../../ui/panels/DataRows'
import { formatCurrent, formatElementResistance, formatRho } from './format'
import { ELEMENTS, METERS } from './model'
import { indicatedGap, isSeated, type analysisOf } from './state'
import type { ResistivitySceneState } from './useResistivitySceneState'

/** The data panel for each stage: 测直径, 测电阻, 数据处理, 伏安特性. */
export function ResistivityReadings({
  state,
  analysis,
}: {
  state: ResistivitySceneState
  analysis: ReturnType<typeof analysisOf>
}): ReactNode {
  const diameterView = state.stage === 'diameter'
  const diameterReading = micrometerReading(indicatedGap(state))
  const measuredResistance =
    state.voltmeterReading.reading > 0 && state.ammeterReading.reading > 0
      ? state.voltmeterReading.reading / state.ammeterReading.reading
      : null
  const fittedSlopeLabel = analysis.fit
    ? `${analysis.fit.slope.toPrecision(3)} ${state.graph === 'UI' ? 'Ω' : 'Ω/m'}`
    : '—'
  const ammeterSpec = METERS[state.ammeter === 'A3' ? 'A3' : 'A06']
  return (
    <DataRows
      className="resistivity-telemetry"
      rows={
        diameterView
          ? [
              {
                label: '样品 / 位置',
                value: (
                  <>
                    {state.wireName} · {state.position + 1}
                  </>
                ),
              },
              { label: '测微器示数', value: <>{diameterReading.text} mm</>, answer: true },
              {
                label: '固定刻度',
                value: (
                  <>
                    {diameterReading.fixed.toFixed(1)} mm · 半线{diameterReading.halfLine ? '已露' : '未露'}
                  </>
                ),
                answer: true,
              },
              { label: '可动刻度', value: <>{diameterReading.divisions.toFixed(1)} 格 × 0.01 mm</>, answer: true },
              {
                label: '零点误差 / 接触',
                value: (
                  <>
                    {state.zero > 0 ? '+' : ''}
                    {state.zero.toFixed(3)} mm · {isSeated(state) ? '已接触' : '未接触'}
                  </>
                ),
              },
            ]
          : state.stage === 'circuit'
            ? [
                { label: '样品', value: state.wireName },
                { label: '接入长度 l', value: <>{state.lengthCm.toFixed(1)} cm</> },
                { label: '电压 U', value: <>{state.voltmeterReading.text} V</> },
                { label: '电流 I', value: <>{state.ammeterReading.text} A</> },
                {
                  label: '电阻 R = U/I',
                  value: measuredResistance === null ? '—' : measuredResistance.toFixed(2) + ' Ω',
                },
              ]
            : state.stage === 'analysis'
              ? [
                  { label: '直径测量', value: <>{analysis.diameterCount}/3 处</> },
                  { label: state.graph === 'UI' ? 'U–I 斜率 = R' : 'R–l 斜率 = ρ/S', value: fittedSlopeLabel },
                  { label: '电阻率 ρ', value: formatRho(analysis.rho) },
                  {
                    label: '最接近的材料',
                    value: analysis.nearest?.name,
                    when: Boolean(state.mystery && analysis.nearest),
                  },
                  { label: '拟合数据点', value: analysis.points.length },
                ]
              : [
                  { label: '研究元件', value: ELEMENTS[state.element].name },
                  { label: '电压 U', value: <>{state.elementNow.U.toFixed(2)} V</> },
                  { label: '电流 I', value: formatCurrent(state.elementNow.I) },
                  { label: '静态电阻 R = U/I', value: <>{formatElementResistance(state.elementNow.R)} Ω</> },
                  {
                    label: '表盘状态',
                    value: <>反向漏电远低于 {ammeterSpec.division} A 最小分度</>,
                    when: Boolean(state.element === 'diode' && state.elementNow.U < 0),
                  },
                  { label: '切线斜率 dI/dU', value: <>{state.elementNow.slope.toFixed(3)} A/V</> },
                ]
      }
    />
  )
}
