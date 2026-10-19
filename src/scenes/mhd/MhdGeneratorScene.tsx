import { Answer } from '../../ui/notes/Answer'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MhdControls } from './MhdControls'
import { MhdGeneratorRig3D } from './MhdGeneratorRig3D'
import { useMhdSceneState } from './useMhdSceneState'

function formatQuantity(value: number, unit: string): string {
  const magnitude = Math.abs(value)
  if (magnitude >= 1000000) return (value / 1000000).toFixed(2) + ' M' + unit
  if (magnitude >= 1000) return (value / 1000).toFixed(2) + ' k' + unit
  return value.toFixed(1) + ' ' + unit
}

function formatSignedVoltage(value: number): string {
  return (value < 0 ? '−' : '+') + formatQuantity(Math.abs(value), 'V')
}

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
          loadResistanceOhm={state.loadResistanceOhm}
          onLoadResistanceChange={state.setLoadResistanceOhm}
        />
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [-6.65, 1.8, -2.43], fov: 36 }}
          controls={{ target: [0.2, 0, 0], minDistance: 4.8, maxDistance: 13, maxPolarAngle: Math.PI * 0.82 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <MhdGeneratorRig3D
            running={state.running}
            chargeSeparation={state.chargeSeparation}
            driveRatio={state.driveRatio}
            plasmaDensityRatio={state.plasmaDensityRatio}
            electrodeGapM={state.electrodeGapM}
            plasmaVelocityMps={state.plasmaVelocityMps}
          />
        </InteractiveCanvas>
      }
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>已知 B · v · d</span>
            <strong>{state.magneticFieldT.toFixed(1)} T · {state.plasmaVelocityMps.toFixed(0)} m/s · {state.electrodeGapM.toFixed(2)} m</strong>
          </p>
          <p>
            <span>开路电动势 |ε|</span>
            <strong><Answer>{formatQuantity(Math.abs(state.readings.openCircuitVoltageV), 'V')}</Answer></strong>
          </p>
          <p>
            <span>负载端电压 U_AB</span>
            <strong data-testid="mhd-voltage-display"><Answer>{formatSignedVoltage(state.readings.outputVoltageV)}</Answer></strong>
          </p>
          <p>
            <span>负载电流 I_L</span>
            <strong><Answer>{formatQuantity(state.readings.outputCurrentA, 'A')}</Answer></strong>
          </p>
          <p>
            <span>负载功率 P_L</span>
            <strong><Answer>{formatQuantity(state.readings.outputPowerW, 'W')}</Answer></strong>
          </p>
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

export default MhdGeneratorScene
