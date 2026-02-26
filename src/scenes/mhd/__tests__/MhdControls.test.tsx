import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MhdControls } from '../MhdControls'

describe('MhdControls', () => {
  it('renders core sliders and voltage panel', () => {
    render(
      <MhdControls
        magneticFieldT={1.4}
        onMagneticFieldChange={() => undefined}
        plasmaVelocityMps={1800}
        onPlasmaVelocityChange={() => undefined}
        plasmaDensityRatio={1}
        onPlasmaDensityChange={() => undefined}
        electrodeGapM={0.35}
        onElectrodeGapChange={() => undefined}
        conductivitySPerM={14}
        onConductivityChange={() => undefined}
        running={false}
        onToggleRunning={() => undefined}
        onReset={() => undefined}
        voltageDisplayV={120.5}
      />,
    )

    expect(screen.getByRole('heading', { name: '磁流体发电机控制' })).toBeInTheDocument()
    expect(screen.getByLabelText('磁场 B (T)')).toHaveValue('1.4')
    expect(screen.getByLabelText('等离子体速度 v (m/s)')).toHaveValue('1800')
    expect(screen.getByText('两端电压 U_AB')).toBeInTheDocument()
    expect(screen.getByTestId('mhd-voltage-display')).toHaveTextContent('120.5 V')
  })

  it('emits callbacks for slider and actions', () => {
    const onMagneticFieldChange = vi.fn()
    const onToggleRunning = vi.fn()
    const onReset = vi.fn()

    render(
      <MhdControls
        magneticFieldT={1}
        onMagneticFieldChange={onMagneticFieldChange}
        plasmaVelocityMps={1200}
        onPlasmaVelocityChange={() => undefined}
        plasmaDensityRatio={1}
        onPlasmaDensityChange={() => undefined}
        electrodeGapM={0.3}
        onElectrodeGapChange={() => undefined}
        conductivitySPerM={12}
        onConductivityChange={() => undefined}
        running={true}
        onToggleRunning={onToggleRunning}
        onReset={onReset}
        voltageDisplayV={20}
      />,
    )

    fireEvent.change(screen.getByLabelText('磁场 B (T)'), { target: { value: '2.2' } })
    expect(onMagneticFieldChange).toHaveBeenCalledWith(2.2)

    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    expect(onToggleRunning).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(onReset).toHaveBeenCalled()
  })
})
