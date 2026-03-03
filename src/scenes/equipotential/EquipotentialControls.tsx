import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
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
    <>
      <h2>电荷等势面控制</h2>

      <div className="subsection">
        <h3>课堂预设</h3>
        <div className="equipotential-preset-grid">
          <button className="touch-target equipotential-preset-btn" onClick={onApplyDipolePreset}>
            双极子基线
          </button>
          <button className="touch-target equipotential-preset-btn" onClick={onApplyQuadrupolePreset}>
            四极子对比
          </button>
        </div>
      </div>

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

      <div className="subsection">
        <h3>选中电荷</h3>
        <label htmlFor="equipotential-selected">当前目标</label>
        <select
          id="equipotential-selected"
          className="preset-select"
          value={selectedId}
          onChange={(event) => onSelectCharge(event.target.value)}
        >
          {charges.map((charge) => (
            <option key={charge.id} value={charge.id}>
              {charge.id} ({charge.magnitude.toFixed(1)} q)
            </option>
          ))}
        </select>
      </div>

      {selectedCharge ? (
        <>
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
        </>
      ) : null}

      <div className="subsection">
        <h3>等势采样参数</h3>

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
      </div>

      <div className="equipotential-readout" data-presentation-signal="chart live-metric">
        <p>正势面点数: {stats.positivePointCount}</p>
        <p>负势面点数: {stats.negativePointCount}</p>
        <p>主导势区: {formatPolarityLabel(stats.dominantPolarity)}</p>
      </div>

      <div className="structure-card">
        <h3>演示要点</h3>
        <ul>
          <li>同号电荷周围等势层向外扩展，异号电荷之间出现势面过渡带。</li>
          <li>调节单个电荷的 q 与空间位置，可观察等势壳层重构过程。</li>
          <li>课堂建议：先用双极子讲“正负势面”，再切到四极子讲叠加效应。</li>
        </ul>
      </div>
    </>
  )
}
