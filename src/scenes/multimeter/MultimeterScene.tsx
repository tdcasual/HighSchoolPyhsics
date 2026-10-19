import { useEffect, useRef, useState, type RefObject } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { fitCameraDistance, orbitPosition, type OrbitView } from '../measuring-tools/pose'
import { MeterAssembly } from './MeterAssembly'
import { ReadingChart, RheostatChart, VoltAmmeterChart } from './MultimeterChart'
import { MultimeterControls } from './MultimeterControls'
import { RANGE, voltAmmeter } from './model'
import { METER_CAMERA, meterPose, meterView } from './pose'
import { useMultimeterSceneState } from './useMultimeterSceneState'
import './multimeter.css'

type ViewportSize = { left: number; width: number; height: number }

function useViewportSize(ref: RefObject<HTMLDivElement | null>): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ left: 0, width: 1280, height: 720 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight
      setSize((previous) => Math.abs(previous.left - rect.left) < 1 && Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1
        ? previous
        : { left: rect.left, width, height })
    }
    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref])
  return size
}

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
  const sidebarCollapsed = useAppStore((store) => store.sidebarCollapsed)
  const mobileViewport = viewportSize.width <= 767
  const sidebarOffset = mobileViewport ? 0 : Math.max(0, (sidebarCollapsed ? 44 : 320) + 20 - viewportSize.left)
  const overlayReserve = mobileViewport
    ? 0
    : state.stage === 'use'
      ? 250
      : 300
  const safeLeft = mobileViewport ? 12 : sidebarOffset + overlayReserve + 24
  const safeRight = Math.max(safeLeft + 1, viewportSize.width - 20)
  const safeAspect = (safeRight - safeLeft) / Math.max(1, viewportSize.height)
  const centerOffsetPixels = (safeLeft + safeRight) / 2 - viewportSize.width / 2
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
  const shift = centerOffsetPixels * (2 * radius * Math.tan((METER_CAMERA.fov * Math.PI) / 360)) / Math.max(1, viewportSize.height)
  const screenRight: [number, number, number] = [Math.cos(baseView.azimuth), 0, -Math.sin(baseView.azimuth)]
  const view: OrbitView = {
    ...baseView,
    radius,
    target: [baseView.target[0] - screenRight[0] * shift, baseView.target[1], baseView.target[2] - screenRight[2] * shift],
  }
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
        <p><span>表盘读数</span><strong>{state.reading.warning || formatReading(state.reading.indicated, state.reading.unit)}</strong></p>
        <p><span>调零</span><strong>{state.mechanicalOk ? '机械已对准' : '机械未对准'} · {RANGE[state.range].kind === 'ohm' ? (state.ohmOk ? '欧姆已调零' : '欧姆未调零') : '非欧姆挡'}</strong></p>
        <p><span>表笔</span><strong>{RANGE[state.range].kind === 'ohm'
          ? state.task === 'D'
            ? state.swapped ? '反向：黑笔接 N 区' : '正向：黑笔接 P 区'
            : '欧姆挡内黑笔为正，测量前断电'
          : state.swapped ? '红黑已对调，指针反偏' : state.task === 'I' ? '红表笔接入电流正向' : '红笔接高电势'}</strong></p>
      </> : null}
      {state.stage === 'convert' ? <>
        <p><span>改装目标</span><strong>{state.convKind === 'V' ? `电压表 · ${state.convRange.toFixed(1)} V` : `电流表 · ${state.convRange.toFixed(2)} A`}</strong></p>
        <p><span>所需电阻</span><strong>{state.requiredResistance.toFixed(2)} Ω · {state.convKind === 'V' ? '串联' : '并联'}</strong></p>
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
      chartOffsetY={state.stage === 'use' ? 0 : 50}
      overlayZIndex="z-20"
      panelPlacement="after-sidebar"
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
