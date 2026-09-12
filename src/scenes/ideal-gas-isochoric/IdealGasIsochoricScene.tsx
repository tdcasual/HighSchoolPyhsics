import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { IdealGasIsochoricChart } from './IdealGasIsochoricChart'
import { IdealGasIsochoricControls } from './IdealGasIsochoricControls'
import { IdealGasIsochoricRig3D } from './IdealGasIsochoricRig3D'
import { useIdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'
import './ideal-gas-isochoric.css'

export function IdealGasIsochoricScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useIdealGasIsochoricSceneState()
  const r = state.readings
  return <SceneLayout controls={<IdealGasIsochoricControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0.15, 12], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 19, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><IdealGasIsochoricRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="ideal-gas-isochoric-telemetry"><p><span>压强 p</span><strong>{r.pressureAtm.toFixed(2)} atm</strong></p><p><span>热力学温度 T</span><strong>{state.temperatureK.toFixed(0)} K</strong></p><p><span>摄氏温度 t</span><strong>{r.celsius.toFixed(0)} °C</strong></p><p><span>固定体积 V</span><strong>{state.volumeL.toFixed(1)} L</strong></p><p><span>关系式</span><strong>p/T = {r.slopeAtmPerK.toFixed(4)} atm/K</strong></p><p className="ideal-gas-isochoric-conclusion"><span>物理结论</span><strong>体积被机械锁死时，压强 p 与热力学温度 T 成正比；p-t 直线外推在 −273.15 °C 收束。</strong></p></div>} chart={<IdealGasIsochoricChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停热运动' : '继续热运动', onClick: state.toggleRunning }, { key: 'reset', label: '重置状态', onClick: state.reset }]} chartVisible />
}

export default IdealGasIsochoricScene
