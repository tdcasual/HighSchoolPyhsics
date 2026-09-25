import { MeasuringToolsChart } from '../measuring-tools/MeasuringToolsChart'
import { cameraLimits, instrumentView, orbitPosition, type ViewPreset } from '../measuring-tools/pose'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CIRCUIT_CAMERA, circuitPose, circuitView } from './circuitPose'
import { ElementChart, ResistivityChart } from './ResistivityChart'
import { ResistivityControls } from './ResistivityControls'
import { ResistivityRig3D } from './ResistivityRig3D'
import { activeWire, analysisOf, wiresFor } from './state'
import { useResistivitySceneState } from './useResistivitySceneState'
import './resistivity.css'

function formatRho(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : `${value.toExponential(2)} Ω·m`
}

export function ResistivityScene() {
  const state = useResistivitySceneState()
  const sample = activeWire(state)
  const analysis = analysisOf(state)
  const diameterView = state.stage === 'diameter'
  const view = diameterView
    ? instrumentView({ tool: 'micrometer', mode: 'outer', preset: state.view, caliperX: 0, reading: state.gap + state.zero })
    : circuitView(state.view as ViewPreset)
  const limits = diameterView ? cameraLimits('micrometer') : CIRCUIT_CAMERA
  const pose = circuitPose({
    lengthCm: state.lengthCm,
    slider: state.slider,
    closed: state.closed && state.step >= 3,
    ammeterFraction: state.ammeterReading.fraction,
    voltmeterFraction: state.voltmeterReading.fraction,
    temperatureRise: state.reading.dT,
  })

  return (
    <SceneLayout
      controls={<ResistivityControls state={state} />}
      dataOverlay={
        <div className="resistivity-telemetry scene-core-summary-stack">
          <p><span>样品</span><strong>{state.wireName}</strong></p>
          <p><span>平均直径</span><strong>{state.meanDiameter === null ? '未测' : `${state.meanDiameter.toFixed(3)} mm`}</strong></p>
          <p><span>电压 U</span><strong>{state.stage === 'iv' ? `${state.elementNow.U.toFixed(2)} V` : `${state.voltmeterReading.text} V`}</strong></p>
          <p><span>电流 I</span><strong>{state.stage === 'iv' ? `${state.elementNow.I.toExponential(2)} A` : `${state.ammeterReading.text} A`}</strong></p>
          <p><span>电阻率 ρ</span><strong>{formatRho(analysis.rho)}</strong></p>
        </div>
      }
      chart={diameterView ? (
        <MeasuringToolsChart tool="micrometer" reveal divisions={20} caliperX={0} micGap={state.gap} micZero={state.zero} click={0} />
      ) : state.stage === 'iv' ? (
        <ElementChart kind={state.element} voltage={state.voltage} />
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
      chartVisible
      playbackActions={[
        { key: 'power', label: state.closed ? '断开' : '闭合', onClick: state.toggleClosed, disabled: state.stage === 'diameter' || state.stage === 'iv' },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          key={`${state.stage}-${state.view}`}
          camera={{ position: orbitPosition(view), fov: limits.fov, near: limits.near, far: limits.far }}
          adaptiveFraming={false}
          controls={{
            target: view.target,
            minDistance: limits.minDistance,
            maxDistance: limits.maxDistance,
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
            wires={wiresFor(state)}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default ResistivityScene
