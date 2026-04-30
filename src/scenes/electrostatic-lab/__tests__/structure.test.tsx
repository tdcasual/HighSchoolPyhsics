import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'

const { mockUseElectrostaticLabState, mockControls, mockRig } = vi.hoisted(() => ({
  mockUseElectrostaticLabState: vi.fn(),
  mockControls: vi.fn(),
  mockRig: vi.fn(),
}))

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="interactive-canvas">{children}</div>
  ),
}))

vi.mock('../ElectrostaticLabControls', () => ({
  ElectrostaticLabControls: ({ state }: { state: unknown }) => {
    mockControls(state)
    return <div data-testid="electrostatic-lab-controls" />
  },
}))

vi.mock('../ElectrostaticLabRig3D', () => ({
  ElectrostaticLabRig3D: (props: unknown) => {
    mockRig(props)
    return <div data-testid="electrostatic-lab-rig" />
  },
}))

vi.mock('../useElectrostaticLabState', () => ({
  ELECTROSTATIC_LAB_SCENE_BOUNDS: 7,
  useElectrostaticLabState: () => mockUseElectrostaticLabState(),
}))

import { ElectrostaticLabScene } from '../ElectrostaticLabScene'

function createMockState(overrides: Record<string, unknown> = {}) {
  return {
    presetLabel: '电偶极子',
    chargeSummary: {
      positiveCount: 2,
      negativeCount: 1,
      netCharge: 1.2,
    },
    terrain: {
      stats: {
        minPotential: -2.4,
        maxPotential: 3.1,
      },
    },
    modeLabel: '电势地形',
    probeReadout: null,
    charges: [],
    fieldLines: [],
    displayMode: 'potential',
    overlayFieldLines: true,
    showContourLines: true,
    selectedChargeId: 'C1',
    probeMode: false,
    probePoint: null,
    advancedInteractionsEnabled: false,
    selectCharge: vi.fn(),
    setProbePoint: vi.fn(),
    setChargePosition: vi.fn(),
    addChargeAtPoint: vi.fn(),
    deleteChargeById: vi.fn(),
    ...overrides,
  }
}

describe('electrostatic-lab structure', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/electrostatic-lab')
    useAppStore.setState({
      activeScenePath: '/electrostatic-lab',
    })
    mockUseElectrostaticLabState.mockReset()
    mockControls.mockReset()
    mockRig.mockReset()
    mockUseElectrostaticLabState.mockReturnValue(createMockState())
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      activeScenePath: '/',
    })
  })

  it('keeps scene shell focused on composing controls and viewport', () => {
    render(<ElectrostaticLabScene />)

    const state = mockUseElectrostaticLabState.mock.results[0]?.value

    expect(mockUseElectrostaticLabState).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('interactive-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('electrostatic-lab-controls')).toBeInTheDocument()
    expect(screen.getByTestId('electrostatic-lab-rig')).toBeInTheDocument()
    expect(mockControls).toHaveBeenCalledWith(state)
    expect(mockRig).toHaveBeenCalledWith(
      expect.objectContaining({
        bounds: 7,
        charges: state.charges,
        terrain: state.terrain,
        fieldLines: state.fieldLines,
        displayMode: state.displayMode,
        overlayFieldLines: state.overlayFieldLines,
        showContourLines: state.showContourLines,
        selectedChargeId: state.selectedChargeId,
        probeMode: state.probeMode,
        probePoint: state.probePoint,
        advancedInteractionsEnabled: state.advancedInteractionsEnabled,
        onSelectCharge: state.selectCharge,
        onProbePointChange: state.setProbePoint,
        onChargePositionChange: state.setChargePosition,
        onAddChargeAt: state.addChargeAtPoint,
        onDeleteCharge: state.deleteChargeById,
      }),
    )
  })

  it('renders data overlay from hook state', () => {
    mockUseElectrostaticLabState.mockReturnValue(
      createMockState({
        presetLabel: '双极子基线',
        chargeSummary: { positiveCount: 1, negativeCount: 1, netCharge: 0 },
        terrain: { stats: { minPotential: -3.1, maxPotential: 2.6 } },
        modeLabel: '电场线',
        probeReadout: { potential: 1.2345, field: { ex: 0, ez: 0, magnitude: 2.3456 } },
      }),
    )

    render(<ElectrostaticLabScene />)

    expect(screen.getByText(/电荷方案: 双极子基线/)).toBeInTheDocument()
    expect(screen.getByText(/势场范围: -3.10 ~ 2.60/)).toBeInTheDocument()
    expect(screen.getByText(/当前模式: 电场线/)).toBeInTheDocument()
    expect(screen.getByText(/探针读数: V=1.23, \|E\|=2.35/)).toBeInTheDocument()
  })
})
