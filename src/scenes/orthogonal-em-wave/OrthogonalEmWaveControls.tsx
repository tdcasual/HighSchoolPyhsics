import { ModelNote } from '../../ui/notes/ModelNote'
import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { EmViewMode, EmWaveDirection } from './model'
import type { OrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'

type Props = { state: OrthogonalEmWaveSceneState }

export function OrthogonalEmWaveControls({ state }: Props) {
  return <div className="orthogonal-em-wave-controls grid gap-[0.8rem] content-start">
    <div><h2>正交电磁波模型</h2><p className="orthogonal-em-wave-subtitle">高中物理数字化交互课件 · E、B 与传播方向的空间正交关系</p></div>
    <ControlSection title="空间视角"><SegmentedControl options={[{ key: '3d', label: '3D 空间立体' }, { key: 'xy', label: 'XY 侧视（看 E）' }, { key: 'xz', label: 'XZ 俯视（看 B）' }, { key: 'yz', label: 'YZ 正视（波阵面）' }]} value={state.viewMode} onChange={(value) => state.setViewMode(value as EmViewMode)} columns={2} /></ControlSection>
    <ControlSection title="传播方向"><SegmentedControl options={[{ key: 'right', label: '向右传播' }, { key: 'left', label: '向左传播' }]} value={state.direction} onChange={(value) => state.setDirection(value as EmWaveDirection)} columns={2} /></ControlSection>
    <ControlSection title="波动参数"><RangeField id="orthogonal-em-wave-wavelength" label="波长 λ" unit="m" min={2} max={8} step={1} value={state.wavelength} onChange={state.setWavelength} showMinMax /><RangeField id="orthogonal-em-wave-speed" label="仿真传播速度 vₛᵢₘ" unit="m/s" min={1} max={8} step={1} value={state.speed} onChange={state.setSpeed} showMinMax /><RangeField id="orthogonal-em-wave-amplitude" label="归一化场强振幅" unit="a.u." min={0.6} max={1.6} step={0.1} value={state.amplitude} onChange={state.setAmplitude} displayValue={state.amplitude.toFixed(1)} showMinMax /></ControlSection>
    <ControlSection title="观察标记"><div className="orthogonal-em-wave-toggle-grid"><button type="button" className="orthogonal-em-wave-toggle" aria-pressed={state.showOrthogonality} onClick={() => state.setShowOrthogonality(!state.showOrthogonality)}>{state.showOrthogonality ? '隐藏' : '显示'}正交直角符</button><button type="button" className="orthogonal-em-wave-toggle projection" aria-pressed={state.showProjectionMarks} onClick={() => state.setShowProjectionMarks(!state.showProjectionMarks)}>{state.showProjectionMarks ? '隐藏' : '显示'}点叉投影</button></div><ModelNote><p className="orthogonal-em-wave-help">vₛᵢₘ = λfₛᵢₘ；左行时 Bz 与 Ey 反号以保持 E×B 指向传播方向。图中场强按峰值归一化为 a.u.，可调波速仅用于观察相位传播；真空电磁波速度为 c，SI 制满足 E₀=cB₀。</p></ModelNote></ControlSection>
  </div>
}
