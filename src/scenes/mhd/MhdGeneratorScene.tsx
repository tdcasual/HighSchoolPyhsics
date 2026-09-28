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
          <p>状态: {state.running ? '运行中' : '已暂停'}</p>
          <p>
            <span>开路电动势 |ε|</span>
            <strong>{formatQuantity(Math.abs(state.readings.openCircuitVoltageV), 'V')}</strong>
          </p>
          <p>
            <span>负载端电压 U_AB</span>
            <strong data-testid="mhd-voltage-display">{formatSignedVoltage(state.readings.outputVoltageV)}</strong>
          </p>
          <p>
            <span>负载电流 I_L</span>
            <strong>{formatQuantity(state.readings.outputCurrentA, 'A')}</strong>
          </p>
          <p>
            <span>负载功率 P_L</span>
            <strong>{formatQuantity(state.readings.outputPowerW, 'W')}</strong>
          </p>
          <p>
            <span>内阻 R_i</span>
            <strong>{state.readings.internalResistanceOhm.toFixed(2)} Ω</strong>
          </p>
          <p>
            <span>B / v</span>
            <strong>{state.magneticFieldT.toFixed(1)} T / {state.plasmaVelocityMps.toFixed(0)} m/s</strong>
          </p>
          <p>
            <span>间距 d / 负载 R_L</span>
            <strong>{state.electrodeGapM.toFixed(2)} m / {state.loadResistanceOhm.toFixed(1)} Ω</strong>
          </p>
          <small>ε = Bvd；A = 0.08 m²；R_i = d/(σ_eff A)，σ_eff = σ₀·n/n₀</small>
          <small>I_L = |ε|/(R_i + R_L)；U_AB = −I_LR_L；P_L = I_L²R_L</small>
          <small>E_ind = −v×B 向上，故上电极 A 为负，U_AB 带负号。</small>
          <small>载流子偏转和结构尺寸为示意；流体动画速度随 v 滑杆联动。</small>
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
      auxiliaryPanelPlacement="after-sidebar"
      dataInitiallyCollapsed
      playbackInitiallyCollapsed
    />
  )
}

export default MhdGeneratorScene
