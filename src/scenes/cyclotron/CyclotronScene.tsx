import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CyclotronControls } from './CyclotronControls'
import { CyclotronRig3D } from './CyclotronRig3D'
import { CyclotronTraceChart } from './CyclotronTraceChart'
import { useCyclotronSceneState } from './useCyclotronSceneState'
import { CYCLOTRON_CAMERA, CYCLOTRON_CONTROLS } from './view'
import './cyclotron.css'

export function CyclotronScene() {
  const state = useCyclotronSceneState()

  return (
    <SceneLayout
      presentationSignals={['chart', 'time-series', 'live-metric']}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>状态: {state.simulation.running ? '运行中' : '已暂停'}</p>
          <p>电压方向: {state.voltageDirectionText}</p>
          <p>U: {state.currentVoltageV.toExponential(2)} V</p>
          <p>Ek: {state.currentEnergyJ.toExponential(2)} J</p>
        </div>
      }
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
          running={state.simulation.running}
          onToggleRunning={state.simulation.toggleRunning}
          onReset={state.reset}
          modeText="Worker"
          cyclotronPeriodS={state.cyclotronPeriodS}
          launchPositionY={state.launchPositionY}
          voltageDirectionText={state.voltageDirectionText}
          currentVoltageV={state.currentVoltageV}
          currentEnergyJ={state.currentEnergyJ}
          error={state.simulation.error}
          charts={
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
        />
      }
      viewport={
        <InteractiveCanvas
          camera={CYCLOTRON_CAMERA}
          controls={CYCLOTRON_CONTROLS}
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
