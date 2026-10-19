import { Answer } from '../../ui/notes/Answer'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { METER_FULL_SCALE_A } from './model'
import { AlternatorChart } from './AlternatorChart'
import { AlternatorControls } from './AlternatorControls'
import { AlternatorRig3D } from './AlternatorRig3D'
import { useAlternatorSceneState } from './useAlternatorSceneState'
import './alternator.css'

export function AlternatorScene() {
  const theme = useAppStore((state) => state.theme)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const state = useAlternatorSceneState()
  const cameraPosition: [number, number, number] = isMobile ? [14, 10, 18] : [22.24, 12.86, 19.82]
  const cameraTarget: [number, number, number] = isMobile ? [0, 0, 0] : [4.26, 0, -3.32]
  const viewportNeedleAngleRad = state.meterNeedleAngleRad

  return (
    <SceneLayout timeControl
      controls={<AlternatorControls state={state} />}
      viewport={
        <InteractiveCanvas
          camera={{ position: cameraPosition, fov: 45 }}
          controls={{ target: cameraTarget, minDistance: 10, maxDistance: 38 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <AlternatorRig3D
            angleRad={state.angleRad}
            meterNeedleAngleRad={viewportNeedleAngleRad}
            currentA={state.instantaneousCurrentA}
            isMeterOverRange={Math.abs(state.instantaneousCurrentA) > METER_FULL_SCALE_A}
            theme={theme}
          />
        </InteractiveCanvas>
      }
      dataOverlay={
        <div className="alternator-telemetry scene-core-summary-stack">
          <p><span>ω / f</span><strong>{state.speedLabel} / {state.frequencyLabel}</strong></p>
          <p><span>已知 N · S · B</span><strong>{state.turnsLabel} · {state.areaLabel} · {state.magneticFieldT.toFixed(1)} T</strong></p>
          <p><span>Φ（单匝）/ e</span><strong><Answer>{state.fluxLabel} / {state.voltageLabel}</Answer></strong></p>
          <p><span>I / 方向</span><strong><Answer>{state.currentLabel} / {state.currentDirectionLabel}</Answer></strong></p>
          <p><span>表针 / 量程</span><strong>{state.needleAngleLabel} / ±2 A{Math.abs(state.instantaneousCurrentA) > METER_FULL_SCALE_A ? ' 超量程' : ''}</strong></p>
        </div>
      }
      chart={
        <AlternatorChart
          voltageHistory={state.history.voltage}
          currentVoltageV={state.instantaneousVoltageV}
          currentTimeLabel={state.timeLabel}
          peakVoltageV={state.peakVoltageV}
        />
      }
      playbackActions={[
        {
          key: 'toggle-running',
          label: state.running ? '暂停' : '播放',
          onClick: state.toggleRunning,
        },
        { key: 'step', label: '单步 15°', onClick: state.step },
        {
          key: 'reset',
          label: '重置',
          onClick: state.reset,
        },
      ]}
      chartVisible={true}
      chartInitiallyCollapsed
    />
  )
}

export default AlternatorScene
