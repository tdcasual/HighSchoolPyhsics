import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MeasuringToolsChart } from '../measuring-tools/MeasuringToolsChart'
import { useViewportSize } from '../measuring-tools/useViewportSize'
import { cameraLimits, fitCameraDistance, instrumentView, orbitPosition, type OrbitView, type ViewPreset } from '../measuring-tools/pose'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CIRCUIT_CAMERA, circuitPose, circuitView, circuitWires } from './circuitPose'
import { ElementChart, ResistivityChart } from './ResistivityChart'
import { formatCurrent, formatElementResistance, formatRho } from './format'
import { ResistivityControls } from './ResistivityControls'
import { ResistivityRig3D } from './ResistivityRig3D'
import { activeWire, analysisOf, indicatedGap, isSeated } from './state'
import { ELEMENTS, METERS } from './model'
import { micrometerReading } from '../measuring-tools/model'
import { useResistivitySceneState } from './useResistivitySceneState'
import '../measuring-tools/measuring-tools.css'
import './resistivity.css'

export function ResistivityScene() {
  const state = useResistivitySceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewportSize = useViewportSize(viewportRef)
  const [instrumentDragging, setInstrumentDragging] = useState(false)
  const [dragView, setDragView] = useState<OrbitView | null>(null)
  const [showSecant, setShowSecant] = useState(true)
  const [showTangent, setShowTangent] = useState(false)
  const currentView = useRef<OrbitView | null>(null)
  const sample = activeWire(state)
  const analysis = analysisOf(state)
  const diameterView = state.stage === 'diameter'
  const diameterReading = micrometerReading(indicatedGap(state))
  const limits = diameterView ? cameraLimits('micrometer') : CIRCUIT_CAMERA
  const mobileViewport = viewportSize.width <= 767
  const sidebarOffset = mobileViewport
    ? 0
    // Reserve the expanded sidebar: collapsing it later only uncovers more view, never re-frames.
    : Math.max(0, 320 + 20 - viewportSize.left)
  const panelReserve = mobileViewport ? 0 : diameterView ? 280 : state.stage === 'circuit' ? 260 : Math.min(548, viewportSize.width * 0.43)
  const safeLeft = mobileViewport ? 12 : sidebarOffset + panelReserve + 24
  const safeRight = Math.max(safeLeft + 1, viewportSize.width - 48)
  const safeWidth = safeRight - safeLeft
  const safeAspect = safeWidth / Math.max(1, viewportSize.height)
  const centerOffsetPixels = (safeLeft + safeRight) / 2 - viewportSize.width / 2
  const ivMode = state.stage === 'iv'
  const fittedView = diameterView
    ? instrumentView({
        tool: 'micrometer',
        mode: 'outer',
        preset: state.view,
        caliperX: 0,
        reading: state.gap + state.zero,
        aspect: safeAspect,
        centerOffsetPixels,
        viewportHeight: viewportSize.height,
      })
    : (() => {
        const base = circuitView(state.view as ViewPreset)
        const radius = fitCameraDistance({
          bounds: { min: [-38, -1, -20], max: [33, ivMode ? 12 : 15, 18] },
          target: base.target,
          azimuth: base.azimuth,
          elevation: base.elevation,
          fov: limits.fov,
          aspect: safeAspect,
          margin: 1.12,
        })
        return { ...base, radius: Math.max(base.radius, radius), screenOffset: [centerOffsetPixels, 0] as [number, number] }
      })()
  useLayoutEffect(() => {
    currentView.current = fittedView
  }, [fittedView])
  const view = dragView ?? fittedView
  const position = orbitPosition(view)
  const maxDistance = Math.max(limits.maxDistance, Math.ceil(view.radius * 1.2))
  const cameraFar = Math.max(limits.far, Math.ceil(maxDistance * 1.5))
  const onInstrumentDragChange = useCallback((dragging: boolean) => {
    setInstrumentDragging(dragging)
    setDragView(dragging ? currentView.current : null)
  }, [])
  const measuredResistance = state.voltmeterReading.reading > 0 && state.ammeterReading.reading > 0
    ? state.voltmeterReading.reading / state.ammeterReading.reading
    : null
  const fittedSlopeLabel = analysis.fit
    ? `${analysis.fit.slope.toPrecision(3)} ${state.graph === 'UI' ? 'Ω' : 'Ω/m'}`
    : '—'
  const ammeterSpec = METERS[state.ammeter === 'A3' ? 'A3' : 'A06']
  const voltmeterSpec = METERS[state.voltmeter === 'V15' ? 'V15' : 'V3']
  const ammeterRange = ammeterSpec.range
  const voltmeterRange = voltmeterSpec.range
  const centeredFraction = (value: number, range: number) => Math.max(0, Math.min(1, 0.5 + value / (2 * range)))
  const wires = useMemo(() => circuitWires({
    step: ivMode ? 2 : state.step,
    control: ivMode ? 'limit' : state.control,
    method: ivMode ? 'external' : state.method,
    ammeter: state.ammeter === 'A3' ? 'A3' : 'A06',
    voltmeter: state.voltmeter === 'V15' ? 'V15' : 'V3',
    ivMode,
    voltage: state.elementNow.U,
  }), [ivMode, state.step, state.control, state.method, state.ammeter, state.voltmeter, state.elementNow.U])
  const pose = useMemo(() => circuitPose({
    lengthCm: state.lengthCm,
    slider: state.slider,
    closed: ivMode || (state.closed && state.step >= 2),
    ammeterFraction: ivMode ? centeredFraction(state.elementNow.I, ammeterRange) : state.ammeterReading.fraction,
    voltmeterFraction: ivMode ? centeredFraction(state.elementNow.U, voltmeterRange) : state.voltmeterReading.fraction,
    temperatureRise: ivMode ? Math.max(0, state.elementNow.T - 300) : state.reading.dT,
  }), [
    state.lengthCm, state.slider, state.closed, state.step,
    state.elementNow.I, state.elementNow.U, state.elementNow.T,
    state.ammeterReading.fraction, state.voltmeterReading.fraction, state.reading,
    ammeterRange, voltmeterRange, ivMode,
  ])

  return (
    <SceneLayout
      chartContentClassName="measure-chart-content"
      controls={<ResistivityControls state={state} showSecant={showSecant} showTangent={showTangent} onShowSecantChange={setShowSecant} onShowTangentChange={setShowTangent} />}
      dataOverlay={
        <div className="resistivity-telemetry scene-core-summary-stack">
          {diameterView ? (
            <>
              <p><span>样品 / 位置</span><strong>{state.wireName} · {state.position + 1}</strong></p>
              <p><span>测微器示数</span><strong>{diameterReading.text} mm</strong></p>
              <p><span>固定刻度</span><strong>{diameterReading.fixed.toFixed(1)} mm · 半线{diameterReading.halfLine ? '已露' : '未露'}</strong></p>
              <p><span>可动刻度</span><strong>{diameterReading.divisions.toFixed(1)} 格 × 0.01 mm</strong></p>
              <p><span>零点误差 / 接触</span><strong>{state.zero > 0 ? '+' : ''}{state.zero.toFixed(3)} mm · {isSeated(state) ? '已接触' : '未接触'}</strong></p>
            </>
          ) : state.stage === 'circuit' ? (
            <>
              <p><span>样品</span><strong>{state.wireName}</strong></p>
              <p><span>接入长度 l</span><strong>{state.lengthCm.toFixed(1)} cm</strong></p>
              <p><span>电压 U</span><strong>{state.voltmeterReading.text} V</strong></p>
              <p><span>电流 I</span><strong>{state.ammeterReading.text} A</strong></p>
              <p><span>电阻 R = U/I</span><strong>{measuredResistance === null ? '—' : measuredResistance.toFixed(2) + ' Ω'}</strong></p>
            </>
          ) : state.stage === 'analysis' ? (
            <>
              <p><span>直径测量</span><strong>{analysis.diameterCount}/3 处</strong></p>
              <p><span>{state.graph === 'UI' ? 'U–I 斜率 = R' : 'R–l 斜率 = ρ/S'}</span><strong>{fittedSlopeLabel}</strong></p>
              <p><span>电阻率 ρ</span><strong>{formatRho(analysis.rho)}</strong></p>
              {state.mystery && analysis.nearest ? <p><span>最接近的材料</span><strong>{analysis.nearest.name}</strong></p> : null}
              <p><span>拟合数据点</span><strong>{analysis.points.length}</strong></p>
            </>
          ) : (
            <>
              <p><span>研究元件</span><strong>{ELEMENTS[state.element].name}</strong></p>
              <p><span>电压 U</span><strong>{state.elementNow.U.toFixed(2)} V</strong></p>
              <p><span>电流 I</span><strong>{formatCurrent(state.elementNow.I)}</strong></p>
              <p><span>静态电阻 R = U/I</span><strong>{formatElementResistance(state.elementNow.R)} Ω</strong></p>
              {state.element === 'diode' && state.elementNow.U < 0 ? (
                <p><span>表盘状态</span><strong>反向漏电远低于 {ammeterSpec.division} A 最小分度</strong></p>
              ) : null}
              <p><span>切线斜率 dI/dU</span><strong>{state.elementNow.slope.toFixed(3)} A/V</strong></p>
            </>
          )}
        </div>
      }
      chart={diameterView ? (
        <MeasuringToolsChart tool="micrometer" reveal divisions={20} caliperX={0} micGap={state.gap} micZero={state.zero} click={0} />
      ) : state.stage === 'iv' ? (
        <ElementChart kind={state.element} voltage={state.voltage} showSecant={showSecant} showTangent={showTangent} />
      ) : (
        <ResistivityChart
          title={state.graph === 'UI' ? 'U–I 图像，斜率是电阻' : 'R–l 图像，斜率是 ρ/S'}
          points={analysis.points}
          slope={analysis.fit?.slope ?? null}
          intercept={analysis.fit && 'intercept' in analysis.fit ? analysis.fit.intercept : 0}
          xLabel={state.graph === 'UI' ? 'I / A' : 'l / m'}
          yLabel={state.graph === 'UI' ? 'U / V' : 'R / Ω'}
        />
      )}
      chartVisible={diameterView || state.stage === 'analysis' || ivMode}
      chartInitiallyCollapsed={diameterView}
      playbackActions={diameterView ? undefined : state.stage === 'circuit' || state.stage === 'analysis' ? [
        { key: 'power', label: state.closed ? '断开' : '闭合', onClick: state.toggleClosed },
        { key: 'reset', label: '重置', onClick: state.reset },
      ] : [{ key: 'reset', label: '重置', onClick: state.reset }]}
      viewport={
        <div ref={viewportRef} className='h-full w-full'>
        <InteractiveCanvas
          key={`${state.stage}-${state.view}`}
          camera={{ position, fov: limits.fov, near: limits.near, far: cameraFar }}
          adaptiveFraming={false}
          syncCamera
          screenOffset={view.screenOffset}
          controlsEnabled={!instrumentDragging}
          controls={{
            target: view.target,
            minDistance: limits.minDistance,
            maxDistance,
            minPolarAngle: limits.minPolarAngle,
            maxPolarAngle: limits.maxPolarAngle,
          }}
          frameloop={state.animating ? 'always' : 'demand'}
        >
          <ResistivityRig3D
            stage={state.stage}
            gap={state.gap}
            zero={state.zero}
            wireSize={sample.positions[state.position]}
            pose={pose}
            wires={wires}
            onMicGapChange={state.setGap}
            elementKind={state.element}
            elementPower={state.elementNow.P}
            elementVoltage={state.elementNow.U}
            ivMode={ivMode}
            ammeterRange={ammeterRange}
            voltmeterRange={voltmeterRange}
            ammeterDivision={ammeterSpec.division}
            voltmeterDivision={voltmeterSpec.division}
            onInstrumentDragChange={onInstrumentDragChange}
          />
        </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default ResistivityScene
