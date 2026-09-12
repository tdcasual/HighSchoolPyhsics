import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import type { MechanicalWaveGraphsSceneState } from './useMechanicalWaveGraphsSceneState'

type Props = { state: MechanicalWaveGraphsSceneState }

export function MechanicalWaveGraphsControls({ state }: Props) {
  return <div className="mechanical-wave-graphs-controls grid gap-[0.8rem] content-start">
    <div><h2>机械波的形成与图像演示</h2><p className="mechanical-wave-graphs-subtitle">高中物理数字化交互课件 · y-x 空间波形与选中质点 y-t 振动图</p></div>
    <ControlSection title="波动参数"><RangeField id="mechanical-wave-graphs-amplitude" label="振幅 A" unit="cm" min={3} max={8} step={1} value={state.amplitude} onChange={state.setAmplitude} showMinMax /><RangeField id="mechanical-wave-graphs-wavelength" label="波长 λ" unit="m" min={24} max={72} step={4} value={state.wavelength} onChange={state.setWavelength} showMinMax /><RangeField id="mechanical-wave-graphs-period" label="周期 T" unit="s" min={2} max={5} step={0.5} value={state.period} onChange={state.setPeriod} showMinMax /><RangeField id="mechanical-wave-graphs-probe" label="选中质点位置 xₚ" unit="m" min={0} max={72} step={1} value={state.probeX} onChange={state.setProbeX} showMinMax /></ControlSection>
    <ControlSection title="观察标记"><label className="mechanical-wave-graphs-check"><input type="checkbox" checked={state.showVelocity} onChange={(event) => state.setShowVelocity(event.target.checked)} />显示质点速度方向</label><p className="mechanical-wave-graphs-help">波速 v=λ/T；上图是某一时刻的空间抓拍，下图跟踪同一质点的振动历程。</p></ControlSection>
  </div>
}
