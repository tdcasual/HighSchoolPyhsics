import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { AlternatorChart } from './AlternatorChart'
import type { AlternatorSceneState } from './useAlternatorSceneState'

type AlternatorControlsProps = {
  state: Pick<
    AlternatorSceneState,
    | 'magneticFieldT'
    | 'setMagneticFieldT'
    | 'angularSpeedRad'
    | 'setAngularSpeedRad'
    | 'turnCount'
    | 'setTurnCount'
    | 'coilAreaM2'
    | 'setCoilAreaM2'
    | 'running'
    | 'toggleRunning'
    | 'reset'
    | 'speedLabel'
    | 'turnsLabel'
    | 'areaLabel'
    | 'fluxLabel'
    | 'voltageLabel'
    | 'currentLabel'
    | 'frequencyLabel'
    | 'currentDirectionLabel'
    | 'needleAngleLabel'
    | 'timeLabel'
    | 'history'
    | 'instantaneousVoltageV'
    | 'peakVoltageV'
  >
}

export function AlternatorControls({ state }: AlternatorControlsProps) {
  return (
    <div className="alternator-controls">
      <h2>交流发电机控制</h2>

      <RangeField
        id="alternator-speed"
        label="转速 ω (rad/s)"
        min={0.5}
        max={12}
        step={0.1}
        value={state.angularSpeedRad}
        onChange={state.setAngularSpeedRad}
      />
      <RangeField
        id="alternator-b"
        label="磁场 B (T)"
        min={0.4}
        max={1.8}
        step={0.1}
        value={state.magneticFieldT}
        onChange={state.setMagneticFieldT}
      />
      <RangeField
        id="alternator-turns"
        label="线圈匝数 N"
        min={8}
        max={32}
        step={1}
        value={state.turnCount}
        onChange={state.setTurnCount}
      />
      <RangeField
        id="alternator-area"
        label="线圈面积 S (m²)"
        min={0.08}
        max={0.36}
        step={0.01}
        value={state.coilAreaM2}
        onChange={state.setCoilAreaM2}
      />

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

      <div
        className="alternator-chart-card"
        data-presentation-signal="chart time-series"
      >
        <AlternatorChart
          voltageHistory={state.history.voltage}
          currentVoltageV={state.instantaneousVoltageV}
          currentTimeLabel={state.timeLabel}
          peakVoltageV={state.peakVoltageV}
        />
      </div>

      <div
        className="alternator-telemetry"
        data-presentation-signal="live-metric interactive-readout"
      >
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
    </div>
  )
}
