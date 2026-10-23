import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
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
        <FittedCanvas
          shot={{ from: [-6.65, 1.8, -2.43], to: [0.2, 0, 0] }}
          fov={36}
          minDistance={4.8}
          maxDistance={13}
          maxPolarAngle={Math.PI * 0.82}
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
        </FittedCanvas>
      }
      dataOverlay={
        <DataRows
          rows={[
            {
              label: '已知 B · v · d',
              value: (
                <>
                  {state.magneticFieldT.toFixed(1)} T · {state.plasmaVelocityMps.toFixed(0)} m/s ·{' '}
                  {state.electrodeGapM.toFixed(2)} m
                </>
              ),
            },
            {
              label: '开路电动势 |ε|',
              value: formatQuantity(Math.abs(state.readings.openCircuitVoltageV), 'V'),
              answer: true,
            },
            {
              label: (
                <>
                  负载端电压 U<sub>AB</sub>
                </>
              ),
              value: formatSignedVoltage(state.readings.outputVoltageV),
              answer: true,
              testId: 'mhd-voltage-display',
            },
            {
              label: (
                <>
                  负载电流 I<sub>L</sub>
                </>
              ),
              value: formatQuantity(state.readings.outputCurrentA, 'A'),
              answer: true,
            },
            {
              label: (
                <>
                  负载功率 P<sub>L</sub>
                </>
              ),
              value: formatQuantity(state.readings.outputPowerW, 'W'),
              answer: true,
            },
          ]}
        />
      }
      playbackActions={clockActions({ running: state.running, toggle: state.toggleRunning }, { onReset: state.reset })}
    />
  )
}

export default MhdGeneratorScene
