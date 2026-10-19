import { ModelNote } from '../../ui/notes/ModelNote'
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
  loadResistanceOhm: number
  onLoadResistanceChange: (value: number) => void
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
  loadResistanceOhm,
  onLoadResistanceChange,
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
          label="载流子浓度 n/n₀"
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
          label="基准电导率 σ₀"
          unit="S/m"
          min={2}
          max={40}
          step={1}
          value={conductivitySPerM}
          onChange={onConductivityChange}
        />
        <RangeField
          id="mhd-load"
          label={<>负载电阻 R<sub>L</sub></>}
          unit="Ω"
          min={0.1}
          max={5}
          step={0.1}
          value={loadResistanceOhm}
          onChange={onLoadResistanceChange}
        />
      </ControlSection>
      <ModelNote>
        <p>ε = Bvd；A = 0.08 m²；R<sub>i</sub> = d/(σ<sub>eff</sub> A)，σ<sub>eff</sub> = σ₀·n/n₀</p>
        <p>I<sub>L</sub> = |ε|/(R<sub>i</sub> + R<sub>L</sub>)；U<sub>AB</sub> = −I<sub>L</sub> R<sub>L</sub>；P<sub>L</sub> = I<sub>L</sub>²R<sub>L</sub></p>
        <p>E<sub>ind</sub> = −v×B 向上，故上电极 A 为负，U<sub>AB</sub> 带负号。</p>
        <p>载流子偏转和结构尺寸为示意；流体动画速度随 v 滑杆联动。</p>
      </ModelNote>
    </div>
  )
}
