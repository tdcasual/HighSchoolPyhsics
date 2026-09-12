import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { Oscilloscope3dChart } from './Oscilloscope3dChart'
import { Oscilloscope3dControls } from './Oscilloscope3dControls'
import { buildNormalTrace, buildXYTrace } from './model'
import { Oscilloscope3dRig3D } from './Oscilloscope3dRig3D'
import { useOscilloscope3dSceneState } from './useOscilloscope3dSceneState'
import './oscilloscope-3d.css'

export function Oscilloscope3dScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useOscilloscope3dSceneState()
  const trace = useMemo(() => state.mode === 'xy'
    ? buildXYTrace({ xy: state.xy, elapsed: state.elapsed })
    : buildNormalTrace({ wave: state.wave, amplitudeV: state.amplitudeV, frequencyHz: state.frequencyHz, voltsDiv: state.voltsDiv, timeDiv: state.timeDiv, elapsed: state.elapsed, trigger: state.trigger }), [state.mode, state.xy, state.elapsed, state.wave, state.amplitudeV, state.frequencyHz, state.voltsDiv, state.timeDiv, state.trigger])
  const beam = trace[Math.floor(((state.elapsed * 0.42) % 1 + 1) % 1 * (trace.length - 1))] ?? [0, 0]
  const selectedLabel = state.selectedPart ? ({ envelope: '透明示波管', 'electron-gun': '电子枪', 'y-plates': 'Y 偏转板', 'x-plates': 'X 偏转板', screen: '荧光屏', beam: '电子束' } as Record<string, string>)[state.selectedPart] : '未选择部件'
  return <SceneLayout
    controls={<Oscilloscope3dControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: [11.8, 7.2, 15.2], fov: 40 }} controls={{ target: [0.2, 0, 0], minDistance: 8, maxDistance: 25, maxPolarAngle: Math.PI * 0.82 }} frameloop={state.running ? 'always' : 'demand'}><Oscilloscope3dRig3D mode={state.mode} elapsed={state.elapsed} running={state.running} selectedPart={state.selectedPart} onSelectPart={state.setSelectedPart} theme={theme} wave={state.wave} amplitudeV={state.amplitudeV} frequencyHz={state.frequencyHz} voltsDiv={state.voltsDiv} timeDiv={state.timeDiv} trigger={state.trigger} xy={state.xy} /></InteractiveCanvas>}
    dataOverlay={<div className="osc3d-telemetry"><p><span>工作模式</span><strong>{state.mode === 'structure' ? '结构认知' : state.mode === 'scan' ? '扫描原理' : state.mode === 'measure' ? '波形测量' : 'X-Y 合成'}</strong></p><p><span>选中部件</span><strong>{selectedLabel}</strong></p><p><span>Uₚₚ</span><strong>{state.measurement.peakToPeakV.toFixed(1)} V</strong></p><p><span>周期 T</span><strong>{state.measurement.periodMs.toFixed(2)} ms</strong></p><p><span>屏幕刻度</span><strong>{state.measurement.verticalDivisions.toFixed(1)} × {state.measurement.horizontalDivisions.toFixed(1)}</strong></p><p className="osc3d-conclusion"><span>结论</span><strong>{state.mode === 'xy' ? state.xyConclusion : state.trigger ? '触发开启，扫描波形稳定。' : '触发关闭，波形相位随时间漂移。'}</strong></p>{state.measurement.warnings.map((warning) => <p className="osc3d-warning" key={warning}>{warning}</p>)}</div>}
    chart={<Oscilloscope3dChart trace={trace} beam={beam} running={state.running} mode={state.mode === 'xy' ? 'X-Y 轨迹' : 'Y(t)'} />}
    playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停扫描' : '继续扫描', onClick: state.toggleRunning }, { key: 'reset', label: '重置', onClick: state.reset }]}
    chartVisible={true}
  />
}
export default Oscilloscope3dScene
