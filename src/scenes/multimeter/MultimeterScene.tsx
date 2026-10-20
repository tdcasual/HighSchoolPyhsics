import { DataRows } from '../../ui/panels/DataRows'
import { Answer } from '../../ui/notes/Answer'
import { useRef } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { fitOrbitView, type Bounds3 } from '../../scene3d/orbitFraming'
import { useFittedOrbitCamera } from '../../scene3d/useFittedOrbitCamera'
import { MeterAssembly } from './MeterAssembly'
import { ReadingChart, RheostatChart, VoltAmmeterChart } from './MultimeterChart'
import { MultimeterControls } from './MultimeterControls'
import { RANGE, voltAmmeter } from './model'
import { METER_CAMERA, meterPose, meterView } from './pose'
import { useMultimeterSceneState } from './useMultimeterSceneState'
import './multimeter.css'

function formatReading(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return '—'
  if (value === Number.POSITIVE_INFINITY) return '∞ Ω'
  if (unit === 'Ω' && Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)} MΩ`
  if (unit === 'Ω' && Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)} kΩ`
  if (unit === 'Ω') return `${value.toFixed(Math.abs(value) < 10 ? 2 : 1)} Ω`
  return `${value.toFixed(2)} ${unit}`
}

export function MultimeterScene() {
  const state = useMultimeterSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const baseView = meterView(state.view)
  const bounds: Bounds3 = state.view === 'focus'
    ? { min: [-8, 0, -10], max: [8, 20, 2] }
    : state.stage === 'convert'
      ? { min: [-13, 0, -8], max: [16, 20, 20] }
      : state.stage === 'rheostat'
        ? { min: [-18, 0, -8], max: [18, 18, 22] }
        : { min: [-22, 0, -8], max: [22, 20, 22] }
  // Fitted into the largest uncovered area once per stage and view; panels then only cover it.
  const camera = useFittedOrbitCamera(viewportRef, `${state.stage}-${state.view}`, METER_CAMERA, (area) => fitOrbitView({
    ...area,
    bounds,
    anchor: baseView.target,
    azimuth: baseView.azimuth,
    elevation: baseView.elevation,
    fov: METER_CAMERA.fov,
    minDistance: METER_CAMERA.minDistance,
    margin: state.view === 'focus' ? 1.06 : 1.12,
  }))
  const comparison = voltAmmeter({ Rx: 10 ** state.lgRx, RA: state.ammeterResistance, RV: state.voltmeterResistance, E: 3, Rs: 10 })
  const selectedComparison = comparison[state.contactMethod]
  const slide = state.rheostatResult
  const activeRheostatOutput = state.rheostatOutput
  const secondaryFraction = state.stage === 'va' ? selectedComparison.I / 0.1 : state.stage === 'rheostat' ? activeRheostatOutput.I / 0.1 : 0.5
  const measurementTarget = state.stage === 'use' ? state.target : state.stage === 'va' || state.stage === 'rheostat' ? 'loopV' : 'none'
  const pose = meterPose({
    fraction: state.fraction,
    range: state.range,
    mechanicalSlider: state.mechanical,
    ohmSlider: state.ohmKnob,
    target: measurementTarget,
    swapped: state.swapped,
    contactMethod: state.contactMethod,
  })
  const dataOverlay = (
    <DataRows
        className="multimeter-telemetry"
        rows={[
          { label: '挡位', value: state.rangeLabel, when: state.stage === 'use' },
          { label: '指针', value: state.fraction.toFixed(3), when: state.stage === 'use' },
          { label: '表盘读数', value: state.reading.warning || <Answer>{formatReading(state.reading.indicated, state.reading.unit)}</Answer>, when: state.stage === 'use' },
          { label: '调零', value: <>{state.mechanicalOk ? '机械已对准' : '机械未对准'} · {RANGE[state.range].kind === 'ohm' ? (state.ohmOk ? '欧姆已调零' : '欧姆未调零') : '非欧姆挡'}</>, when: state.stage === 'use' },
          { label: '表笔', value: RANGE[state.range].kind === 'ohm'
          ? state.task === 'D'
            ? state.swapped ? '反向：黑笔接 N 区' : '正向：黑笔接 P 区'
            : '欧姆挡内黑笔为正，测量前断电'
          : state.swapped ? '红黑已对调，指针反偏' : state.task === 'I' ? '红表笔接入电流正向' : '红笔接高电势', when: state.stage === 'use' },
          { label: '改装目标', value: state.convKind === 'V' ? `电压表 · ${state.convRange.toFixed(1)} V` : `电流表 · ${state.convRange.toFixed(2)} A`, when: state.stage === 'convert' },
          { label: '所需电阻', value: <>{state.requiredResistance.toFixed(2)} Ω · {state.convKind === 'V' ? '串联' : '并联'}</>, answer: true, when: state.stage === 'convert' },
          { label: '校准输入', value: <>{(state.convRange * state.convTest).toFixed(state.convKind === 'V' ? 2 : 3)} {state.convKind === 'V' ? 'V' : 'A'}</>, when: state.stage === 'convert' },
          { label: '接入状态', value: state.convResistance === null ? '尚未接入' : `已接入 ${state.convResistance.toFixed(2)} Ω`, when: state.stage === 'convert' },
          { label: '表头偏转', value: <>{state.fraction.toFixed(3)} / 1.000</>, when: state.stage === 'convert' },
          // 伏安法: the givens, the two meter readings, then the conclusions to predict.
          { label: '已知', value: <>Rx = {(10 ** state.lgRx).toFixed(1)} Ω · {state.contactMethod === 'external' ? '外接法' : '内接法'}</>, when: state.stage === 'va' },
          { label: '电压 U', value: <>{selectedComparison.U.toFixed(3)} V{state.fraction > 1 ? ' · 超量程' : ''}</>, when: state.stage === 'va' },
          { label: '电流 I', value: <>{selectedComparison.I.toFixed(4)} A</>, when: state.stage === 'va' },
          { label: '测得 R=U/I', value: <>{selectedComparison.R.toFixed(2)} Ω</>, answer: true, when: state.stage === 'va' },
          { label: '误差较小', value: comparison.better === 'external' ? '外接法' : '内接法', answer: true, when: state.stage === 'va' },
          // 滑动变阻器: the circuit, what the load gets, and how far each connection can adjust it.
          { label: '电路', value: <>{state.rheostatMode === 'limit' ? '限流式' : '分压式'} · {state.rheostatClosed ? '开关闭合' : '开关断开'}</>, when: state.stage === 'rheostat' },
          { label: '负载电压 U', value: <>{activeRheostatOutput.U.toFixed(3)} V{state.fraction > 1 ? ' · 超量程' : ''}</>, when: state.stage === 'rheostat' },
          { label: '负载电流 I', value: <>{activeRheostatOutput.I.toFixed(4)} A</>, when: state.stage === 'rheostat' },
          { label: '调节范围', value: <>限流 {slide.limitRange[0].toFixed(2)}–{slide.limitRange[1].toFixed(2)} V · 分压 0–{slide.dividerRange[1].toFixed(2)} V</>, answer: true, when: state.stage === 'rheostat' },
        ]}
      />
  )
  const chart = state.stage === 'va' ? (
    <VoltAmmeterChart lgRx={state.lgRx} ammeterResistance={state.ammeterResistance} voltmeterResistance={state.voltmeterResistance} method={state.contactMethod} />
  ) : state.stage === 'rheostat' ? (
    <RheostatChart slider={state.slider} load={state.loadResistance} rheostatResistance={state.rheostatResistance} mode={state.rheostatMode} closed={state.rheostatClosed} />
  ) : (
    <ReadingChart fraction={state.fraction} caption={state.stage === 'convert' ? '改装表头的偏转比例' : state.rangeLabel} />
  )
  const playbackActions = state.stage === 'use'
    ? [
        { key: 'swap', label: state.swapped ? '表笔复位' : '对调表笔', onClick: state.toggleSwapped },
        { key: 'zero', label: '机械调零', onClick: state.zeroMechanical },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]
    : undefined

  return (
    <SceneLayout
      controls={<MultimeterControls state={state} />}
      dataOverlay={dataOverlay}
      chart={chart}
      chartVisible={state.stage !== 'use'}
      chartInitiallyCollapsed={state.stage !== 'use'}
      overlayZIndex="z-20"
      playbackActions={playbackActions}
      viewport={
        <div ref={viewportRef} style={{ width: '100%', height: '100%' }}>
          <InteractiveCanvas
            {...camera.canvasProps}
            frameloop="demand"
          >
            <MeterAssembly pose={pose} stage={state.stage} rheostatSlider={state.slider} rheostatMode={state.rheostatMode} rheostatClosed={state.rheostatClosed} rheostatCurrentFraction={secondaryFraction} rangeLabel={state.stage === 'convert' ? (state.convKind === 'V' ? state.convRange.toFixed(1) + ' V' : state.convRange.toFixed(2) + ' A') : state.rangeLabel} convKind={state.convKind} conversionConnected={state.convResistance !== null} secondaryFraction={secondaryFraction} />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default MultimeterScene
