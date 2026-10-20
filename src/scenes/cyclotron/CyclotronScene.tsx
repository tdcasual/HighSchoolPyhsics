import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import type { PresentationFocus } from '../../scene3d/presentationCamera'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CyclotronControls } from './CyclotronControls'
import { CyclotronRig3D } from './CyclotronRig3D'
import { CyclotronTraceChart } from './CyclotronTraceChart'
import { MAX_ORBIT_RADIUS_M } from './layout'
import { STEPS_PER_TURN } from './run'
import { useCyclotronSceneState } from './useCyclotronSceneState'
import { CYCLOTRON_CAMERA, CYCLOTRON_CONTROLS } from './view'

const MEV_J = 1.6e-13

export function CyclotronScene() {
  const state = useCyclotronSceneState()
  const presentationFocus: PresentationFocus = useMemo(() => {
    if (state.particleInGap) {
      return { mode: 'focus', primary: state.particlePoint }
    }
    if (state.running) {
      return { mode: 'compare', primary: state.particlePoint, secondary: [0, state.particlePoint[1], 0] }
    }
    return { mode: 'overview' }
  }, [state.particleInGap, state.particlePoint, state.running])

  return (
    <SceneLayout timeControl
      chartInitiallyCollapsed
      controls={
        <CyclotronControls
          magneticFieldT={state.magneticFieldT}
          onMagneticFieldChange={state.setMagneticFieldT}
          gapVoltageKv={state.gapVoltageKv}
          onGapVoltageChange={state.setGapVoltageKv}
          gapWidthCm={state.gapWidthCm}
          onGapWidthChange={state.setGapWidthCm}
          energyMode={state.energyMode}
          onEnergyModeChange={state.setEnergyMode}
        />
      }
      dataOverlay={
        <DataRows
          rows={[
            { label: '已知 B · U · R', value: <>{state.magneticFieldT.toFixed(1)} T · {state.gapVoltageKv.toFixed(0)} kV · {MAX_ORBIT_RADIUS_M.toFixed(1)} m</> },
            { label: '缝隙电压 u', value: <>{(state.currentVoltageV / 1000).toFixed(0)} kV · {state.voltageDirectionText}</> },
            { label: '动能 Eₖ · 过缝次数', value: <>{(state.currentEnergyJ / MEV_J).toFixed(2)} MeV · {state.crossings}</> },
            { label: 'Eₖ,max = q²B²R²/(2m)', value: <>{(state.maximumKineticEnergyJ / MEV_J).toFixed(1)} MeV</>, answer: true },
            { label: '回旋周期 T = 2πm/(qB)', value: <>{(state.cyclotronPeriodS * 1e9).toFixed(1)} ns</>, answer: true },
          ]}
        />
      }
      notes={
        <>
          <p>
            教材量级的质子回旋加速器：D 形盒半径 {MAX_ORBIT_RADIUS_M} m，缝隙宽 {state.gapWidthCm} cm，交变电压频率等于回旋频率。粒子运动由洛伦兹力与缝隙电场直接积分得到（每圈 {STEPS_PER_TURN} 步，非相对论）。
          </p>
          <p>
            Eₖ,max 只取决于 B 与 R、与 U 无关；U 越大，过缝次数越少、加速越快。实际出射动能略小于 q²B²R²/(2m)：每次过缝都使轨道圆心偏移，粒子在轨道半径略小于 R 时就到达边缘。
          </p>
        </>
      }
      chart={
        <>
          <CyclotronTraceChart
            title="U-t 曲线"
            series={state.voltageSeries.map((sample) => ({ timeS: sample.timeS, value: sample.value / 1000 }))}
            running={state.running}
            valueLabel="u"
            unit="kV"
            tone="voltage"
            fixedRange={[state.voltageRange[0] / 1000, state.voltageRange[1] / 1000]}
          />
          <CyclotronTraceChart
            title={state.energyMode === 'include-acceleration-time' ? 'Ek-t 曲线（仿真）' : 'Ek-t 曲线（理想台阶）'}
            series={state.energySeries.map((sample) => ({ timeS: sample.timeS, value: sample.value / MEV_J }))}
            running={state.running}
            valueLabel="Ek"
            unit="MeV"
            tone="energy"
          />
        </>
      }
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        {
          stepLabel: '单步 半圈',
          onReset: state.reset,
          finished: state.particleReachedRim,
          finishedLabel: '已出射',
          disabled: state.particleReachedRim,
        },
      )}
      chartVisible={true}
      viewport={
        <InteractiveCanvas
          camera={CYCLOTRON_CAMERA}
          controls={CYCLOTRON_CONTROLS}
          presentationFocus={presentationFocus}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CyclotronRig3D
            trailPoints={state.trailPoints}
            particlePoint={state.particlePoint}
            phase={state.voltagePhase}
            running={state.running}
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
