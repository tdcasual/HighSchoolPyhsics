import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SelectField } from '../../ui/controls/SelectField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
import { DataReadout } from '../../ui/controls/DataReadout'
import type { PresetKey } from './model'
import {
  ELECTROSTATIC_LAB_CHARGE_LIMIT,
  ELECTROSTATIC_LAB_MAX_CHARGES,
} from './useElectrostaticLabState'
import type { ElectrostaticLabState } from './useElectrostaticLabState'

const PRESET_OPTIONS: Array<{ key: PresetKey; label: string }> = [
  { key: 'single', label: '单点电荷' },
  { key: 'dipole', label: '电偶极子' },
  { key: 'same', label: '等量同号' },
  { key: 'opposite', label: '等量异号' },
  { key: 'three-linear', label: '三电荷线性' },
  { key: 'three-triangle', label: '三电荷三角' },
  { key: 'quadrupole', label: '电四极子' },
]

function formatNetCharge(netCharge: number): string {
  return `${netCharge >= 0 ? '+' : ''}${netCharge.toFixed(2)}`
}

type ElectrostaticLabControlsProps = {
  state: ElectrostaticLabState
}

export function ElectrostaticLabControls({ state }: ElectrostaticLabControlsProps) {
  return (
    <div className="grid gap-[0.8rem]">
      <h2>电势地形与电场线</h2>
      <p className="m-0 text-[var(--control-ink-muted)] text-[0.84rem] leading-[1.4]">
        本场景把平面电势 φ(x,z) 映射为高度，颜色和等势线表示电势值；高度经过平滑压缩，便于同屏观察。
        这是二维电势分布的三维图像，不是实际空间中的三维等势面。
      </p>
      <p className="m-0 text-[var(--control-ink-muted)] text-[0.84rem] leading-[1.4]">
        q、φ 和 E 使用相对单位，零电势取无穷远；模型采用 φ=Σqᵢ/√(rᵢ²+ε²)、ε=0.24，E=−∇φ。图高 h=0.62×6.5×tanh(φ/6.5) 只作压缩显示。红色为正、蓝色为负、灰色为零电荷。
      </p>

      <ControlSection title="课堂预设">
        <SegmentedControl
          columns={2}
          options={PRESET_OPTIONS}
          value={state.presetKey}
          onChange={(key) => state.applyPreset(key as PresetKey)}
        />
        {state.presetKey === 'custom' ? (
          <p className="m-0 text-[var(--control-ink-muted)] text-[0.82rem] leading-[1.35]" role="status">
            电荷参数已修改，当前为自定义组合；点击任一预设可恢复该方案。
          </p>
        ) : null}
      </ControlSection>

      <ControlSection title="显示模式">
        <SegmentedControl
          options={[
            { key: 'potential', label: '电势地形' },
            { key: 'field', label: '电场线' },
          ]}
          value={state.displayMode}
          onChange={(key) => state.setDisplayMode(key as 'potential' | 'field')}
        />
        <label className="flex items-center gap-[0.42rem] text-[var(--control-ink)] text-[0.88rem]">
          <input
            type="checkbox"
            checked={state.overlayFieldLines}
            onChange={(event) => state.setOverlayFieldLines(event.target.checked)}
          />
          势面叠加电场线
        </label>
        <p className="m-0 text-[var(--control-ink-muted)] text-[0.82rem] leading-[1.35]">
          箭头表示电场方向：离开正电荷、指向负电荷；仅有负电荷时从负电荷向外追踪并反向显示箭头。
        </p>
        <label className="flex items-center gap-[0.42rem] text-[var(--control-ink)] text-[0.88rem]">
          <input
            type="checkbox"
            checked={state.showContourLines}
            onChange={(event) => state.setShowContourLines(event.target.checked)}
          />
          显示等势线
        </label>
        <label className="flex items-center gap-[0.42rem] text-[var(--control-ink)] text-[0.88rem]">
          <input
            type="checkbox"
            checked={state.invertHeight}
            onChange={(event) => state.setInvertHeight(event.target.checked)}
          />
          翻转势面高度
        </label>
        <button
          className="touch-target border border-[var(--control-border)] rounded-[10px] bg-[var(--control-bg)] text-[var(--control-ink)] font-bold cursor-pointer"
          aria-pressed={state.advancedInteractionsEnabled}
          onClick={state.toggleAdvancedInteractions}
        >
          {state.advancedInteractionsEnabled ? '关闭进阶交互' : '开启进阶交互'}
        </button>
        {state.advancedInteractionsEnabled ? (
          <p className="m-0 text-[var(--control-ink-muted)] text-[0.84rem] leading-[1.35]">
            已启用：拖拽电荷移动，双击地面添加正电荷，按住 Shift 双击添加负电荷，右键删除；最多 {ELECTROSTATIC_LAB_MAX_CHARGES} 个电荷，位置限制在视图范围内。
          </p>
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
      </ControlSection>

      <SceneActions
        layout="grid-2"
        actions={[
          {
            key: 'add-positive',
            label: '添加 + 电荷',
            onClick: state.addPositiveCharge,
            disabled: state.charges.length >= ELECTROSTATIC_LAB_MAX_CHARGES,
          },
          {
            key: 'add-negative',
            label: '添加 - 电荷',
            onClick: state.addNegativeCharge,
            disabled: state.charges.length >= ELECTROSTATIC_LAB_MAX_CHARGES,
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

      <ControlSection title="电荷编辑">
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

        {state.selectedCharge ? (
          <>
            <RangeField
              id="electrostatic-lab-charge-magnitude"
              label="电荷量 q（相对）"
              min={-5}
              max={5}
              step={0.1}
              value={state.selectedCharge.magnitude}
              onChange={(value) => state.updateSelectedCharge({ magnitude: value })}
            />
            <RangeField
              id="electrostatic-lab-charge-x"
              label="位置 X"
              min={-ELECTROSTATIC_LAB_CHARGE_LIMIT}
              max={ELECTROSTATIC_LAB_CHARGE_LIMIT}
              step={0.1}
              value={state.selectedCharge.x}
              onChange={(value) => state.updateSelectedCharge({ x: value })}
            />
            <RangeField
              id="electrostatic-lab-charge-z"
              label="位置 Z"
              min={-ELECTROSTATIC_LAB_CHARGE_LIMIT}
              max={ELECTROSTATIC_LAB_CHARGE_LIMIT}
              step={0.1}
              value={state.selectedCharge.z}
              onChange={(value) => state.updateSelectedCharge({ z: value })}
            />
          </>
        ) : null}
      </ControlSection>

      <ControlSection title="数据">
        <DataReadout
          items={[
            {
              label: '电荷总数',
              value: `${state.charges.length}（+${state.chargeSummary.positiveCount} / -${state.chargeSummary.negativeCount}）`,
            },
            { label: '净电荷 qΣ', value: formatNetCharge(state.chargeSummary.netCharge) },
            {
              label: '选中电荷',
              value: state.selectedCharge
                ? `${state.selectedCharge.id} (${state.selectedCharge.x.toFixed(2)}, ${state.selectedCharge.z.toFixed(2)})`
                : '无',
            },
            {
              label: '势场范围 φ（相对）',
              value: `${state.terrain.stats.minPotential.toFixed(2)} ~ ${state.terrain.stats.maxPotential.toFixed(2)}`,
            },
            {
              label: '探针位置',
              value: state.probePoint
                ? `(${state.probePoint.x.toFixed(2)}, ${state.probePoint.z.toFixed(2)})`
                : '未放置',
            },
            {
              label: '探针电势 φ（相对）',
              value: state.probeReadout ? state.probeReadout.potential.toFixed(3) : '--',
            },
            {
              label: '探针场强 |E|（相对）',
              value: state.probeReadout ? state.probeReadout.field.magnitude.toFixed(3) : '--',
            },
          ]}
          separatorAfter={4}
        />
      </ControlSection>
    </div>
  )
}
