import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { SameChargePolarity } from './model'
import type { SameChargeSceneState } from './useSameChargeSceneState'

type Props = { state: SameChargeSceneState }
const polarityOptions = [{ key: 'positive', label: '正电荷 (+)' }, { key: 'negative', label: '负电荷 (-)' }]

export function SameChargeControls({ state }: Props) {
  return <div className="same-charge-controls grid gap-[0.8rem] content-start">
    <div><h2>等量同种电荷场</h2><p className="same-charge-subtitle">电场线、等势面与空间场强探针</p></div>
    <ControlSection title="电荷极性配置（Q₁ = Q₂）"><SegmentedControl options={polarityOptions} value={state.polarity} onChange={(value) => state.setPolarity(value as SameChargePolarity)} /></ControlSection>
    <ControlSection title="物理参数调节"><RangeField id="same-charge-separation" label="电荷间距 2d" unit="cm" min={2} max={6} step={0.1} value={state.separation} onChange={state.setSeparation} /><RangeField id="same-charge-amount" label="电量 Q" unit="μC" min={1} max={5} step={0.1} value={state.charge} onChange={state.setCharge} /></ControlSection>
    <ControlSection title="探针坐标 (x, y)"><RangeField id="same-charge-probe-x" label="横坐标 x" unit="cm" min={-5} max={5} step={0.1} value={state.probeX} onChange={state.setProbeX} /><RangeField id="same-charge-probe-y" label="纵坐标 y" unit="cm" min={-4} max={4} step={0.1} value={state.probeY} onChange={state.setProbeY} /><p className="same-charge-help">将探针移到中垂线（x=0）观察场强抵消，而电势仍为非零。</p></ControlSection>
    <ControlSection title="物理图层解析"><label className="same-charge-toggle"><input type="checkbox" checked={state.flow} onChange={(event) => state.setFlow(event.target.checked)} />电场线（E）</label><label className="same-charge-toggle"><input type="checkbox" checked={state.showEquipotential} onChange={(event) => state.setShowEquipotential(event.target.checked)} />等势面（φ）</label><label className="same-charge-toggle"><input type="checkbox" checked={state.showVectors} onChange={(event) => state.setShowVectors(event.target.checked)} />开启电场叠加分析（E = E₁ + E₂）</label></ControlSection>
  </div>
}
