import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { IdealGasIsochoricChart } from './IdealGasIsochoricChart'
import { IdealGasIsochoricControls } from './IdealGasIsochoricControls'
import { IdealGasIsochoricRig3D } from './IdealGasIsochoricRig3D'
import { useIdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'
import './ideal-gas-isochoric.css'

export function IdealGasIsochoricScene() {
  const theme = useAppStore((state) => state.theme)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const cameraTargetX = isMobile ? 0 : 1.9
  const state = useIdealGasIsochoricSceneState()
  const readings = state.readings
  return <SceneLayout
    controls={<IdealGasIsochoricControls state={state} />}
    viewport={
      <InteractiveCanvas
        camera={{ position: [cameraTargetX, 0.15, isMobile ? 9.2 : 14.5], fov: 42 }}
        controls={{ target: [cameraTargetX, 0, 0], minDistance: 7, maxDistance: 19, maxPolarAngle: Math.PI * 0.9 }}
        frameloop={state.running ? 'always' : 'demand'}
      >
        <IdealGasIsochoricRig3D {...state} theme={theme} mobile={isMobile} />
      </InteractiveCanvas>
    }
    dataOverlay={
      <div className="ideal-gas-isochoric-telemetry">
        <p><span>压强 p</span><strong>{readings.pressureAtm.toFixed(2)} atm</strong></p>
        <p><span>热力学温度 T / 摄氏温度 t</span><strong>{state.temperatureK.toFixed(0)} K / {readings.celsius.toFixed(0)} °C</strong></p>
        <p><span>固定体积 V · 定量气体 n</span><strong>{state.volumeL.toFixed(1)} L · {readings.gasAmountMol.toFixed(3)} mol</strong></p>
        <p><span>分子平均速率 v̄ / 220 K 基准</span><strong>{readings.molecularSpeed.toFixed(2)}×</strong></p>
        <p><span>数密度 n/V · 基准 V = 6 L</span><strong>{readings.densityRelative.toFixed(2)}×</strong></p>
        <p><span>等容关系式</span><strong>p/T = {readings.slopeAtmPerK.toFixed(4)} atm/K</strong></p>
        <p className="ideal-gas-isochoric-conclusion"><span>物理结论</span><strong>本次实验固定 n 和 V，仅改变 T；所以 p/T = nR/V 为常量，压强与热力学温度成正比。</strong></p>
      </div>
    }
    chart={<IdealGasIsochoricChart state={state} />}
    playbackActions={[
      { key: 'toggle-running', label: state.running ? '暂停热运动' : '继续热运动', onClick: state.toggleRunning },
      { key: 'reset', label: '重置状态', onClick: state.reset },
    ]}
    chartVisible
    chartInitiallyCollapsed
    playbackInitiallyCollapsed
  />
}

export default IdealGasIsochoricScene
