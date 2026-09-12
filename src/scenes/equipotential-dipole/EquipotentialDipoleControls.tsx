import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import type { EquipotentialDipoleSceneState } from './useEquipotentialDipoleSceneState'

type Props = { state: EquipotentialDipoleSceneState }

export function EquipotentialDipoleControls({ state }: Props) {
  return <div className="equipotential-dipole-controls grid gap-[0.8rem] content-start">
    <div><h2>等量异种电荷模型</h2><p className="equipotential-dipole-subtitle">电场线、等势面与场强合成探针</p></div>
    <ControlSection title="物理参数调节"><RangeField id="dipole-separation" label="间距 d" unit="cm" min={2} max={6} step={0.1} value={state.separation} onChange={state.setSeparation} /><RangeField id="dipole-charge" label="电量 Q" unit="μC" min={1} max={5} step={0.1} value={state.charge} onChange={state.setCharge} /></ControlSection>
    <ControlSection title="探针位置"><RangeField id="dipole-probe-x" label="横坐标 x" unit="cm" min={-5} max={5} step={0.1} value={state.probeX} onChange={state.setProbeX} /><RangeField id="dipole-probe-y" label="纵坐标 y" unit="cm" min={-4} max={4} step={0.1} value={state.probeY} onChange={state.setProbeY} /><p className="equipotential-dipole-help">将探针移到中垂线（x=0）或连线中点，比较 E 与 V 的特殊性质。</p></ControlSection>
    <ControlSection title="视觉辅助开关"><label className="equipotential-dipole-toggle"><input type="checkbox" checked={state.flow} onChange={(event) => state.setFlow(event.target.checked)} />显示电场线（流动）</label><label className="equipotential-dipole-toggle"><input type="checkbox" checked={state.showEquipotential} onChange={(event) => state.setShowEquipotential(event.target.checked)} />显示等势面（剖面）</label><label className="equipotential-dipole-toggle"><input type="checkbox" checked={state.showVectors} onChange={(event) => state.setShowVectors(event.target.checked)} />显示合成分解（E）</label></ControlSection>
  </div>
}
