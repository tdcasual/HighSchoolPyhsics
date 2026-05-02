import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import type { CyclotronEnergyMode } from './trace'

const energyModeOptions = [
  { key: 'ignore-acceleration-time', label: '忽略加速时间' },
  { key: 'include-acceleration-time', label: '考虑加速时间' },
]

type CyclotronControlsProps = {
  magneticFieldT: number
  onMagneticFieldChange: (value: number) => void
  electricFieldVPerM: number
  onElectricFieldChange: (value: number) => void
  gapHalfWidthMm: number
  onGapHalfWidthChange: (value: number) => void
  energyMode: CyclotronEnergyMode
  onEnergyModeChange: (value: CyclotronEnergyMode) => void
}

export function CyclotronControls({
  magneticFieldT,
  onMagneticFieldChange,
  electricFieldVPerM,
  onElectricFieldChange,
  gapHalfWidthMm,
  onGapHalfWidthChange,
  energyMode,
  onEnergyModeChange,
}: CyclotronControlsProps) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>回旋加速器控制</h2>

      <ControlSection title="参数">
        <RangeField
          id="cyc-b"
          label="磁场 B"
          unit="T"
          min={0.2}
          max={3}
          step={0.1}
          value={magneticFieldT}
          onChange={onMagneticFieldChange}
        />

        <RangeField
          id="cyc-e"
          label="缝隙电场 E"
          unit="V/m"
          min={1e4}
          max={2e5}
          step={2000}
          value={electricFieldVPerM}
          onChange={onElectricFieldChange}
        />

        <RangeField
          id="cyc-gap"
          label="加速缝隙半宽 Δx"
          unit="mm"
          min={0.02}
          max={0.12}
          step={0.005}
          value={gapHalfWidthMm}
          onChange={onGapHalfWidthChange}
        />
      </ControlSection>

      <ControlSection title="能量模式">
        <SegmentedControl
          options={energyModeOptions}
          value={energyMode}
          onChange={(key) => onEnergyModeChange(key as CyclotronEnergyMode)}
        />
      </ControlSection>
    </div>
  )
}
