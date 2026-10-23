import { ModelNote } from '../../ui/notes/ModelNote'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import type { CyclotronEnergyMode } from './trace'

const energyModeOptions = [
  { key: 'ignore-acceleration-time', label: '理想台阶' },
  { key: 'include-acceleration-time', label: '仿真（含加速时间）' },
]

type CyclotronControlsProps = {
  magneticFieldT: number
  onMagneticFieldChange: (value: number) => void
  gapVoltageKv: number
  onGapVoltageChange: (value: number) => void
  gapWidthCm: number
  onGapWidthChange: (value: number) => void
  energyMode: CyclotronEnergyMode
  onEnergyModeChange: (value: CyclotronEnergyMode) => void
}

export function CyclotronControls({
  magneticFieldT,
  onMagneticFieldChange,
  gapVoltageKv,
  onGapVoltageChange,
  gapWidthCm,
  onGapWidthChange,
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
          min={0.5}
          max={1.5}
          step={0.1}
          value={magneticFieldT}
          onChange={onMagneticFieldChange}
        />

        <RangeField
          id="cyc-u"
          label="加速电压峰值 U"
          unit="kV"
          min={20}
          max={300}
          step={10}
          value={gapVoltageKv}
          onChange={onGapVoltageChange}
        />

        <RangeField
          id="cyc-gap"
          label="D 形盒缝隙宽度 d"
          unit="cm"
          min={1}
          max={4}
          step={0.5}
          value={gapWidthCm}
          onChange={onGapWidthChange}
        />
      </ControlSection>

      <ControlSection title="Ek-t 曲线">
        <SegmentedControl
          options={energyModeOptions}
          value={energyMode}
          onChange={(key) => onEnergyModeChange(key as CyclotronEnergyMode)}
        />
        <ModelNote>
          <p className="text-xs leading-5 text-slate-500">
            「仿真」画出粒子仿真得到的动能：每次穿过缝隙的几纳秒内逐渐增加，且因交变电压已偏离峰值，每次略小于
            qU。「理想台阶」是教材的简化：每半个周期瞬间增加 qU。
          </p>
        </ModelNote>
      </ControlSection>
    </div>
  )
}
