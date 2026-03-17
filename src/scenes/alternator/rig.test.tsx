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
  it('renders poles, coil labels, brushes, and shaft', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} />
      </svg>,
    )

    expect(container.querySelector('[name="left-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="right-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="coil-loop"]')).toBeInTheDocument()
    expect(container.querySelector('[name="shaft"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-left"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-right"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-A"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-B"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-C"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-D"]')).toBeInTheDocument()
  })

  it('keeps the coil, slip rings, and shaft inside one rotating rotor assembly', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} />
      </svg>,
    )

    const rotorAssembly = container.querySelector('[name="rotor-assembly"]')
    expect(rotorAssembly).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="coil-loop"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="slip-ring-front"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="slip-ring-back"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="shaft"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="iron-core"]')).toBeInTheDocument()
  })
})
