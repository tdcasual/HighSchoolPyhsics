import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import {
  MAGNETIC_FIELD_DIRECTION_LABELS,
  type MagneticFieldDirection,
  VELOCITY_PRESET_LABELS,
  type VelocityPreset,
} from './model'

type MotionalEmfControlsProps = {
  magneticFieldT: number
  onMagneticFieldChange: (value: number) => void
  magneticFieldDirection: MagneticFieldDirection
  onMagneticFieldDirectionChange: (value: MagneticFieldDirection) => void
  rodLengthM: number
  onRodLengthChange: (value: number) => void
  speedMps: number
  onSpeedChange: (value: number) => void
  rodAngleDeg: number
  onRodAngleChange: (value: number) => void
  velocityPreset: VelocityPreset
  onVelocityPresetChange: (value: VelocityPreset) => void
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  signedVoltageV: number
  polarityText: string
  relationText: string
}

const VELOCITY_PRESET_ORDER: VelocityPreset[] = [
  'forward',
  'backward',
  'up',
  'down',
  'angle-30',
  'angle-45',
  'angle-60',
]

const MAGNETIC_FIELD_DIRECTIONS: MagneticFieldDirection[] = ['up', 'down']

export function MotionalEmfControls({
  magneticFieldT,
  onMagneticFieldChange,
  magneticFieldDirection,
  onMagneticFieldDirectionChange,
  rodLengthM,
  onRodLengthChange,
  speedMps,
  onSpeedChange,
  rodAngleDeg,
  onRodAngleChange,
  velocityPreset,
  onVelocityPresetChange,
  running,
  onToggleRunning,
  onReset,
  signedVoltageV,
  polarityText,
  relationText,
}: MotionalEmfControlsProps) {
  return (
    <div className="motional-emf-controls">
      <h2>切割磁感线实验控制</h2>

      <RangeField
        id="motional-emf-b"
        label="磁场 B (T)"
        min={0.2}
        max={3}
        step={0.1}
        value={magneticFieldT}
        onChange={onMagneticFieldChange}
      />

      <div className="subsection">
        <h3>磁场方向</h3>
        <div className="motional-emf-b-direction-grid">
          {MAGNETIC_FIELD_DIRECTIONS.map((direction) => (
            <button
              key={direction}
              type="button"
              className={`touch-target motional-emf-preset ${magneticFieldDirection === direction ? 'active' : ''}`.trim()}
              aria-pressed={magneticFieldDirection === direction}
              onClick={() => onMagneticFieldDirectionChange(direction)}
            >
              {`磁场${MAGNETIC_FIELD_DIRECTION_LABELS[direction]}`}
            </button>
          ))}
        </div>
      </div>

      <RangeField
        id="motional-emf-l"
        label="导体棒长度 L (m)"
        min={0.2}
        max={1.2}
        step={0.05}
        value={rodLengthM}
        onChange={onRodLengthChange}
      />

      <RangeField
        id="motional-emf-v"
        label="速度 v (m/s)"
        min={0}
        max={5}
        step={0.1}
        value={speedMps}
        onChange={onSpeedChange}
      />

      <RangeField
        id="motional-emf-angle"
        label="导体棒与磁场夹角 θ (°)"
        min={0}
        max={90}
        step={15}
        value={rodAngleDeg}
        onChange={onRodAngleChange}
      />

      <div className="subsection">
        <h3>速度方向预设</h3>
        <div className="motional-emf-preset-grid">
          {VELOCITY_PRESET_ORDER.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`touch-target motional-emf-preset ${velocityPreset === preset ? 'active' : ''}`.trim()}
              aria-pressed={velocityPreset === preset}
              onClick={() => onVelocityPresetChange(preset)}
            >
              {VELOCITY_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
      </div>

      <SceneActions
        actions={[
          {
            key: 'toggle-running',
            label: running ? '暂停' : '播放',
            onClick: onToggleRunning,
          },
          {
            key: 'reset',
            label: '重置',
            onClick: onReset,
          },
        ]}
      />

      <div
        className="motional-emf-voltage-card"
        data-presentation-signal="live-metric interactive-readout"
      >
        <p className="motional-emf-voltage-label">两端电压 U_AB</p>
        <p className="motional-emf-voltage-value" data-testid="motional-emf-voltage-display">
          {signedVoltageV.toFixed(2)} V
        </p>
        <p className="motional-emf-voltage-detail">极性：{polarityText}</p>
        <p className="motional-emf-voltage-detail">关系：{relationText}</p>
        <p className="motional-emf-voltage-detail">磁场方向：{MAGNETIC_FIELD_DIRECTION_LABELS[magneticFieldDirection]}</p>
      </div>
    </div>
  )
}
