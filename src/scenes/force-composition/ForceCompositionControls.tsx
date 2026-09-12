import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import type { ForceCompositionSceneState } from './useForceCompositionSceneState'

type Props = { state: ForceCompositionSceneState }
const modeOptions = [{ key: 'synthesis', label: '合成法则' }, { key: 'range', label: '合力范围' }, { key: 'orthogonal', label: '正交分解' }, { key: 'effect', label: '按效果分解' }]

export function ForceCompositionControls({ state }: Props) {
  return <div className="force-composition-controls grid gap-[0.8rem] content-start">
    <div><h2>力的合成与分解</h2><p className="force-composition-subtitle">高中物理数字化交互课件 · 拖拽矢量端点或调节参数</p></div>
    <SegmentedControl options={modeOptions} value={state.mode} onChange={(value) => state.setMode(value as typeof state.mode)} />
    {state.mode === 'synthesis' && <ControlSection title="法则切换"><SegmentedControl options={[{ key: 'parallelogram', label: '平行四边形定则' }, { key: 'triangle', label: '三角形法则' }]} value={state.rule} onChange={(value) => state.setRule(value as typeof state.rule)} /><p className="force-composition-help">红色 F₁ 与蓝色 F₂ 从同一点出发，绿色 F合为矢量和；三角形法则会将 F₂ 平移到 F₁ 的末端。</p></ControlSection>}
    {state.mode === 'range' && <ControlSection title="参数调整"><RangeField id="force-range-f1" label="分力 F₁" unit="N" min={10} max={50} step={1} value={state.rangeF1} onChange={state.setRangeF1} /><RangeField id="force-range-f2" label="分力 F₂" unit="N" min={10} max={50} step={1} value={state.rangeF2} onChange={state.setRangeF2} /><RangeField id="force-range-angle" label="夹角 θ" unit="°" min={0} max={180} step={1} value={state.rangeAngleDeg} onChange={state.setRangeAngleDeg} /><label className="force-composition-check"><input type="checkbox" checked={state.rangeSweep} onChange={(event) => state.setRangeSweep(event.target.checked)} />自动扫描夹角</label></ControlSection>}
    {state.mode === 'orthogonal' && <ControlSection title="正交分解参数"><RangeField id="force-ortho-f" label="合力 F" unit="N" min={10} max={80} step={1} value={state.orthogonalMagnitude} onChange={state.setOrthogonalMagnitude} /><RangeField id="force-ortho-angle" label="方向角 θ" unit="°" min={0} max={90} step={1} value={state.orthogonalAngleDeg} onChange={state.setOrthogonalAngleDeg} /><p className="force-composition-help">绿色 F 按坐标轴分解为红色 Fx 与蓝色 Fy，满足 F² = Fx² + Fy²。</p></ControlSection>}
    {state.mode === 'effect' && <ControlSection title="斜面参数"><RangeField id="force-effect-g" label="重力 G" unit="N" min={10} max={60} step={5} value={state.gravity} onChange={state.setGravity} /><RangeField id="force-effect-angle" label="斜面倾角 θ" unit="°" min={15} max={60} step={1} value={state.slopeAngleDeg} onChange={state.setSlopeAngleDeg} /><p className="force-composition-help">重力沿斜面分解为下滑分力 G₁ 与垂直斜面的分力 G₂。</p></ControlSection>}
    <ControlSection title="显示说明"><SelectField id="force-display-unit" label="读数单位" value="N" onChange={() => undefined} options={[{ value: 'N', label: '牛顿（N）' }]} /></ControlSection>
  </div>
}

