import { useRef } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { fitOrbitView, type Bounds3 } from '../../scene3d/orbitFraming'
import { useFittedOrbitCamera } from '../../scene3d/useFittedOrbitCamera'
import { MeterAssembly } from './MeterAssembly'
import { ReadingChart, RheostatChart, VoltAmmeterChart } from './MultimeterChart'
import { MultimeterControls } from './MultimeterControls'
import { voltAmmeter } from './model'
import { MultimeterReadings } from './MultimeterReadings'
import { METER_CAMERA, meterPose, meterView } from './pose'
import { useMultimeterSceneState } from './useMultimeterSceneState'
import './multimeter.css'

export function MultimeterScene() {
  const state = useMultimeterSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const baseView = meterView(state.view)
  const bounds: Bounds3 =
    state.view === 'focus'
      ? { min: [-8, 0, -10], max: [8, 20, 2] }
      : state.stage === 'convert'
        ? { min: [-13, 0, -8], max: [16, 20, 20] }
        : state.stage === 'rheostat'
          ? { min: [-18, 0, -8], max: [18, 18, 22] }
          : { min: [-22, 0, -8], max: [22, 20, 22] }
  // Fitted into the largest uncovered area once per stage and view; panels then only cover it.
  const camera = useFittedOrbitCamera(viewportRef, `${state.stage}-${state.view}`, METER_CAMERA, (area) =>
    fitOrbitView({
      ...area,
      bounds,
      anchor: baseView.target,
      azimuth: baseView.azimuth,
      elevation: baseView.elevation,
      fov: METER_CAMERA.fov,
      minDistance: METER_CAMERA.minDistance,
      margin: state.view === 'focus' ? 1.06 : 1.12,
    }),
  )
  const comparison = voltAmmeter({
    Rx: 10 ** state.lgRx,
    RA: state.ammeterResistance,
    RV: state.voltmeterResistance,
    E: 3,
    Rs: 10,
  })
  const selectedComparison = comparison[state.contactMethod]
  const activeRheostatOutput = state.rheostatOutput
  const secondaryFraction =
    state.stage === 'va' ? selectedComparison.I / 0.1 : state.stage === 'rheostat' ? activeRheostatOutput.I / 0.1 : 0.5
  const measurementTarget =
    state.stage === 'use' ? state.target : state.stage === 'va' || state.stage === 'rheostat' ? 'loopV' : 'none'
  const pose = meterPose({
    fraction: state.fraction,
    range: state.range,
    mechanicalSlider: state.mechanical,
    ohmSlider: state.ohmKnob,
    target: measurementTarget,
    swapped: state.swapped,
    contactMethod: state.contactMethod,
  })
  const dataOverlay = <MultimeterReadings state={state} comparison={comparison} />
  const chart =
    state.stage === 'va' ? (
      <VoltAmmeterChart
        lgRx={state.lgRx}
        ammeterResistance={state.ammeterResistance}
        voltmeterResistance={state.voltmeterResistance}
        method={state.contactMethod}
      />
    ) : state.stage === 'rheostat' ? (
      <RheostatChart
        slider={state.slider}
        load={state.loadResistance}
        rheostatResistance={state.rheostatResistance}
        mode={state.rheostatMode}
        closed={state.rheostatClosed}
      />
    ) : (
      <ReadingChart
        fraction={state.fraction}
        caption={state.stage === 'convert' ? '改装表头的偏转比例' : state.rangeLabel}
      />
    )
  const playbackActions =
    state.stage === 'use'
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
      playbackActions={playbackActions}
      viewport={
        <div ref={viewportRef} style={{ width: '100%', height: '100%' }}>
          <InteractiveCanvas {...camera.canvasProps} frameloop="demand">
            <MeterAssembly
              pose={pose}
              stage={state.stage}
              rheostatSlider={state.slider}
              rheostatMode={state.rheostatMode}
              rheostatClosed={state.rheostatClosed}
              rheostatCurrentFraction={secondaryFraction}
              rangeLabel={
                state.stage === 'convert'
                  ? state.convKind === 'V'
                    ? state.convRange.toFixed(1) + ' V'
                    : state.convRange.toFixed(2) + ' A'
                  : state.rangeLabel
              }
              convKind={state.convKind}
              conversionConnected={state.convResistance !== null}
              secondaryFraction={secondaryFraction}
            />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default MultimeterScene
