import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MotionalEmfControls } from '../MotionalEmfControls'

describe('MotionalEmfControls', () => {
  it('renders sliders, preset buttons, and the voltage readout card', () => {
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
        velocityPreset="forward"
        onVelocityPresetChange={() => undefined}
        running={false}
        onToggleRunning={() => undefined}
        onReset={() => undefined}
        signedVoltageV={1}
        polarityText="A 端高电势"
        relationText="B ⟂ v，L ∥ (v × B)"
      />,
    )

    expect(screen.getByRole('heading', { name: '切割磁感线实验控制' })).toBeInTheDocument()
    expect(screen.getByLabelText('磁场 B (T)')).toHaveValue('1')
    expect(screen.getByLabelText('导体棒长度 L (m)')).toHaveValue('0.5')
    expect(screen.getByText('两端电压 U_AB')).toBeInTheDocument()
    expect(screen.getByTestId('motional-emf-voltage-display')).toHaveTextContent('1.00 V')
    expect(screen.getByRole('button', { name: '前进（标准切割）' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '磁场向上' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '磁场向下' })).toBeInTheDocument()
  })

  it('emits callbacks for sliders, field direction, presets, and actions', () => {
    const onSpeedChange = vi.fn()
    const onMagneticFieldDirectionChange = vi.fn()
    const onVelocityPresetChange = vi.fn()
    const onToggleRunning = vi.fn()
    const onReset = vi.fn()

    render(
      <MotionalEmfControls
        magneticFieldT={1}
        onMagneticFieldChange={() => undefined}
        magneticFieldDirection="up"
        onMagneticFieldDirectionChange={onMagneticFieldDirectionChange}
        rodLengthM={0.5}
        onRodLengthChange={() => undefined}
        speedMps={2}
        onSpeedChange={onSpeedChange}
        rodAngleDeg={90}
        onRodAngleChange={() => undefined}
        velocityPreset="forward"
        onVelocityPresetChange={onVelocityPresetChange}
        running={false}
        onToggleRunning={onToggleRunning}
        onReset={onReset}
        signedVoltageV={1}
        polarityText="A 端高电势"
        relationText="B ⟂ v，L ∥ (v × B)"
      />,
    )

    fireEvent.change(screen.getByLabelText('速度 v (m/s)'), { target: { value: '3.5' } })
    fireEvent.click(screen.getByRole('button', { name: '磁场向下' }))
    fireEvent.click(screen.getByRole('button', { name: '与 B 成 45°' }))
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    fireEvent.click(screen.getByRole('button', { name: '重置' }))

    expect(onSpeedChange).toHaveBeenCalledWith(3.5)
    expect(onMagneticFieldDirectionChange).toHaveBeenCalledWith('down')
    expect(onVelocityPresetChange).toHaveBeenCalledWith('angle-45')
    expect(onToggleRunning).toHaveBeenCalled()
    expect(onReset).toHaveBeenCalled()
  })
})
