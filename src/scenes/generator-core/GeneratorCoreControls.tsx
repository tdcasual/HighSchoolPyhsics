import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import type { GeneratorCoreSceneState } from './useGeneratorCoreSceneState'

type Props = { state: GeneratorCoreSceneState }

const modeOptions = [
  { key: 'model', label: '模型结构' },
  { key: 'phase', label: '相位分析' },
]

export function GeneratorCoreControls({ state }: Props) {
  return <div className="generator-core-controls grid gap-[0.8rem] content-start">
    <div>
      <h2>正弦式交变电流：发电机核心模型</h2>
      <p className="generator-core-subtitle">旋转线圈 · N/S 磁极 · 磁通量与感应电动势</p>
    </div>
    <SegmentedControl options={modeOptions} value={state.mode} onChange={(value) => state.setMode(value as typeof state.mode)} />
    <ControlSection title="运动参数">
      <RangeField id="generator-core-angle" label="旋转相位 θ" unit="°" min={0} max={360} step={1} value={state.readings.angleDeg} onChange={(value) => state.setAngleRad(value * Math.PI / 180)} displayValue={`${state.readings.angleDeg.toFixed(0)}°`} />
      <RangeField id="generator-core-speed" label="角速度 ω" unit="rad/s" min={0.2} max={4} step={0.1} value={state.angularSpeedRad} onChange={state.setAngularSpeedRad} displayValue={`${state.angularSpeedRad.toFixed(1)} rad/s`} />
      <p className="generator-core-help">调节相位或拖拽 3D 模型观察线圈方向；播放控制可暂停或复位旋转。</p>
    </ControlSection>
    {state.mode === 'model' && <ControlSection title="结构认知"><p className="generator-core-help">红色 N 极、蓝色 S 极产生水平磁场。线圈法向量 n 与磁场 B 的夹角为 θ，黄色箭头表示导线速度方向，红蓝箭头表示电流换向。</p></ControlSection>}
    {state.mode === 'phase' && <ControlSection title="相位关系"><p className="generator-core-help">磁通量 Φ = Φₘ cosθ，感应电动势 e = Eₘ sinθ。图表中的竖线与模型角度同步移动，可对照峰值和过零点。</p></ControlSection>}
  </div>
}
