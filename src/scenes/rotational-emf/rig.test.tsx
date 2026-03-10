import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  FRAME_FIELD_SHAFT_LENGTH,
  ROD_FIELD_SHAFT_LENGTH,
  RotationalEmfRig3D,
} from './RotationalEmfRig3D'

describe('RotationalEmfRig3D', () => {
  it('renders only the rod apparatus in rod mode', () => {
    const { container } = render(
      <svg>
        <RotationalEmfRig3D scenario="rod" angleRad={0} />
      </svg>,
    )

    expect(container.querySelector('[data-rig-scenario="rod"]')).toBeInTheDocument()
    expect(container.querySelector('[data-rig-scenario="frame"]')).not.toBeInTheDocument()
  })

  it('renders only the frame apparatus in frame mode', () => {
    const { container } = render(
      <svg>
        <RotationalEmfRig3D scenario="frame" angleRad={0} />
      </svg>,
    )

    expect(container.querySelector('[data-rig-scenario="frame"]')).toBeInTheDocument()
    expect(container.querySelector('[data-rig-scenario="rod"]')).not.toBeInTheDocument()
  })

  it('uses a longer field span for the frame case so the rotating frame stays inside the magnetic field region', () => {
    expect(FRAME_FIELD_SHAFT_LENGTH).toBeGreaterThan(ROD_FIELD_SHAFT_LENGTH)
    expect(FRAME_FIELD_SHAFT_LENGTH).toBeGreaterThanOrEqual(5)
  })
})
