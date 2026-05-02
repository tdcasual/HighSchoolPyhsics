import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MhdControls } from '../MhdControls'

describe('MhdControls', () => {
  it('renders core sliders', () => {
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
      />,
    )

    expect(screen.getByRole('heading', { name: '磁流体发电机控制' })).toBeInTheDocument()
    expect(screen.getByLabelText('磁场 B')).toHaveValue('1.4')
    expect(screen.getByLabelText('等离子体速度 v')).toHaveValue('1800')
  })

  it('emits callbacks for slider changes', () => {
    const onMagneticFieldChange = vi.fn()

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
      />,
    )

    fireEvent.change(screen.getByLabelText('磁场 B'), { target: { value: '2.2' } })
    expect(onMagneticFieldChange).toHaveBeenCalledWith(2.2)
  })
})
