import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import type { BinaryStarsSceneState } from './useBinaryStarsSceneState'

type Props = { state: BinaryStarsSceneState }

export function BinaryStarsControls({ state }: Props) {
  return <div className="binary-stars-controls grid gap-[0.8rem] content-start">
    <div><h2>双星系统动力学</h2><p className="binary-stars-subtitle">万有引力定律与航天 · 高考核心模型</p></div>
    <ControlSection title="双星系统参数"><RangeField id="binary-mass1" label="星球 1 质量 m₁" unit="M" min={1} max={6} step={0.1} value={state.mass1} onChange={state.setMass1} /><RangeField id="binary-mass2" label="星球 2 质量 m₂" unit="M" min={1} max={6} step={0.1} value={state.mass2} onChange={state.setMass2} /><RangeField id="binary-separation" label="星际总距离 L" unit="R" min={18} max={42} step={1} value={state.separation} onChange={state.setSeparation} /></ControlSection>
    <ControlSection title="核心规律一：同轴旋转定律"><p className="binary-stars-help">两颗星围绕质心 O 做同周期圆周运动，角速度相同，连杆长度 L 保持不变。</p><p className="binary-stars-formula">ω₁ = ω₂ = {state.readings.omega.toFixed(3)} rad·s⁻¹</p></ControlSection>
    <ControlSection title="核心规律二：动力学等同律"><p className="binary-stars-help">万有引力提供向心力：F = Gm₁m₂/L²；质量越大，轨道半径越小。</p><p className="binary-stars-formula">m₁r₁ = m₂r₂ = {(state.mass1 * state.readings.radius1).toFixed(1)}</p></ControlSection>
  </div>
}
