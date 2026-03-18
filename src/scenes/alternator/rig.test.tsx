import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@react-three/drei/core/Text', () => ({
  Text: ({
    children,
    anchorX,
    anchorY,
    ...props
  }: {
    children: ReactNode
    anchorX?: unknown
    anchorY?: unknown
  }) => {
    void anchorX
    void anchorY
    return <group {...props}>{children}</group>
  },
}))

import { AlternatorRig3D } from './AlternatorRig3D'

describe('AlternatorRig3D', () => {
  it('renders the reference stator, rotor wires, brushes, and labels', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} theme="night" />
      </svg>,
    )

    expect(container.querySelector('[name="left-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="right-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="rotor-assembly"]')).toBeInTheDocument()
    expect(container.querySelector('[name="orange-wire"]')).toBeInTheDocument()
    expect(container.querySelector('[name="blue-wire"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-left"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-right"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-A"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-B"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-C"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-D"]')).toBeInTheDocument()
  })

  it('includes the reference viewport structures like axis line, field lines, and ammeter', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} theme="night" />
      </svg>,
    )

    expect(container.querySelector('[name="axis-line"]')).toBeInTheDocument()
    expect(container.querySelector('[name="field-lines"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-casing"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-border"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-needle"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ring-orange"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ring-blue"]')).toBeInTheDocument()
  })

  it('keeps the coil, slip rings, and shaft inside one rotating rotor assembly', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} theme="night" />
      </svg>,
    )

    const rotorAssembly = container.querySelector('[name="rotor-assembly"]')
    expect(rotorAssembly).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="orange-wire"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="blue-wire"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="ring-orange"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="ring-blue"]')).toBeInTheDocument()
  })
})
