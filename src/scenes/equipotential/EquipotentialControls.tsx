import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SelectField } from '../../ui/controls/SelectField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import { DataReadout } from '../../ui/controls/DataReadout'
import type { EquipotentialCharge, EquipotentialStats } from './model'

type EquipotentialControlsProps = {
  charges: ReadonlyArray<EquipotentialCharge>
  selectedChargeId: string | null
  onSelectCharge: (chargeId: string) => void
  selectedCharge: EquipotentialCharge | null
  onUpdateSelectedCharge: (patch: Partial<Pick<EquipotentialCharge, 'x' | 'y' | 'z' | 'magnitude'>>) => void
  onAddPositiveCharge: () => void
  onAddNegativeCharge: () => void
  onDeleteSelectedCharge: () => void
  onApplyDipolePreset: () => void
  onApplyQuadrupolePreset: () => void
  shellCount: number
  onShellCountChange: (value: number) => void
  sampleResolution: number
  onSampleResolutionChange: (value: number) => void
  stats: EquipotentialStats
}

function formatPolarityLabel(polarity: EquipotentialStats['dominantPolarity']) {
  if (polarity === 'positive') {
    return '正势区更强'
  }
  if (polarity === 'negative') {
    return '负势区更强'
  }
  return '正负势区接近平衡'
}

export function EquipotentialControls({
  charges,
  selectedChargeId,
  onSelectCharge,
  selectedCharge,
  onUpdateSelectedCharge,
  onAddPositiveCharge,
  onAddNegativeCharge,
  onDeleteSelectedCharge,
  onApplyDipolePreset,
  onApplyQuadrupolePreset,
  shellCount,
  onShellCountChange,
  sampleResolution,
  onSampleResolutionChange,
  stats,
}: EquipotentialControlsProps) {
  const selectedId = selectedChargeId ?? ''
  return (
    <div className="grid gap-[0.8rem]">
      <h2>电荷等势面控制</h2>

      <ControlSection title="课堂预设">
        <SegmentedControl
          options={[
            { key: 'dipole', label: '双极子基线' },
            { key: 'quadrupole', label: '四极子对比' },
          ]}
          value=""
          onChange={(key) => {
            if (key === 'dipole') onApplyDipolePreset()
            else if (key === 'quadrupole') onApplyQuadrupolePreset()
          }}
        />
      </ControlSection>

      <SceneActions
        actions={[
          {
            key: 'add-positive',
            label: '添加 + 电荷',
            onClick: onAddPositiveCharge,
          },
          {
            key: 'add-negative',
            label: '添加 - 电荷',
            onClick: onAddNegativeCharge,
          },
          {
            key: 'delete-selected',
            label: '删除选中',
            onClick: onDeleteSelectedCharge,
            disabled: !selectedCharge,
          },
        ]}
      />

      <ControlSection title="选中电荷">
        <SelectField
          id="equipotential-selected"
          label="当前目标"
          value={selectedId}
          onChange={onSelectCharge}
          className="preset-select"
          options={charges.map((charge) => ({
            value: charge.id,
            label: `${charge.id} (${charge.magnitude.toFixed(1)} q)`,
          }))}
        />
      </ControlSection>

      {selectedCharge ? (
        <ControlSection title="编辑电荷参数">
          <RangeField
            id="equipotential-charge-magnitude"
            label="电量 q"
            min={-20}
            max={20}
            step={0.5}
            value={selectedCharge.magnitude}
            onChange={(value) => onUpdateSelectedCharge({ magnitude: value })}
          />

          <RangeField
            id="equipotential-charge-x"
            label="位置 X"
            min={-4.5}
            max={4.5}
            step={0.1}
            value={selectedCharge.x}
            onChange={(value) => onUpdateSelectedCharge({ x: value })}
          />

          <RangeField
            id="equipotential-charge-y"
            label="位置 Y"
            min={-3.5}
            max={3.5}
            step={0.1}
            value={selectedCharge.y}
            onChange={(value) => onUpdateSelectedCharge({ y: value })}
          />

          <RangeField
            id="equipotential-charge-z"
            label="位置 Z"
            min={-4.5}
            max={4.5}
            step={0.1}
            value={selectedCharge.z}
            onChange={(value) => onUpdateSelectedCharge({ z: value })}
          />
        </ControlSection>
      ) : null}

      <ControlSection title="等势采样参数">
        <RangeField
          id="equipotential-shell-count"
          label="等势层数"
          min={2}
          max={6}
          step={1}
          value={shellCount}
          onChange={(value) => onShellCountChange(Math.round(value))}
        />

        <RangeField
          id="equipotential-sample-resolution"
          label="采样密度"
          min={14}
          max={26}
          step={1}
          value={sampleResolution}
          onChange={(value) => onSampleResolutionChange(Math.round(value))}
        />
      </ControlSection>

      <ControlSection title="数据">
        <DataReadout
          items={[
            { label: '正势面点数', value: String(stats.positivePointCount) },
            { label: '负势面点数', value: String(stats.negativePointCount) },
            { label: '主导势区', value: formatPolarityLabel(stats.dominantPolarity) },
          ]}
        />
      </ControlSection>

    </div>
  )
}
