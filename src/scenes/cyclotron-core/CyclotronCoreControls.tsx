import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { PARTICLES, type ParticleType } from './model'
import type { CyclotronCoreSceneState } from './useCyclotronCoreSceneState'

type Props = { state: CyclotronCoreSceneState }
const particleOptions = (Object.entries(PARTICLES) as Array<[ParticleType, (typeof PARTICLES)[ParticleType]]>).map(([key, particle]) => ({ key, label: `${particle.label} ${particle.symbol}` }))

export function CyclotronCoreControls({ state }: Props) {
  return <div className="cyclotron-core-controls grid gap-[0.8rem] content-start">
    <div><h2>回旋加速器核心结构与原理</h2><p className="cyclotron-core-subtitle">高中物理数字化交互课件 · 电场加速、磁场偏转与同步条件</p></div>
    <ControlSection title="注入粒子类型"><SegmentedControl options={particleOptions} value={state.particleType} onChange={(value) => state.setParticleType(value as ParticleType)} columns={3} /></ControlSection>
    <ControlSection title="实验物理参数"><RangeField id="cyclotron-core-B" label="磁感应强度 B" unit="T" min={1} max={3} step={1} value={state.B} onChange={state.setB} showMinMax /><RangeField id="cyclotron-core-U" label="高频加速电压 U" unit="kV" min={10} max={50} step={10} value={state.U} onChange={state.setU} showMinMax /></ControlSection>
    <ControlSection title="原理提示"><p className="cyclotron-core-help">狭缝中的交变电场每次做功 W=qU；D 型盒内只有磁场，粒子做半圆运动。同步条件 T电=T机，最大动能只由 B 与 D 型盒半径决定，与 U 无关。</p></ControlSection>
  </div>
}
