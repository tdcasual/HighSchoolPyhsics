import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import type { PresentationSignal } from '../../ui/layout/presentationSignals'
import { AlternatorControls } from './AlternatorControls'
import { ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD, AlternatorRig3D } from './AlternatorRig3D'
import { useAlternatorSceneState } from './useAlternatorSceneState'
import './alternator.css'

const presentationSignals: PresentationSignal[] = ['chart', 'time-series', 'live-metric', 'interactive-readout']

export function AlternatorScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useAlternatorSceneState()
  const viewportSpeedValue = Math.max(0, Math.min(0.1, state.angularSpeedRad / 120))
  const viewportRotorAngleRad = state.angleRad + ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD
  const viewportDemonstrationCurrent = Math.cos(viewportRotorAngleRad)
  const viewportDemonstrationVoltageV = viewportDemonstrationCurrent * 10
  const emfToneClass = viewportDemonstrationVoltageV >= 0 ? 'alternator-emf-positive' : 'alternator-emf-negative'
  const viewportEmfLabel = `${viewportDemonstrationVoltageV >= 0 ? '+' : ''}${viewportDemonstrationVoltageV.toFixed(2)} V`
  const viewportNeedleAngleRad = -viewportDemonstrationCurrent * (Math.PI / 3)

  return (
    <SceneLayout
      presentationSignals={presentationSignals}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>转速 ω: {state.speedLabel}</p>
          <p>频率 f: {state.frequencyLabel}</p>
          <p>感应电压 e: {state.voltageLabel}</p>
          <p>电流表偏角: {state.needleAngleLabel}</p>
        </div>
      }
      controls={<AlternatorControls state={state} />}
      viewport={
        <div className="alternator-viewport">
          <div className="alternator-overlay alternator-overlay-top">
            <h2>交流发电机原理模型</h2>
            <p>注意观察蓝线是如何穿过橙色滑环空心的</p>
          </div>

          <div className="alternator-overlay alternator-emf-panel">
            感应电动势:
            <span className={emfToneClass}>{viewportEmfLabel}</span>
          </div>

          <div className="alternator-overlay alternator-legend">
            <h3>机械结构图例</h3>
            <p><span className="alternator-legend-chip alternator-chip-orange" />N极定子 &amp; 橙色线圈组</p>
            <p><span className="alternator-legend-chip alternator-chip-blue" />S极定子 &amp; 蓝色线圈组</p>
            <p><span className="alternator-legend-chip alternator-chip-ring" />空心滑环 (Slip Rings)</p>
            <p><span className="alternator-legend-chip alternator-chip-brush" />碳刷与外电路</p>
            <p><span className="alternator-legend-chip alternator-chip-field" />磁感线 (虚线)</p>
          </div>

          <div className="alternator-overlay alternator-speed-panel">
            <label htmlFor="alternator-viewport-speed">转子转速 (ω):</label>
            <input
              id="alternator-viewport-speed"
              type="range"
              min={0}
              max={0.1}
              step={0.001}
              value={viewportSpeedValue}
              onChange={(event) => state.setAngularSpeedRad(Number(event.target.value) * 120)}
            />
          </div>

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
        </div>
      }
    />
  )
}

export default AlternatorScene
