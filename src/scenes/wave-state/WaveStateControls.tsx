import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { WaveDirection } from './model'
import type { WaveStateSceneState } from './useWaveStateSceneState'

type Props = { state: WaveStateSceneState }

export function WaveStateControls({ state }: Props) {
  return <div className="wave-state-controls grid gap-[0.8rem] content-start">
    <div><h2>简谐横波传播状态模型</h2><p className="wave-state-subtitle">高中物理数字化交互课件 · 波的传播方向与质点振动方向正交关联</p></div>
    <ControlSection title="传播方向"><SegmentedControl options={[{ key: 'right', label: '向右传播' }, { key: 'left', label: '向左传播' }]} value={state.direction} onChange={(value) => state.setDirection(value as WaveDirection)} columns={2} /></ControlSection>
    <ControlSection title="波形参数"><RangeField id="wave-state-amplitude" label="振幅 A" unit="cm" min={4} max={16} step={1} value={state.amplitude} onChange={state.setAmplitude} showMinMax /><RangeField id="wave-state-wavelength" label="波长 λ" unit="m" min={2} max={8} step={1} value={state.wavelength} onChange={state.setWavelength} showMinMax /><RangeField id="wave-state-period" label="周期 T" unit="s" min={1} max={4} step={0.5} value={state.period} onChange={state.setPeriod} showMinMax /></ControlSection>
    <ControlSection title="观察标记"><div className="wave-state-toggle-grid"><button type="button" className="wave-state-toggle" aria-pressed={state.showGhost} onClick={() => state.setShowGhost(!state.showGhost)}>{state.showGhost ? '隐藏' : '显示'}微平移虚线</button><button type="button" className="wave-state-toggle velocity" aria-pressed={state.showVelocity} onClick={() => state.setShowVelocity(!state.showVelocity)}>{state.showVelocity ? '隐藏' : '显示'}速度方向</button><button type="button" className="wave-state-toggle acceleration" aria-pressed={state.showAcceleration} onClick={() => state.setShowAcceleration(!state.showAcceleration)}>{state.showAcceleration ? '隐藏' : '显示'}加速度方向</button></div><p className="wave-state-help">波形按 y=A sin[2π(t/T∓x/λ)] 传播；质点只沿自身 y 轴振动，不随波形水平移动。</p></ControlSection>
  </div>
}
