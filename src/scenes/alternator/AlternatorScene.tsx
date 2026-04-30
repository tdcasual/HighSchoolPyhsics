import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { AlternatorChart } from './AlternatorChart'
import { AlternatorControls } from './AlternatorControls'
import { ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD, AlternatorRig3D } from './AlternatorRig3D'
import { useAlternatorSceneState } from './useAlternatorSceneState'
import './alternator.css'

export function AlternatorScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useAlternatorSceneState()
  const viewportNeedleAngleRad = -(Math.cos(state.angleRad + ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD)) * (Math.PI / 3)

  return (
    <SceneLayout
      controls={<AlternatorControls state={state} />}
      viewport={
        <InteractiveCanvas
          camera={{ position: [14, 10, 18], fov: 45 }}
          controls={{ target: [0, 0, 0], minDistance: 10, maxDistance: 38 }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <AlternatorRig3D
            angleRad={state.angleRad}
            meterNeedleAngleRad={viewportNeedleAngleRad}
            theme={theme}
          />
        </InteractiveCanvas>
      }
      dataOverlay={
        <div className="alternator-telemetry">
          <p><span>转速 ω</span><strong data-testid="alternator-speed">{state.speedLabel}</strong></p>
          <p><span>线圈匝数</span><strong>{state.turnsLabel}</strong></p>
          <p><span>线圈面积</span><strong>{state.areaLabel}</strong></p>
          <p><span>磁通量 Φ</span><strong>{state.fluxLabel}</strong></p>
          <p><span>瞬时感应电压</span><strong>{state.voltageLabel}</strong></p>
          <p><span>瞬时电流</span><strong>{state.currentLabel}</strong></p>
          <p><span>频率 f</span><strong>{state.frequencyLabel}</strong></p>
          <p><span>电流方向</span><strong>{state.currentDirectionLabel}</strong></p>
          <p><span>电流表偏角</span><strong>{state.needleAngleLabel}</strong></p>
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
      playback={
        <SceneActions
          actions={[
            {
              key: 'toggle-running',
              label: state.running ? '暂停' : '播放',
              onClick: state.toggleRunning,
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
    />
  )
}

export default AlternatorScene
