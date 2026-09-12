import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { VerificationStep } from './model'
import type { ForceParallelogramSceneState } from './useForceParallelogramSceneState'

type Props = { state: ForceParallelogramSceneState }
const stepOptions = [{ key: 'draw', label: '1 绘制分力' }, { key: 'synthesis', label: '2 作平行四边形' }, { key: 'compare', label: '3 合力对比' }]

export function ForceParallelogramControls({ state }: Props) {
  return <div className="force-parallelogram-controls grid gap-[0.8rem] content-start">
    <div><h2>验证力的平行四边形定则</h2><p className="force-parallelogram-subtitle">高中物理必修一 · 虚拟探究实验</p></div>
    <ControlSection title="实验步骤"><SegmentedControl options={stepOptions} value={state.step} onChange={(value) => state.setStep(value as VerificationStep)} /><p className="force-parallelogram-help">先画出分力 F₁、F₂，再作平行四边形求理论合力，最后与单力 F′ 对比。</p></ControlSection>
    <ControlSection title="分力参数"><RangeField id="parallelogram-f1" label="分力 F₁" unit="N" min={0.8} max={3.2} step={0.01} value={state.f1} onChange={state.setF1} /><RangeField id="parallelogram-f2" label="分力 F₂" unit="N" min={0.8} max={3.2} step={0.01} value={state.f2} onChange={state.setF2} /><RangeField id="parallelogram-angle" label="夹角 θ" unit="°" min={20} max={160} step={1} value={state.angleDeg} onChange={state.setAngleDeg} /></ControlSection>
    <ControlSection title="操作提示"><p className="force-parallelogram-help">调节 F₁、F₂ 或夹角，观察矢量和与橡皮条终点 O 是否重合。</p></ControlSection>
  </div>
}
