import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import type { PresentationFocus } from '../../scene3d/presentationCamera'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CyclotronControls } from './CyclotronControls'
import { CyclotronRig3D } from './CyclotronRig3D'
import { CyclotronTraceChart } from './CyclotronTraceChart'
import { useCyclotronSceneState } from './useCyclotronSceneState'
import { CYCLOTRON_CAMERA, CYCLOTRON_CONTROLS } from './view'
import './cyclotron.css'

export function CyclotronScene() {
  const state = useCyclotronSceneState()
  const presentationFocus: PresentationFocus = state.particleInGap
    ? { mode: 'focus', primary: state.particlePoint }
    : state.simulation.running
      ? { mode: 'compare', primary: state.particlePoint, secondary: [0, state.particlePoint[1], 0] }
      : { mode: 'overview' }

  return (
    <SceneLayout
      controls={
        <CyclotronControls
          magneticFieldT={state.magneticFieldT}
          onMagneticFieldChange={state.setMagneticFieldT}
          electricFieldVPerM={state.electricFieldVPerM}
          onElectricFieldChange={state.setElectricFieldVPerM}
          gapHalfWidthMm={state.gapHalfWidthMm}
          onGapHalfWidthChange={state.setGapHalfWidthMm}
          energyMode={state.energyMode}
          onEnergyModeChange={state.setEnergyMode}
        />
      }
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>状态: {state.simulation.running ? '运行中' : '已暂停'}</p>
          <p>电压方向: {state.voltageDirectionText}</p>
          <p>U: {state.currentVoltageV.toExponential(2)} V</p>
          <p>Ek: {state.currentEnergyJ.toExponential(2)} J</p>
          <p>自适应周期 T: {state.cyclotronPeriodS.toExponential(2)} s</p>
          <p>自适应出发 y0: {state.launchPositionY.toExponential(2)} m</p>
          {state.simulation.error ? <p>错误: {state.simulation.error}</p> : null}
        </div>
      }
      chart={
        <>
          <CyclotronTraceChart
            title="U-t 曲线"
            series={state.voltageSeries}
            running={state.simulation.running}
            valueLabel="U"
            unit="V"
            tone="voltage"
            fixedRange={state.voltageRange}
          />
          <CyclotronTraceChart
            title="Ek-t 曲线"
            series={state.energySeries}
            running={state.simulation.running}
            valueLabel="Ek"
            unit="J"
            tone="energy"
          />
        </>
      }
      playback={
        <SceneActions
          actions={[
            {
              key: 'toggle-running',
              label: state.simulation.running ? '暂停' : '播放',
              onClick: state.simulation.toggleRunning,
            },
            {
              key: 'reset',
              label: '重置',
              onClick: state.reset,
            },
          ]}
        />
      }
      chartVisible={true}
      viewport={
        <InteractiveCanvas
          camera={CYCLOTRON_CAMERA}
          controls={CYCLOTRON_CONTROLS}
          presentationFocus={presentationFocus}
          frameloop={state.simulation.running ? 'always' : 'demand'}
        >
          <CyclotronRig3D
            trailPoints={state.trailPoints}
            particlePoint={state.particlePoint}
            phase={state.voltagePhase}
            running={state.simulation.running}
            voltageSign={state.currentVoltageV}
            particleInGap={state.particleInGap}
            deeGapWidth={state.deeGapWidth}
          />
        </InteractiveCanvas>
      }
    />
  )
}
