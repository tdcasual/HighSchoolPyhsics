import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ElectrostaticLabControls } from '../ElectrostaticLabControls'

function createState(overrides: Record<string, unknown> = {}) {
  return {
    presetKey: 'dipole',
    applyPreset: vi.fn(),
    modeLabel: '电势地形',
    displayMode: 'potential',
    setDisplayMode: vi.fn(),
    overlayFieldLines: true,
    setOverlayFieldLines: vi.fn(),
    showContourLines: true,
    setShowContourLines: vi.fn(),
    invertHeight: false,
    setInvertHeight: vi.fn(),
    advancedInteractionsEnabled: false,
    toggleAdvancedInteractions: vi.fn(),
    addPositiveCharge: vi.fn(),
    addNegativeCharge: vi.fn(),
    deleteSelectedCharge: vi.fn(),
    probeMode: false,
    toggleProbeMode: vi.fn(),
    selectedChargeId: 'C1',
    selectCharge: vi.fn(),
    charges: [{ id: 'C1', magnitude: 1.5 }],
    selectedCharge: { id: 'C1', magnitude: 1.5, x: 0.5, z: -0.5 },
    updateSelectedCharge: vi.fn(),
    resolution: 24,
    setResolution: vi.fn(),
    chargeSummary: {
      positiveCount: 1,
      negativeCount: 0,
      netCharge: 1.5,
    },
    terrain: {
      stats: {
        minPotential: -1.25,
        maxPotential: 3.5,
      },
    },
    probePoint: null,
    probeReadout: null,
    ...overrides,
  }
}

describe('ElectrostaticLabControls', () => {
  it('exposes pressed state for preset, display mode, and advanced interaction toggles', () => {
    render(<ElectrostaticLabControls state={createState() as never} />)

    expect(screen.getByRole('radio', { name: '电偶极子' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '单点电荷' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: '电势地形' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '电场线' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('button', { name: '开启进阶交互' })).toHaveAttribute('aria-pressed', 'false')
  })
})
