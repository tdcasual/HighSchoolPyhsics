import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import type { TrainTurningSceneState } from './useTrainTurningSceneState'

type Props = { state: TrainTurningSceneState }

export function TrainTurningControls({ state }: Props) {
  return <div className="train-turning-controls grid gap-[0.8rem] content-start">
    <div><h2>火车转弯受力分析模型</h2><p className="train-turning-subtitle">高中物理数字化交互课件 · 匀速圆周运动与临界状态探索</p></div>
    <ControlSection title="实际运行参数"><RangeField id="train-turning-speed" label="实际速度 v" unit="m/s" min={5} max={45} step={0.5} value={state.speed} onChange={state.setSpeed} showMinMax /><button type="button" className="train-turning-ideal-button" onClick={state.setIdealSpeed}>一键设为理想速度 v₀（{state.readings.idealSpeed.toFixed(1)} m/s）</button><RangeField id="train-turning-angle" label="轨道倾斜角度 θ" unit="°" min={4} max={24} step={1} value={state.angleDeg} onChange={state.setAngleDeg} showMinMax /><RangeField id="train-turning-radius" label="规定转弯半径 R" unit="m" min={40} max={160} step={5} value={state.radius} onChange={state.setRadius} showMinMax /></ControlSection>
    <ControlSection title="力学关系"><p className="train-turning-help">理想速度满足 tanθ = v₀²/(Rg)。实际速度偏离 v₀ 时，轮缘与外/内侧轨道产生侧向力补偿向心力缺口。</p></ControlSection>
  </div>
}
