import { DataRows } from '../../ui/panels/DataRows'
import { useMemo, useRef, useState } from 'react'
import { MicrometerFigure } from '../../instruments/measuring/ReadingFigures'
import { fitOrbitView } from '../../scene3d/orbitFraming'
import { useFittedOrbitCamera } from '../../scene3d/useFittedOrbitCamera'
import { cameraLimits, instrumentView, type ViewPreset } from '../../instruments/measuring/pose'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CIRCUIT_CAMERA, circuitPose, circuitView, circuitWires } from './circuitPose'
import { ElementChart, ResistivityChart } from './ResistivityChart'
import { formatCurrent, formatElementResistance, formatRho } from './format'
import { ResistivityControls } from './ResistivityControls'
import { ResistivityRig3D } from './ResistivityRig3D'
import { activeWire, analysisOf, indicatedGap, isSeated } from './state'
import { ELEMENTS, METERS } from './model'
import { micrometerReading } from '../../instruments/measuring/model'
import { useResistivitySceneState } from './useResistivitySceneState'
import '../../instruments/measuring/measuring.css'
import './resistivity.css'

export function ResistivityScene() {
  const state = useResistivitySceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const [showSecant, setShowSecant] = useState(true)
  const [showTangent, setShowTangent] = useState(false)
  const sample = activeWire(state)
  const analysis = analysisOf(state)
  const diameterView = state.stage === 'diameter'
  const diameterReading = micrometerReading(indicatedGap(state))
  const limits = diameterView ? cameraLimits('micrometer') : CIRCUIT_CAMERA
  const ivMode = state.stage === 'iv'
  // Fitted into the largest uncovered area once per stage and view; panels then only cover it.
  const camera = useFittedOrbitCamera(viewportRef, `${state.stage}-${state.view}`, limits, (area) => {
    if (diameterView) {
      return instrumentView({ ...area, tool: 'micrometer', mode: 'outer', preset: state.view, caliperX: 0, reading: state.gap + state.zero })
    }
    const base = circuitView(state.view as ViewPreset)
    return fitOrbitView({
      ...area,
      bounds: { min: [-38, -1, -20], max: [33, ivMode ? 12 : 15, 18] },
      anchor: base.target,
      azimuth: base.azimuth,
      elevation: base.elevation,
      fov: limits.fov,
      minDistance: base.radius,
      margin: 1.12,
    })
  })
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
        <DataRows
        className="resistivity-telemetry"
        rows={diameterView
          ? [
            { label: '样品 / 位置', value: <>{state.wireName} · {state.position + 1}</> },
            { label: '测微器示数', value: <>{diameterReading.text} mm</>, answer: true },
            { label: '固定刻度', value: <>{diameterReading.fixed.toFixed(1)} mm · 半线{diameterReading.halfLine ? '已露' : '未露'}</>, answer: true },
            { label: '可动刻度', value: <>{diameterReading.divisions.toFixed(1)} 格 × 0.01 mm</>, answer: true },
            { label: '零点误差 / 接触', value: <>{state.zero > 0 ? '+' : ''}{state.zero.toFixed(3)} mm · {isSeated(state) ? '已接触' : '未接触'}</> },
          ]
          : state.stage === 'circuit'
          ? [
            { label: '样品', value: state.wireName },
            { label: '接入长度 l', value: <>{state.lengthCm.toFixed(1)} cm</> },
            { label: '电压 U', value: <>{state.voltmeterReading.text} V</> },
            { label: '电流 I', value: <>{state.ammeterReading.text} A</> },
            { label: '电阻 R = U/I', value: measuredResistance === null ? '—' : measuredResistance.toFixed(2) + ' Ω' },
          ]
          : state.stage === 'analysis'
          ? [
            { label: '直径测量', value: <>{analysis.diameterCount}/3 处</> },
            { label: state.graph === 'UI' ? 'U–I 斜率 = R' : 'R–l 斜率 = ρ/S', value: fittedSlopeLabel },
            { label: '电阻率 ρ', value: formatRho(analysis.rho) },
            { label: '最接近的材料', value: analysis.nearest?.name, when: Boolean(state.mystery && analysis.nearest) },
            { label: '拟合数据点', value: analysis.points.length },
          ]
          : [
            { label: '研究元件', value: ELEMENTS[state.element].name },
            { label: '电压 U', value: <>{state.elementNow.U.toFixed(2)} V</> },
            { label: '电流 I', value: formatCurrent(state.elementNow.I) },
            { label: '静态电阻 R = U/I', value: <>{formatElementResistance(state.elementNow.R)} Ω</> },
            { label: '表盘状态', value: <>反向漏电远低于 {ammeterSpec.division} A 最小分度</>, when: Boolean(state.element === 'diode' && state.elementNow.U < 0) },
            { label: '切线斜率 dI/dU', value: <>{state.elementNow.slope.toFixed(3)} A/V</> },
          ]}
      />
      }
      chart={diameterView ? (
        <MicrometerFigure reveal reading={state.gap + state.zero} zero={state.zero} click={0} />
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
          {...camera.canvasProps}
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
            onInstrumentDragChange={camera.onInstrumentDragChange}
          />
        </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default ResistivityScene
