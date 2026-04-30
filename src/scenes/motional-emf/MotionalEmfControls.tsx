import { RangeField } from '../../ui/controls/RangeField'
import {
  DISCUSSION_MODE_LABELS,
  MAGNETIC_FIELD_DIRECTION_LABELS,
  MOTION_DIRECTION_LABELS,
  ROD_VELOCITY_ANGLE_LABELS,
  ROD_VELOCITY_ANGLE_OPTIONS,
  VELOCITY_PRESET_LABELS,
  VELOCITY_PRESET_ORDER,
  type DiscussionMode,
  type MagneticFieldDirection,
  type MotionDirectionPreset,
  type RodVelocityAnglePreset,
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
  discussionMode: DiscussionMode
  onDiscussionModeChange: (value: DiscussionMode) => void
  velocityPreset: VelocityPreset
  onVelocityPresetChange: (value: VelocityPreset) => void
  rodVelocityAngleDeg: RodVelocityAnglePreset
  onRodVelocityAngleChange: (value: RodVelocityAnglePreset) => void
  motionDirection: MotionDirectionPreset
  onMotionDirectionChange: (value: MotionDirectionPreset) => void
}

const MAGNETIC_FIELD_DIRECTIONS: MagneticFieldDirection[] = ['up', 'down']
const DISCUSSION_MODES: DiscussionMode[] = ['vb', 'lv']
const MOTION_DIRECTIONS: MotionDirectionPreset[] = ['forward', 'backward']

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
  discussionMode,
  onDiscussionModeChange,
  velocityPreset,
  onVelocityPresetChange,
  rodVelocityAngleDeg,
  onRodVelocityAngleChange,
  motionDirection,
  onMotionDirectionChange,
}: MotionalEmfControlsProps) {
  return (
    <div className="motional-emf-controls">
      <h2>切割磁感线实验控制</h2>

      <div className="subsection">
        <h3>讨论模式</h3>
        <div className="motional-emf-b-direction-grid">
          {DISCUSSION_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`touch-target motional-emf-preset ${discussionMode === mode ? 'active' : ''}`.trim()}
              aria-pressed={discussionMode === mode}
              onClick={() => onDiscussionModeChange(mode)}
            >
              {DISCUSSION_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

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

      {discussionMode === 'vb' ? (
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
      ) : (
        <>
          <div className="subsection">
            <h3>运动方向</h3>
            <div className="motional-emf-b-direction-grid">
              {MOTION_DIRECTIONS.map((direction) => (
                <button
                  key={direction}
                  type="button"
                  className={`touch-target motional-emf-preset ${motionDirection === direction ? 'active' : ''}`.trim()}
                  aria-pressed={motionDirection === direction}
                  onClick={() => onMotionDirectionChange(direction)}
                >
                  {MOTION_DIRECTION_LABELS[direction]}
                </button>
              ))}
            </div>
          </div>

          <div className="subsection">
            <h3>L 与 v 夹角预设</h3>
            <div className="motional-emf-preset-grid">
              {ROD_VELOCITY_ANGLE_OPTIONS.map((angle) => (
                <button
                  key={angle}
                  type="button"
                  className={`touch-target motional-emf-preset ${rodVelocityAngleDeg === angle ? 'active' : ''}`.trim()}
                  aria-pressed={rodVelocityAngleDeg === angle}
                  onClick={() => onRodVelocityAngleChange(angle)}
                >
                  {ROD_VELOCITY_ANGLE_LABELS[angle]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
