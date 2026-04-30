import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MotionalEmfControls } from '../MotionalEmfControls'

describe('MotionalEmfControls', () => {
  it('renders both discussion modes and restores the old v-B presets', () => {
    render(
      <MotionalEmfControls
        magneticFieldT={1}
        onMagneticFieldChange={() => undefined}
        magneticFieldDirection="up"
        onMagneticFieldDirectionChange={() => undefined}
        rodLengthM={0.5}
        onRodLengthChange={() => undefined}
        speedMps={2}
        onSpeedChange={() => undefined}
        rodAngleDeg={90}
        onRodAngleChange={() => undefined}
        discussionMode="vb"
        onDiscussionModeChange={() => undefined}
        velocityPreset="forward"
        onVelocityPresetChange={() => undefined}
        rodVelocityAngleDeg={90}
        onRodVelocityAngleChange={() => undefined}
        motionDirection="forward"
        onMotionDirectionChange={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: '按 ∠(v,B) 讨论' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '按 ∠(L,v) 讨论' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '与 B 成 45°' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'L 与 v 成 45°' })).not.toBeInTheDocument()
  })

  it('switches to L-v mode and emits the new callbacks there', () => {
    const onDiscussionModeChange = vi.fn()
    const onRodVelocityAngleChange = vi.fn()
    const onMotionDirectionChange = vi.fn()

    const { rerender } = render(
      <MotionalEmfControls
        magneticFieldT={1}
        onMagneticFieldChange={() => undefined}
        magneticFieldDirection="up"
        onMagneticFieldDirectionChange={() => undefined}
        rodLengthM={0.5}
        onRodLengthChange={() => undefined}
        speedMps={2}
        onSpeedChange={() => undefined}
        rodAngleDeg={90}
        onRodAngleChange={() => undefined}
        discussionMode="vb"
        onDiscussionModeChange={onDiscussionModeChange}
        velocityPreset="forward"
        onVelocityPresetChange={() => undefined}
        rodVelocityAngleDeg={90}
        onRodVelocityAngleChange={onRodVelocityAngleChange}
        motionDirection="forward"
        onMotionDirectionChange={onMotionDirectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '按 ∠(L,v) 讨论' }))
    expect(onDiscussionModeChange).toHaveBeenCalledWith('lv')

    rerender(
      <MotionalEmfControls
        magneticFieldT={1}
        onMagneticFieldChange={() => undefined}
        magneticFieldDirection="up"
        onMagneticFieldDirectionChange={() => undefined}
        rodLengthM={0.5}
        onRodLengthChange={() => undefined}
        speedMps={2}
        onSpeedChange={() => undefined}
        rodAngleDeg={90}
        onRodAngleChange={() => undefined}
        discussionMode="lv"
        onDiscussionModeChange={onDiscussionModeChange}
        velocityPreset="forward"
        onVelocityPresetChange={() => undefined}
        rodVelocityAngleDeg={90}
        onRodVelocityAngleChange={onRodVelocityAngleChange}
        motionDirection="forward"
        onMotionDirectionChange={onMotionDirectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'L 与 v 成 45°' }))
    fireEvent.click(screen.getByRole('button', { name: '反向运动' }))

    expect(onRodVelocityAngleChange).toHaveBeenCalledWith(45)
    expect(onMotionDirectionChange).toHaveBeenCalledWith('backward')
  })
})
