import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MhdControls } from './MhdControls'
import { MhdGeneratorRig3D } from './MhdGeneratorRig3D'
import { useMhdSceneState } from './useMhdSceneState'
export function MhdGeneratorScene() {
  const state = useMhdSceneState()

  return (
    <SceneLayout
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
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>状态: {state.running ? '运行中' : '已暂停'}</p>
          <p><span>输出电压 U_AB</span><strong data-testid="mhd-voltage-display">{state.voltageDisplayV.toFixed(1)} V</strong></p>
          <p><span>B</span><strong>{state.magneticFieldT.toFixed(1)} T</strong></p>
          <p><span>v</span><strong>{state.plasmaVelocityMps.toFixed(0)} m/s</strong></p>
        </div>
      }
      playbackActions={[
        {
          key: 'toggle-running',
          label: state.running ? '暂停' : '播放',
          onClick: state.toggleRunning,
        },
        {
          key: 'reset',
          label: '重置',
          onClick: state.reset,
        },
      ]}
    />
  )
}
