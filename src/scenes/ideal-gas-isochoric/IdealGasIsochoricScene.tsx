import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { IdealGasIsochoricChart } from './IdealGasIsochoricChart'
import { IdealGasIsochoricControls } from './IdealGasIsochoricControls'
import { IdealGasIsochoricRig3D } from './IdealGasIsochoricRig3D'
import { useIdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'
import './ideal-gas-isochoric.css'

export function IdealGasIsochoricScene() {
  const state = useIdealGasIsochoricSceneState()
  const readings = state.readings
  return <SceneLayout
    controls={<IdealGasIsochoricControls state={state} />}
    viewport={
      <FittedCanvas
        shot={{ azimuth: 0, elevation: 0.01 }}
        fov={42}
        minDistance={7}
        maxDistance={19}
        maxPolarAngle={Math.PI * 0.9}
        frameloop={state.running ? 'always' : 'demand'}
      >
        <IdealGasIsochoricRig3D {...state} />
      </FittedCanvas>
    }
    dataOverlay={
      <DataRows
          className="ideal-gas-isochoric-telemetry"
          rows={[
            { label: '压强 p', value: <>{readings.pressureAtm.toFixed(2)} atm</>, answer: true },
            { label: '热力学温度 T / 摄氏温度 t', value: <>{state.temperatureK.toFixed(0)} K / {readings.celsius.toFixed(0)} °C</> },
            { label: '分子平均速率 v̄ / 220 K 基准', value: <>{readings.molecularSpeed.toFixed(2)}×</> },
            { label: '等容关系式', value: <>p/T = {readings.slopeAtmPerK.toFixed(4)} atm/K</> },
          ]}
        />
    }
    notes={
      <>
        <p>固定体积 V = {state.volumeL.toFixed(1)} L，定量气体 n = {readings.gasAmountMol.toFixed(3)} mol；数密度相对 6 L 基准为 {readings.densityRelative.toFixed(2)}×。</p>
        <p>本次实验固定 n 和 V，仅改变 T；所以 p/T = nR/V 为常量，压强与热力学温度成正比。</p>
      </>
    }
    chart={<IdealGasIsochoricChart state={state} />}
    playbackActions={clockActions(
      { running: state.running, toggle: state.toggleRunning },
      { playLabel: '继续热运动', pauseLabel: '暂停热运动', resetLabel: '重置状态', onReset: state.reset },
    )}
    chartVisible
    chartInitiallyCollapsed
  />
}

export default IdealGasIsochoricScene
