import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { orbitPosition } from '../measuring-tools/pose'
import { MeterAssembly } from './MeterAssembly'
import { ReadingChart, RheostatChart, VoltAmmeterChart } from './MultimeterChart'
import { MultimeterControls } from './MultimeterControls'
import { RANGE, rheostat, voltAmmeter } from './model'
import { METER_CAMERA, meterPose, meterView } from './pose'
import { useMultimeterSceneState } from './useMultimeterSceneState'
import './multimeter.css'

function formatReading(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return '—'
  if (unit === 'Ω' && value >= 1000) return `${(value / 1000).toFixed(2)} kΩ`
  if (unit === 'Ω') return `${value.toFixed(value < 10 ? 2 : 1)} Ω`
  return `${value.toFixed(2)} ${unit}`
}

export function MultimeterScene() {
  const state = useMultimeterSceneState()
  const view = meterView(state.view)
  const pose = meterPose({
    fraction: state.fraction,
    range: state.range,
    mechanicalSlider: state.mechanical,
    ohmSlider: state.ohmKnob,
    target: state.stage === 'use' ? state.target : 'none',
    swapped: state.swapped,
  })
  const comparison = voltAmmeter({ Rx: 10 ** state.lgRx, RA: state.ammeterResistance, RV: state.voltmeterResistance, E: 3, Rs: 10 })
  const slide = rheostat({ E: 3, r: 0.5, R0: state.rheostatResistance, Rx: state.loadResistance, s: state.slider })
  const warning = state.stage === 'use' ? state.reading.warning : ''

  return (
    <SceneLayout
      controls={<MultimeterControls state={state} />}
      dataOverlay={
        <div className="multimeter-telemetry scene-core-summary-stack">
          <p><span>挡位</span><strong>{state.rangeLabel}</strong></p>
          <p><span>指针</span><strong>{state.fraction.toFixed(3)}</strong></p>
          <p><span>读数</span><strong>{warning || (state.stage === 'use' ? formatReading(state.reading.truth, state.reading.unit) : state.stage === 'va' ? `外接 ${comparison.external.R.toFixed(1)} Ω` : state.stage === 'rheostat' ? `分压 ${slide.divider.U.toFixed(2)} V` : `${state.requiredResistance.toFixed(1)} Ω`)}</strong></p>
          <p><span>调零</span><strong>{state.mechanicalOk ? '机械已对准' : '机械未对准'} · {RANGE[state.range].kind === 'ohm' ? (state.ohmOk ? '欧姆已调零' : '欧姆未调零') : '非欧姆挡'}</strong></p>
          <p><span>表笔</span><strong>{state.swapped ? '红黑已对调' : '红笔接高电势'}</strong></p>
        </div>
      }
      chart={state.stage === 'va' ? (
        <VoltAmmeterChart lgRx={state.lgRx} ammeterResistance={state.ammeterResistance} voltmeterResistance={state.voltmeterResistance} />
      ) : state.stage === 'rheostat' ? (
        <RheostatChart slider={state.slider} load={state.loadResistance} rheostatResistance={state.rheostatResistance} />
      ) : (
        <ReadingChart fraction={state.fraction} caption={state.stage === 'convert' ? '表头偏转占满偏的比例' : state.rangeLabel} />
      )}
      chartVisible
      playbackActions={[
        { key: 'swap', label: state.swapped ? '表笔复位' : '对调表笔', onClick: state.toggleSwapped },
        { key: 'zero', label: '机械调零', onClick: state.zeroMechanical },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          key={state.view}
          camera={{ position: orbitPosition(view), fov: METER_CAMERA.fov, near: METER_CAMERA.near, far: METER_CAMERA.far }}
          adaptiveFraming={false}
          controls={{
            target: view.target,
            minDistance: METER_CAMERA.minDistance,
            maxDistance: METER_CAMERA.maxDistance,
            minPolarAngle: METER_CAMERA.minPolarAngle,
            maxPolarAngle: METER_CAMERA.maxPolarAngle,
          }}
          frameloop="demand"
        >
          <MeterAssembly pose={pose} />
        </InteractiveCanvas>
      }
    />
  )
}

export default MultimeterScene
