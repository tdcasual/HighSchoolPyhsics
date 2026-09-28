import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@react-three/drei/web/Html', () => ({
  Html: ({ children }: { children: ReactNode }) => <group>{children}</group>,
}))

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
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} currentA={0.5} isMeterOverRange={false} theme="night" />
      </svg>,
    )

    expect(container.querySelector('[name="left-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="right-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="rotor-assembly"]')).toBeInTheDocument()
    expect(container.querySelector('[name="orange-wire"]')).toBeInTheDocument()
    expect(container.querySelector('[name="blue-wire"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-left"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-right"]')).toBeInTheDocument()
    expect(container.textContent).toContain('A')
    expect(container.textContent).toContain('B')
    expect(container.textContent).toContain('C')
    expect(container.textContent).toContain('D')
    expect(container.querySelector('[name="current-indicators"]')).toBeInTheDocument()
    expect(container.querySelector('[name="current-arrow-left"]')).toBeInTheDocument()
    expect(container.querySelector('[name="current-arrow-right"]')).toBeInTheDocument()
  })

  it('includes the reference viewport structures like axis line, field lines, and ammeter', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} currentA={0.5} isMeterOverRange={false} theme="night" />
      </svg>,
    )

    expect(container.querySelector('[name="axis-line"]')).toBeInTheDocument()
    expect(container.querySelector('[name="field-lines"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-casing"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-border"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-needle"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-major-tick-0"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ammeter-minor-tick-1"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ring-orange"]')).toBeInTheDocument()
    expect(container.querySelector('[name="ring-blue"]')).toBeInTheDocument()
  })

  it('keeps the coil, slip rings, and shaft inside one rotating rotor assembly', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} currentA={0.5} isMeterOverRange={false} theme="night" />
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
