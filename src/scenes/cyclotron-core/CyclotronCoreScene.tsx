import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CyclotronCoreChart } from './CyclotronCoreChart'
import { CyclotronCoreControls } from './CyclotronCoreControls'
import { CyclotronCoreRig3D } from './CyclotronCoreRig3D'
import { useCyclotronCoreSceneState } from './useCyclotronCoreSceneState'
import './cyclotron-core.css'

export function CyclotronCoreScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useCyclotronCoreSceneState()
  const r = state.readings
  const statusLabel = r.extracted ? '粒子已射出' : r.inGap ? '正在通过狭缝' : 'D 型盒内偏转'
  return <SceneLayout
    controls={<CyclotronCoreControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 20, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><CyclotronCoreRig3D {...state} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<div className="cyclotron-core-telemetry"><p><span>注入粒子</span><strong>{r.particle.label} {r.particle.symbol}</strong></p><p><span>加速次数 n</span><strong>{r.accelerationCount}</strong></p><p><span>当前动能 Eₖ</span><strong>{r.energy.toFixed(0)} a.u.</strong></p><p><span>最大动能 Eₖ,max</span><strong>{r.maxEnergy.toFixed(0)} a.u.</strong></p><p><span>周期比 T/T₀</span><strong>{r.periodRatio.toFixed(2)}</strong></p><p><span>运行状态</span><strong className={`cyclotron-core-status ${r.extracted ? 'extracted' : r.inGap ? 'gap' : 'dee'}`}>{statusLabel}</strong></p><p className="cyclotron-core-conclusion"><span>同步结论</span><strong>磁场只改变速度方向；每次过缝获得 qU，回旋周期 T=2πm/(qB)，与速度无关。</strong></p></div>}
    chart={<CyclotronCoreChart state={state} />}
    playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停轨迹' : '继续轨迹', onClick: state.toggleRunning }, { key: 'reset', label: '重置参数', onClick: state.reset }]}
    chartVisible
  />
}

export default CyclotronCoreScene
