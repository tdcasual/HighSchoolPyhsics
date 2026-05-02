import { RangeField } from '../../ui/controls/RangeField'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { ControlSection } from '../../ui/controls/ControlSection'
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

      <ControlSection title="讨论模式">
        <SegmentedControl
          options={DISCUSSION_MODES.map((mode) => ({
            key: mode,
            label: DISCUSSION_MODE_LABELS[mode],
          }))}
          value={discussionMode}
          onChange={(key) => onDiscussionModeChange(key as DiscussionMode)}
        />
      </ControlSection>

      <ControlSection title="磁场参数">
        <RangeField
          id="motional-emf-b"
          label="磁场 B"
          unit="T"
          min={0.2}
          max={3}
          step={0.1}
          value={magneticFieldT}
          onChange={onMagneticFieldChange}
        />

        <SegmentedControl
          options={MAGNETIC_FIELD_DIRECTIONS.map((direction) => ({
            key: direction,
            label: `磁场${MAGNETIC_FIELD_DIRECTION_LABELS[direction]}`,
          }))}
          value={magneticFieldDirection}
          onChange={(key) => onMagneticFieldDirectionChange(key as MagneticFieldDirection)}
        />
      </ControlSection>

      <ControlSection title="导体棒参数">
        <RangeField
          id="motional-emf-l"
          label="导体棒长度 L"
          unit="m"
          min={0.2}
          max={1.2}
          step={0.05}
          value={rodLengthM}
          onChange={onRodLengthChange}
        />

        <RangeField
          id="motional-emf-v"
          label="速度 v"
          unit="m/s"
          min={0}
          max={5}
          step={0.1}
          value={speedMps}
          onChange={onSpeedChange}
        />

        <RangeField
          id="motional-emf-angle"
          label="导体棒与磁场夹角 θ"
          unit="°"
          min={0}
          max={90}
          step={15}
          value={rodAngleDeg}
          onChange={onRodAngleChange}
        />
      </ControlSection>

      {discussionMode === 'vb' ? (
        <ControlSection title="速度方向预设">
          <SegmentedControl
            options={VELOCITY_PRESET_ORDER.map((preset) => ({
              key: preset,
              label: VELOCITY_PRESET_LABELS[preset],
            }))}
            value={velocityPreset}
            onChange={(key) => onVelocityPresetChange(key as VelocityPreset)}
            columns={3}
          />
        </ControlSection>
      ) : (
        <>
          <ControlSection title="运动方向">
            <SegmentedControl
              options={MOTION_DIRECTIONS.map((direction) => ({
                key: direction,
                label: MOTION_DIRECTION_LABELS[direction],
              }))}
              value={motionDirection}
              onChange={(key) => onMotionDirectionChange(key as MotionDirectionPreset)}
            />
          </ControlSection>

          <ControlSection title="L 与 v 夹角预设">
            <SegmentedControl
              options={ROD_VELOCITY_ANGLE_OPTIONS.map((angle) => ({
                key: String(angle),
                label: ROD_VELOCITY_ANGLE_LABELS[angle],
              }))}
              value={String(rodVelocityAngleDeg)}
              onChange={(key) => onRodVelocityAngleChange(Number(key) as RodVelocityAnglePreset)}
              columns={3}
            />
          </ControlSection>
        </>
      )}
    </div>
  )
}
