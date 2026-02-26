import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'

type MhdControlsProps = {
  magneticFieldT: number
  onMagneticFieldChange: (value: number) => void
  plasmaVelocityMps: number
  onPlasmaVelocityChange: (value: number) => void
  plasmaDensityRatio: number
  onPlasmaDensityChange: (value: number) => void
  electrodeGapM: number
  onElectrodeGapChange: (value: number) => void
  conductivitySPerM: number
  onConductivityChange: (value: number) => void
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  voltageDisplayV: number
}

export function MhdControls({
  magneticFieldT,
  onMagneticFieldChange,
  plasmaVelocityMps,
  onPlasmaVelocityChange,
  plasmaDensityRatio,
  onPlasmaDensityChange,
  electrodeGapM,
  onElectrodeGapChange,
  conductivitySPerM,
  onConductivityChange,
  running,
  onToggleRunning,
  onReset,
  voltageDisplayV,
}: MhdControlsProps) {
  return (
    <>
      <h2>磁流体发电机控制</h2>

      <RangeField
        id="mhd-b"
        label="磁场 B (T)"
        min={0.2}
        max={3}
        step={0.1}
        value={magneticFieldT}
        onChange={onMagneticFieldChange}
      />

      <RangeField
        id="mhd-v"
        label="等离子体速度 v (m/s)"
        min={200}
        max={4000}
        step={50}
        value={plasmaVelocityMps}
        onChange={onPlasmaVelocityChange}
      />

      <RangeField
        id="mhd-density"
        label="等离子浓度 n"
        min={0.2}
        max={2}
        step={0.05}
        value={plasmaDensityRatio}
        onChange={onPlasmaDensityChange}
      />

      <RangeField
        id="mhd-gap"
        label="电极间距 d (m)"
        min={0.1}
        max={1}
        step={0.02}
        value={electrodeGapM}
        onChange={onElectrodeGapChange}
      />

      <RangeField
        id="mhd-sigma"
        label="电导率 σ (S/m)"
        min={2}
        max={40}
        step={1}
        value={conductivitySPerM}
        onChange={onConductivityChange}
      />

      <SceneActions
        actions={[
          {
            key: 'toggle-running',
            label: running ? '暂停' : '播放',
            onClick: onToggleRunning,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: onReset,
          },
        ]}
      />

      <div className="mhd-voltage-card">
        <p className="mhd-voltage-label">两端电压 U_AB</p>
        <p className="mhd-voltage-value" data-testid="mhd-voltage-display">
          {voltageDisplayV.toFixed(1)} V
        </p>
      </div>

      <div className="structure-card">
        <h3>结构组成</h3>
        <ul>
          <li>N 极磁体</li>
          <li>S 极磁体</li>
          <li>电极 A / B</li>
          <li>等离子体通道</li>
          <li>外接负载与导线</li>
          <li>红色=正电荷, 蓝色=负电荷</li>
        </ul>
      </div>
    </>
  )
}
