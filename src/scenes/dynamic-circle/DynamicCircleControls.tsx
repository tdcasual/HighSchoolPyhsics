import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { BoundaryType, DynamicCircleMode } from './model'
import type { DynamicCircleSceneState } from './useDynamicCircleSceneState'

type Props = { state: DynamicCircleSceneState }

const modeOptions = [
  { key: 'scaling', label: '放缩圆' },
  { key: 'rotating', label: '旋转圆' },
  { key: 'translating', label: '平移圆' },
  { key: 'comprehensive', label: '综合聚焦' },
]
const boundaryOptions = [
  { key: 'straight', label: '直线/矩形' },
  { key: 'triangle', label: '三角形' },
  { key: 'circle', label: '圆形' },
]

export function DynamicCircleControls({ state }: Props) {
  return <div className="dynamic-circle-controls grid gap-[0.8rem] content-start">
    <div><h2>动态圆 · 三法破临界</h2><p className="dynamic-circle-subtitle">高中物理数字化交互课件 · 带电粒子在有界磁场中的运动</p></div>
    <SegmentedControl options={modeOptions} value={state.mode} onChange={(value) => state.setMode(value as DynamicCircleMode)} columns={2} />
    <ControlSection title="磁场边界形状">
      <SegmentedControl options={boundaryOptions} value={state.boundary} onChange={(value) => state.setBoundary(value as BoundaryType)} columns={3} />
    </ControlSection>
    <ControlSection title="实验物理参数">
      <RangeField id="dynamic-circle-B" label="磁感应强度 B" unit="T" min={-0.25} max={0.25} step={0.01} value={state.B} displayValue={`${state.B.toFixed(2)} T`} onChange={state.setB} showMinMax />
      <RangeField id="dynamic-circle-v" label="入射速度 v" unit="m/s" min={4} max={25} step={0.5} value={state.v} displayValue={`${state.v.toFixed(1)} m/s`} onChange={state.setV} />
      {(state.mode === 'rotating' || state.mode === 'comprehensive') && <RangeField id="dynamic-circle-theta" label="入射夹角 θ" unit="°" min={-90} max={90} step={1} value={state.thetaDeg} onChange={state.setThetaDeg} showMinMax />}
      {(state.mode === 'translating' || state.mode === 'comprehensive') && <RangeField id="dynamic-circle-y" label="入射位置 y₀" unit="mm" min={150} max={510} step={5} value={state.y0} onChange={state.setY0} />}
    </ControlSection>
    {state.boundary === 'straight' && <ControlSection title="直线边界参数"><RangeField id="dynamic-circle-bound-x" label="右边界位置 x" unit="mm" min={320} max={600} step={5} value={state.xBound} onChange={state.setXBound} /></ControlSection>}
    {state.boundary === 'triangle' && <ControlSection title="三角形边界参数"><RangeField id="dynamic-circle-triangle-x" label="右顶点 x" unit="mm" min={320} max={600} step={5} value={state.triangleX} onChange={state.setTriangleX} /><RangeField id="dynamic-circle-triangle-h" label="垂直高度 h" unit="mm" min={150} max={450} step={10} value={state.triangleHeight} onChange={state.setTriangleHeight} /></ControlSection>}
    {state.boundary === 'circle' && <ControlSection title="圆形边界参数"><RangeField id="dynamic-circle-radius" label="磁场半径 rᶠ" unit="mm" min={50} max={200} step={5} value={state.circleRadius} onChange={state.setCircleRadius} /><RangeField id="dynamic-circle-center" label="磁场中心 xᶜ" unit="mm" min={280} max={520} step={5} value={state.circleCenterX} onChange={state.setCircleCenterX} /></ControlSection>}
    <ControlSection title="显示与动画">
      <label className="dynamic-circle-check"><input type="checkbox" checked={state.showCenter} onChange={(event) => state.setShowCenter(event.target.checked)} />显示圆心与辅助几何</label>
      <label className="dynamic-circle-check"><input type="checkbox" checked={state.sweep} onChange={(event) => state.setSweep(event.target.checked)} />自动参数扫掠（动态圆族）</label>
      <p className="dynamic-circle-help">洛伦兹力提供向心力：R = mv / |qB|。改变边界和参数，观察轨迹与临界状态同步变化。</p>
    </ControlSection>
  </div>
}
