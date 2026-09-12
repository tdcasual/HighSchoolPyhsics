import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { BeltRatio, CentripetalPreset } from './model'
import type { CentripetalFactorsSceneState } from './useCentripetalFactorsSceneState'

type Props = { state: CentripetalFactorsSceneState }
const presetOptions = [{ key: 'mass', label: '探究质量 m' }, { key: 'radius', label: '探究半径 r' }, { key: 'angular', label: '探究角速度 ω' }]
const ratioOptions = [{ key: '1:1', label: '1 : 1' }, { key: '1:2', label: '1 : 2' }, { key: '2:1', label: '2 : 1' }]
const massOptions = [{ key: '1', label: '1 m₀（铝球）' }, { key: '2', label: '2 m₀（钢球）' }]

export function CentripetalFactorsControls({ state }: Props) {
  return <div className="centripetal-factors-controls grid gap-[0.8rem] content-start">
    <div><h2>向心力演示仪</h2><p className="centripetal-factors-subtitle">控制变量法 · 弹簧测力与塔轮传动联动</p></div>
    <ControlSection title="推荐预设（控制变量法一键装配）"><SegmentedControl options={presetOptions} value={state.preset} onChange={(value) => state.setPreset(value as CentripetalPreset)} /><p className="centripetal-factors-help">保持另外两个量不变，观察左、右小球向心力读数和图表变化。</p></ControlSection>
    <ControlSection title="塔轮传动比"><SegmentedControl options={ratioOptions} value={state.beltRatio} onChange={(value) => state.setBeltRatio(value as BeltRatio)} /><p className="centripetal-factors-formula">ω左 : ω右 = {state.beltRatio}</p></ControlSection>
    <ControlSection title="左侧小球（红色）"><div className="centripetal-factors-label">质量 m左</div><SegmentedControl options={massOptions} value={String(state.leftMassMultiple)} onChange={(value) => state.setLeftMassMultiple(Number(value) as 1 | 2)} /><div className="centripetal-factors-label">安装位置 r左</div><SegmentedControl options={[{ key: '1', label: '挡板 A（1 r₀）' }, { key: '2', label: '挡板 B（2 r₀）' }]} value={String(state.leftRadiusMultiple)} onChange={(value) => state.setLeftRadiusMultiple(Number(value) as 1 | 2)} /></ControlSection>
    <ControlSection title="右侧小球（蓝色）"><div className="centripetal-factors-label">质量 m右</div><SegmentedControl options={massOptions} value={String(state.rightMassMultiple)} onChange={(value) => state.setRightMassMultiple(Number(value) as 1 | 2)} /><div className="centripetal-factors-label">安装位置 r右</div><button className="centripetal-factors-fixed touch-target" type="button" disabled>固定挡板 C（1 r₀）</button></ControlSection>
    <ControlSection title="基准角速度"><RangeField id="centripetal-omega" label="ω₀" unit="rad·s⁻¹" min={0.6} max={3.6} step={0.1} value={state.omegaBase} onChange={state.setOmegaBase} /><p className="centripetal-factors-help">测力标尺条纹数与 F 成正比，满足 F = mω²r。</p></ControlSection>
  </div>
}
