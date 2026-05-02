import { RangeField } from '../../ui/controls/RangeField'
import { ControlSection } from '../../ui/controls/ControlSection'

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
}: MhdControlsProps) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>磁流体发电机控制</h2>

      <ControlSection title="参数">
        <RangeField
          id="mhd-b"
          label="磁场 B"
          unit="T"
          min={0.2}
          max={3}
          step={0.1}
          value={magneticFieldT}
          onChange={onMagneticFieldChange}
        />

        <RangeField
          id="mhd-v"
          label="等离子体速度 v"
          unit="m/s"
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
          label="电极间距 d"
          unit="m"
          min={0.1}
          max={1}
          step={0.02}
          value={electrodeGapM}
          onChange={onElectrodeGapChange}
        />

        <RangeField
          id="mhd-sigma"
          label="电导率 σ"
          unit="S/m"
          min={2}
          max={40}
          step={1}
          value={conductivitySPerM}
          onChange={onConductivityChange}
        />
      </ControlSection>
    </div>
  )
}
