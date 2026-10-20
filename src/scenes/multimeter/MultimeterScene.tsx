import { Answer } from '../../ui/notes/Answer'
import { useRef } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { fitCameraDistance, orbitPosition, type OrbitView } from '../../scene3d/orbitFraming'
import { useViewportSize } from '../../scene3d/useViewportSize'
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
  const viewportSize = useViewportSize(viewportRef)
  // Fit to the whole canvas; InteractiveCanvas's safe area moves the result clear of the panels.
  const safeAspect = viewportSize.width / Math.max(1, viewportSize.height)
  const baseView = meterView(state.view)
  const bounds = state.view === 'focus'
    ? { min: [-8, 0, -10] as [number, number, number], max: [8, 20, 2] as [number, number, number] }
    : state.stage === 'convert'
      ? { min: [-13, 0, -8] as [number, number, number], max: [16, 20, 20] as [number, number, number] }
      : state.stage === 'rheostat'
        ? { min: [-18, 0, -8] as [number, number, number], max: [18, 18, 22] as [number, number, number] }
        : { min: [-22, 0, -8] as [number, number, number], max: [22, 20, 22] as [number, number, number] }
  const radius = fitCameraDistance({
    bounds,
    target: baseView.target,
    azimuth: baseView.azimuth,
    elevation: baseView.elevation,
    fov: METER_CAMERA.fov,
    aspect: safeAspect,
    minDistance: METER_CAMERA.minDistance,
    margin: state.view === 'focus' ? 1.06 : 1.12,
  })
  const view: OrbitView = { ...baseView, radius }
  const maxDistance = Math.max(METER_CAMERA.maxDistance, Math.ceil(radius * 1.25))
  const far = Math.max(METER_CAMERA.far, Math.ceil(maxDistance * 1.5))
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
    <div className="multimeter-telemetry scene-core-summary-stack">
      {state.stage === 'use' ? <>
        <p><span>挡位</span><strong>{state.rangeLabel}</strong></p>
        <p><span>指针</span><strong>{state.fraction.toFixed(3)}</strong></p>
        <p><span>表盘读数</span><strong>{state.reading.warning || <Answer>{formatReading(state.reading.indicated, state.reading.unit)}</Answer>}</strong></p>
        <p><span>调零</span><strong>{state.mechanicalOk ? '机械已对准' : '机械未对准'} · {RANGE[state.range].kind === 'ohm' ? (state.ohmOk ? '欧姆已调零' : '欧姆未调零') : '非欧姆挡'}</strong></p>
        <p><span>表笔</span><strong>{RANGE[state.range].kind === 'ohm'
          ? state.task === 'D'
            ? state.swapped ? '反向：黑笔接 N 区' : '正向：黑笔接 P 区'
            : '欧姆挡内黑笔为正，测量前断电'
          : state.swapped ? '红黑已对调，指针反偏' : state.task === 'I' ? '红表笔接入电流正向' : '红笔接高电势'}</strong></p>
      </> : null}
      {state.stage === 'convert' ? <>
        <p><span>改装目标</span><strong>{state.convKind === 'V' ? `电压表 · ${state.convRange.toFixed(1)} V` : `电流表 · ${state.convRange.toFixed(2)} A`}</strong></p>
        <p><span>所需电阻</span><strong><Answer>{state.requiredResistance.toFixed(2)} Ω · {state.convKind === 'V' ? '串联' : '并联'}</Answer></strong></p>
        <p><span>校准输入</span><strong>{(state.convRange * state.convTest).toFixed(state.convKind === 'V' ? 2 : 3)} {state.convKind === 'V' ? 'V' : 'A'}</strong></p>
        <p><span>接入状态</span><strong>{state.convResistance === null ? '尚未接入' : `已接入 ${state.convResistance.toFixed(2)} Ω`}</strong></p>
        <p><span>表头偏转</span><strong>{state.fraction.toFixed(3)} / 1.000</strong></p>
      </> : null}
      {state.stage === 'va' ? <>
        <p><span>待测电阻</span><strong>{(10 ** state.lgRx).toFixed(1)} Ω</strong></p>
        <p><span>当前接法</span><strong>{state.contactMethod === 'external' ? '外接法' : '内接法'}</strong></p>
        <p><span>实际端电压 U</span><strong>{selectedComparison.U.toFixed(3)} V</strong></p>
        <p><span>电压表盘示值</span><strong>{(state.fraction * (RANGE[state.range].full ?? 10)).toFixed(3)} V{state.fraction > 1 ? ' · 超量程' : ''}</strong></p>
        <p><span>电流 I</span><strong>{selectedComparison.I.toFixed(4)} A</strong></p>
        <p><span>测得 R=U/I</span><strong>{selectedComparison.R.toFixed(2)} Ω</strong></p>
        <p><span>误差较小</span><strong>{comparison.better === 'external' ? '外接法' : '内接法'}</strong></p>
        <p><span>电压表量程</span><strong>{state.rangeLabel} · 指针 {state.fraction.toFixed(3)}</strong></p>
      </> : null}
      {state.stage === 'rheostat' ? <>
        <p><span>电路</span><strong>{state.rheostatMode === 'limit' ? '限流式' : '分压式'} · {state.rheostatClosed ? '开关闭合' : '开关断开'}</strong></p>
        <p><span>滑片位置 s</span><strong>{state.slider.toFixed(2)}</strong></p>
        <p><span>实际负载电压</span><strong>{activeRheostatOutput.U.toFixed(3)} V</strong></p>
        <p><span>电压表盘示值</span><strong>{(state.fraction * (RANGE[state.range].full ?? 10)).toFixed(3)} V{state.fraction > 1 ? ' · 超量程' : ''}</strong></p>
        <p><span>负载电流</span><strong>{activeRheostatOutput.I.toFixed(4)} A</strong></p>
        <p><span>电压表量程</span><strong>{state.rangeLabel} · 指针 {state.fraction.toFixed(3)}</strong></p>
        <p><span>限流范围</span><strong>{slide.limitRange[0].toFixed(2)}–{slide.limitRange[1].toFixed(2)} V</strong></p>
        <p><span>分压范围</span><strong>0–{slide.dividerRange[1].toFixed(2)} V</strong></p>
      </> : null}
    </div>
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
            syncCamera
            camera={{ position: orbitPosition(view), fov: METER_CAMERA.fov, near: METER_CAMERA.near, far }}
            adaptiveFraming={false}
            controls={{
              target: view.target,
              minDistance: METER_CAMERA.minDistance,
              maxDistance,
              minPolarAngle: METER_CAMERA.minPolarAngle,
              maxPolarAngle: METER_CAMERA.maxPolarAngle,
            }}
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
