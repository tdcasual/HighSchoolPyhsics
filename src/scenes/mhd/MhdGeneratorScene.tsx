import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MhdControls } from './MhdControls'
import { MhdGeneratorRig3D } from './MhdGeneratorRig3D'
import { useMhdSceneState } from './useMhdSceneState'
import './mhd.css'

export function MhdGeneratorScene() {
  const state = useMhdSceneState()

  return (
    <SceneLayout
      presentationSignals={['live-metric']}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>状态: {state.running ? '运行中' : '已暂停'}</p>
          <p>输出电压 U_AB: {state.voltageDisplayV.toFixed(1)} V</p>
          <p>B: {state.magneticFieldT.toFixed(1)} T · v: {state.plasmaVelocityMps.toFixed(0)} m/s</p>
        </div>
      }
      controls={
        <MhdControls
          magneticFieldT={state.magneticFieldT}
          onMagneticFieldChange={state.setMagneticFieldT}
          plasmaVelocityMps={state.plasmaVelocityMps}
          onPlasmaVelocityChange={state.setPlasmaVelocityMps}
          plasmaDensityRatio={state.plasmaDensityRatio}
          onPlasmaDensityChange={state.setPlasmaDensityRatio}
          electrodeGapM={state.electrodeGapM}
          onElectrodeGapChange={state.setElectrodeGapM}
          conductivitySPerM={state.conductivitySPerM}
          onConductivityChange={state.setConductivitySPerM}
          running={state.running}
          onToggleRunning={state.toggleRunning}
          onReset={state.reset}
          voltageDisplayV={state.voltageDisplayV}
        />
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 1.8, 6.8], fov: 39 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <MhdGeneratorRig3D
            phase={state.phase}
            running={state.running}
            chargeSeparation={state.chargeSeparation}
            driveRatio={state.driveRatio}
            plasmaDensityRatio={state.plasmaDensityRatio}
          />
        </InteractiveCanvas>
      }
    />
  )
}
