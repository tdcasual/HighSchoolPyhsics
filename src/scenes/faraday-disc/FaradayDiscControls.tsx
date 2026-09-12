import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { CircuitState, MagneticDirection, RotationDirection } from './model'
import type { FaradayDiscSceneState } from './useFaradayDiscSceneState'

type Props = { state: FaradayDiscSceneState }

export function FaradayDiscControls({ state }: Props) {
  return <div className="faraday-disc-controls grid gap-[0.8rem] content-start">
    <div><h2>法拉第圆盘发电机实验装置</h2><p className="faraday-disc-subtitle">高中物理数字化交互课件 · 动生电动势与能量守恒</p></div>
    <ControlSection title="经典教学预设"><SegmentedControl options={[{ key: 'cw', label: '标准顺转（∞）' }, { key: 'ccw', label: '反向磁场（仅反 B）' }]} value={state.rotation} onChange={(value) => state.setRotation(value as RotationDirection)} columns={2} /></ControlSection>
    <ControlSection title="实验变量与环境参数"><SegmentedControl options={[{ key: 'into', label: '垂直向里（⊗）' }, { key: 'out', label: '垂直向外（⊙）' }]} value={state.magnetic} onChange={(value) => state.setMagnetic(value as MagneticDirection)} columns={2} /><RangeField id="faraday-disc-B" label="磁感应强度 B" unit="T" min={0.5} max={2} step={0.1} value={state.B} onChange={state.setB} showMinMax /><RangeField id="faraday-disc-omega" label="角速度 ω" unit="rad/s" min={2} max={18} step={1} value={state.omega} onChange={state.setOmega} showMinMax /><RangeField id="faraday-disc-radius" label="圆盘半径 R" unit="m" min={0.1} max={0.35} step={0.01} value={state.radius} onChange={state.setRadius} displayValue={state.radius.toFixed(2)} showMinMax /><RangeField id="faraday-disc-resistance" label="外接电阻 R外" unit="Ω" min={1} max={5} step={0.5} value={state.externalResistance} onChange={state.setExternalResistance} showMinMax /><SegmentedControl options={[{ key: 'closed', label: '闭合回路' }, { key: 'open', label: '断开开关' }]} value={state.circuit} onChange={(value) => state.setCircuit(value as CircuitState)} columns={2} /></ControlSection>
    <ControlSection title="原理提示"><p className="faraday-disc-help">转动切割磁感线产生动生电动势：E = ½BωR²。圆心 A 与边缘 B 的电势差驱动外电路电流；断开开关时有电压但无电流。</p></ControlSection>
  </div>
}
