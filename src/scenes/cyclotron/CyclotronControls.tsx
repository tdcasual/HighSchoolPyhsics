import { RangeField } from '../../ui/controls/RangeField'
import type { CyclotronEnergyMode } from './trace'

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
    <>
      <h2>回旋加速器控制</h2>

      <RangeField
        id="cyc-b"
        label="磁场 B (T)"
        min={0.2}
        max={3}
        step={0.1}
        value={magneticFieldT}
        onChange={onMagneticFieldChange}
      />

      <RangeField
        id="cyc-e"
        label="缝隙电场 E (V/m)"
        min={1e4}
        max={2e5}
        step={2000}
        value={electricFieldVPerM}
        onChange={onElectricFieldChange}
      />

      <RangeField
        id="cyc-gap"
        label="加速缝隙半宽 Δx (mm)"
        min={0.02}
        max={0.12}
        step={0.005}
        value={gapHalfWidthMm}
        onChange={onGapHalfWidthChange}
      />

      <div className="cyclotron-mode-switch">
        <button
          className={`touch-target ${energyMode === 'ignore-acceleration-time' ? 'active' : ''}`.trim()}
          aria-pressed={energyMode === 'ignore-acceleration-time'}
          onClick={() => onEnergyModeChange('ignore-acceleration-time')}
        >
          忽略加速时间
        </button>
        <button
          className={`touch-target ${energyMode === 'include-acceleration-time' ? 'active' : ''}`.trim()}
          aria-pressed={energyMode === 'include-acceleration-time'}
          onClick={() => onEnergyModeChange('include-acceleration-time')}
        >
          考虑加速时间
        </button>
      </div>
    </>
  )
}
