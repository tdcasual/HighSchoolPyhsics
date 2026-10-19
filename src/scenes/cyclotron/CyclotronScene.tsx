import { Answer } from '../../ui/notes/Answer'
import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import type { PresentationFocus } from '../../scene3d/presentationCamera'
import { formatScientific } from '../../core/formatNumber'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CyclotronControls } from './CyclotronControls'
import { CyclotronRig3D } from './CyclotronRig3D'
import { CyclotronTraceChart } from './CyclotronTraceChart'
import { useCyclotronSceneState } from './useCyclotronSceneState'
import { CYCLOTRON_CAMERA, CYCLOTRON_CONTROLS } from './view'
import './cyclotron.css'

const ELEMENTARY_CHARGE_C = 1.6e-19

export function CyclotronScene() {
  const state = useCyclotronSceneState()
  const presentationFocus: PresentationFocus = useMemo(() => {
    if (state.particleInGap) {
      return { mode: 'focus', primary: state.particlePoint }
    }
    if (state.simulation.running) {
      return { mode: 'compare', primary: state.particlePoint, secondary: [0, state.particlePoint[1], 0] }
    }
    return { mode: 'overview' }
  }, [state.particleInGap, state.particlePoint, state.simulation.running])

  return (
    <SceneLayout
      chartInitiallyCollapsed
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
          <p>
            <span>状态</span>
            <strong>{state.particleReachedRim ? '已到达 D 形盒边缘' : state.simulation.running ? '运行中' : '已暂停'}</strong>
          </p>
          <p><span>缝隙电压 U</span><strong>{formatScientific(state.currentVoltageV)} V · {state.voltageDirectionText}</strong></p>
          <p><span>动能 Ek</span><strong>{formatScientific(state.currentEnergyJ)} J（{formatScientific(state.currentEnergyJ / ELEMENTARY_CHARGE_C)} eV）</strong></p>
          <p><span>Ek,max（R=0.675 mm）</span><strong><Answer>{formatScientific(state.maximumKineticEnergyJ)} J（{formatScientific(state.maximumKineticEnergyJ / ELEMENTARY_CHARGE_C)} eV）</Answer></strong></p>
          <p><span>回旋周期 T</span><strong><Answer>{formatScientific(state.cyclotronPeriodS)} s</Answer></strong></p>
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
            title="Ek-t 曲线（理论）"
            series={state.energySeries}
            running={state.simulation.running}
            valueLabel="Ek"
            unit="J"
            tone="energy"
          />
        </>
      }
      playbackActions={[
        {
          key: 'toggle-running',
          label: state.particleReachedRim ? '已出射' : state.simulation.running ? '暂停' : '播放',
          disabled: state.particleReachedRim,
          onClick: state.simulation.toggleRunning,
        },
        {
          key: 'reset',
          label: '重置',
          onClick: state.reset,
        },
      ]}
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

export default CyclotronScene
