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
  sampleResolutionMax: number
  onSampleResolutionChange: (value: number) => void
  stats: EquipotentialStats
  positiveIsoValues: ReadonlyArray<number>
  negativeIsoValues: ReadonlyArray<number>
  activePreset: 'dipole' | 'quadrupole' | 'custom'
  maxCharges: number
  onSelectCustom: () => void
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
  sampleResolutionMax,
  onSampleResolutionChange,
  stats,
  positiveIsoValues,
  negativeIsoValues,
  activePreset,
  maxCharges,
  onSelectCustom,
}: EquipotentialControlsProps) {
  const selectedId = selectedChargeId ?? ''
  return (
    <div className="grid gap-[0.8rem]">
      <h2>电荷等势面控制</h2>

      <ControlSection title="场型与预设">
        <SegmentedControl
          options={[
            { key: 'dipole', label: '双极子基线' },
            { key: 'quadrupole', label: '四极子对比' },
            { key: 'custom', label: '自定义' },
          ]}
          value={activePreset}
          onChange={(key) => {
            if (key === 'dipole') onApplyDipolePreset()
            else if (key === 'quadrupole') onApplyQuadrupolePreset()
            else onSelectCustom()
          }}
        />
      </ControlSection>

      <SceneActions
        actions={[
          {
            key: 'add-positive',
            label: '添加 + 电荷',
            onClick: onAddPositiveCharge,
            disabled: charges.length >= maxCharges,
          },
          {
            key: 'add-negative',
            label: '添加 - 电荷',
            onClick: onAddNegativeCharge,
            disabled: charges.length >= maxCharges,
          },
          {
            key: 'delete-selected',
            label: '删除选中',
            onClick: onDeleteSelectedCharge,
            disabled: !selectedCharge,
          },
        ]}
      />

      <p className="text-xs leading-relaxed text-[var(--control-ink-muted)]">
        最多 12 个场源；红色 + / 蓝色 − 表示场源符号，红色曲面为正电势、蓝色曲面为负电势。
      </p>
      <p className="text-xs leading-relaxed text-[var(--control-ink-muted)]">
        模型 φ_rel = Σ qᵢ / √(rᵢ² + ε²)，q 为相对单位且未乘库仑常量 k，数值不是伏特。ε = 0.18 个模型坐标单位用于软化点电荷奇点。
        等势层从采样盒边界电势插值到内部极值，避免把开放边界误画成完整曲面；红/蓝球大小只编码相对电量。
      </p>

      <ControlSection title="选中电荷">
        <SelectField
          id="equipotential-selected"
          label="当前目标"
          value={selectedId}
          onChange={onSelectCharge}
          className="preset-select"
          options={charges.map((charge) => ({
            value: charge.id,
            label: `${charge.id} (${charge.magnitude.toFixed(1)} 相对单位)`,
          }))}
        />
      </ControlSection>

      {selectedCharge ? (
        <ControlSection title="编辑电荷参数">
          <RangeField
            id="equipotential-charge-magnitude"
            label="电量 q（相对值）"
            min={-20}
            max={20}
            step={0.5}
            value={selectedCharge.magnitude}
            onChange={(value) => onUpdateSelectedCharge({ magnitude: value })}
          />

          <RangeField
            id="equipotential-charge-x"
            label="位置 X"
            min={-3}
            max={3}
            step={0.1}
            value={selectedCharge.x}
            onChange={(value) => onUpdateSelectedCharge({ x: value })}
          />

          <RangeField
            id="equipotential-charge-y"
            label="位置 Y"
            min={-3}
            max={3}
            step={0.1}
            value={selectedCharge.y}
            onChange={(value) => onUpdateSelectedCharge({ y: value })}
          />

          <RangeField
            id="equipotential-charge-z"
            label="位置 Z"
            min={-3}
            max={3}
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
          label="空间采样密度"
          min={14}
          max={sampleResolutionMax}
          step={1}
          value={sampleResolution}
          showMinMax
          onChange={(value) => onSampleResolutionChange(Math.round(value))}
        />
      </ControlSection>

      <ControlSection title="数据">
        <DataReadout
          items={[
            { label: '正电势面层数', value: String(stats.positiveSurfaceCount) },
            { label: '负电势面层数', value: String(stats.negativeSurfaceCount) },
            { label: '网格相对电势范围 (max/min)', value: stats.maxPotential.toFixed(1) + ' / ' + stats.minPotential.toFixed(1) },
            { label: '正电势层值（相对）', value: positiveIsoValues.map((value) => '+' + value.toFixed(1)).join(' / ') || '无' },
            { label: '负电势层值（相对）', value: negativeIsoValues.map((value) => value.toFixed(1)).join(' / ') || '无' },
            { label: '曲面网格三角形', value: String(stats.positiveTriangleCount + stats.negativeTriangleCount) },
          ]}
        />
      </ControlSection>

    </div>
  )
}
