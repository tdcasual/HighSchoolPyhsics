import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SelectField } from '../../ui/controls/SelectField'
import type { PresetKey } from './model'
import type { ElectrostaticLabState } from './useElectrostaticLabState'

const PRESET_OPTIONS: Array<{ value: PresetKey; label: string }> = [
  { value: 'single', label: '单点电荷' },
  { value: 'dipole', label: '电偶极子' },
  { value: 'same', label: '等量同号' },
  { value: 'opposite', label: '等量异号' },
  { value: 'three-linear', label: '三电荷线性' },
  { value: 'three-triangle', label: '三电荷三角' },
  { value: 'quadrupole', label: '电四极子' },
]

function formatNetCharge(netCharge: number): string {
  return `${netCharge >= 0 ? '+' : ''}${netCharge.toFixed(2)}`
}

type ElectrostaticLabControlsProps = {
  state: ElectrostaticLabState
}

export function ElectrostaticLabControls({ state }: ElectrostaticLabControlsProps) {
  return (
    <>
      <h2>3D等势面实验台控制</h2>

      <div className="subsection">
        <h3>课堂预设</h3>
        <div className="electrostatic-lab-preset-grid">
          {PRESET_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`touch-target electrostatic-lab-preset-btn ${state.presetKey === option.value ? 'active' : ''}`.trim()}
              aria-pressed={state.presetKey === option.value}
              onClick={() => state.applyPreset(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="electrostatic-lab-mode-card">
        <p>显示模式: {state.modeLabel}</p>
        <div className="electrostatic-lab-mode-row">
          <button
            className={`touch-target electrostatic-lab-mode-btn ${state.displayMode === 'potential' ? 'active' : ''}`.trim()}
            aria-pressed={state.displayMode === 'potential'}
            onClick={() => state.setDisplayMode('potential')}
          >
            电势地形
          </button>
          <button
            className={`touch-target electrostatic-lab-mode-btn ${state.displayMode === 'field' ? 'active' : ''}`.trim()}
            aria-pressed={state.displayMode === 'field'}
            onClick={() => state.setDisplayMode('field')}
          >
            电场线
          </button>
        </div>
        <label className="electrostatic-lab-checkline">
          <input
            type="checkbox"
            checked={state.overlayFieldLines}
            onChange={(event) => state.setOverlayFieldLines(event.target.checked)}
          />
          势面叠加电场线
        </label>
        <label className="electrostatic-lab-checkline">
          <input
            type="checkbox"
            checked={state.showContourLines}
            onChange={(event) => state.setShowContourLines(event.target.checked)}
          />
          显示等势线
        </label>
        <label className="electrostatic-lab-checkline">
          <input
            type="checkbox"
            checked={state.invertHeight}
            onChange={(event) => state.setInvertHeight(event.target.checked)}
          />
          翻转势面高度
        </label>
        <button
          className="touch-target electrostatic-lab-advanced-toggle"
          aria-pressed={state.advancedInteractionsEnabled}
          onClick={state.toggleAdvancedInteractions}
        >
          {state.advancedInteractionsEnabled ? '关闭进阶交互' : '开启进阶交互'}
        </button>
        {state.advancedInteractionsEnabled ? (
          <p className="electrostatic-lab-advanced-hint">
            已启用：可在视图中拖拽电荷移动、双击地面添加电荷、右键点击电荷删除。
          </p>
        ) : null}
      </div>

      <SceneActions
        actions={[
          {
            key: 'add-positive',
            label: '添加 + 电荷',
            onClick: state.addPositiveCharge,
          },
          {
            key: 'add-negative',
            label: '添加 - 电荷',
            onClick: state.addNegativeCharge,
          },
          {
            key: 'delete-selected',
            label: '删除选中',
            onClick: state.deleteSelectedCharge,
            disabled: !state.selectedCharge,
          },
          {
            key: 'toggle-probe',
            label: state.probeMode ? '关闭探针模式' : '开启探针模式',
            onClick: state.toggleProbeMode,
          },
        ]}
      />

      <div className="subsection">
        <h3>电荷编辑</h3>
        <SelectField
          id="electrostatic-lab-selected-charge"
          label="当前目标"
          value={state.selectedChargeId ?? ''}
          onChange={(value) => state.selectCharge(value)}
          className="preset-select"
          options={state.charges.map((charge) => ({
            value: charge.id,
            label: `${charge.id} (${charge.magnitude.toFixed(1)} q)`,
          }))}
        />
      </div>

      {state.selectedCharge ? (
        <>
          <RangeField
            id="electrostatic-lab-charge-magnitude"
            label="电荷量 q"
            min={-5}
            max={5}
            step={0.1}
            value={state.selectedCharge.magnitude}
            onChange={(value) => state.updateSelectedCharge({ magnitude: value })}
          />
          <RangeField
            id="electrostatic-lab-charge-x"
            label="位置 X"
            min={-6}
            max={6}
            step={0.1}
            value={state.selectedCharge.x}
            onChange={(value) => state.updateSelectedCharge({ x: value })}
          />
          <RangeField
            id="electrostatic-lab-charge-z"
            label="位置 Z"
            min={-6}
            max={6}
            step={0.1}
            value={state.selectedCharge.z}
            onChange={(value) => state.updateSelectedCharge({ z: value })}
          />
        </>
      ) : null}

      <RangeField
        id="electrostatic-lab-resolution"
        label="地形分辨率"
        min={18}
        max={44}
        step={1}
        value={state.resolution}
        onChange={state.setResolution}
      />

      <div className="electrostatic-lab-readout">
        <p>
          电荷总数: {state.charges.length}（+{state.chargeSummary.positiveCount} / -
          {state.chargeSummary.negativeCount}）
        </p>
        <p>净电荷: {formatNetCharge(state.chargeSummary.netCharge)}</p>
        <p>
          选中电荷:{' '}
          {state.selectedCharge
            ? `${state.selectedCharge.id} (${state.selectedCharge.x.toFixed(2)}, ${state.selectedCharge.z.toFixed(2)})`
            : '无'}
        </p>
        <p>
          势场范围: {state.terrain.stats.minPotential.toFixed(2)} ~ {state.terrain.stats.maxPotential.toFixed(2)}
        </p>
        <p>
          探针位置:{' '}
          {state.probePoint ? `(${state.probePoint.x.toFixed(2)}, ${state.probePoint.z.toFixed(2)})` : '未放置'}
        </p>
        <p>探针电势: {state.probeReadout ? `${state.probeReadout.potential.toFixed(3)} V` : '--'}</p>
        <p>探针场强: {state.probeReadout ? `${state.probeReadout.field.magnitude.toFixed(3)} N/C` : '--'}</p>
      </div>

      <div className="structure-card">
        <h3>演示要点</h3>
        <ul>
          <li>先切"电势地形"观察正负电势在空间中的高低分区，再切"电场线"观察方向性。</li>
          <li>更换预设可快速演示单电荷、偶极子、四极子等典型模型的场分布差异。</li>
          <li>开启探针模式并点击地面任意点，可对比电势数值与场强大小。</li>
        </ul>
      </div>
    </>
  )
}
