import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CircuitAssembly } from './CircuitAssembly'
import { circuitPose, terminalPosition } from './circuitPose'

type SceneElement = ReactElement<Record<string, unknown>>

function collect(node: ReactNode): SceneElement[] {
  const elements: SceneElement[] = []
  const visit = (value: ReactNode) => {
    if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return
    if (!isValidElement<Record<string, unknown>>(value)) {
      Children.forEach(value, visit)
      return
    }
    elements.push(value)
    visit(value.props.children as ReactNode)
  }
  visit(node)
  return elements
}

describe('resistivity rig', () => {
  it('uses a direct adjustable supply without a decorative rheostat in I–U mode', () => {
    const pose = circuitPose({ lengthCm: 50, slider: 1, closed: true, ammeterFraction: 0.3, voltmeterFraction: 0.2, temperatureRise: 0 })
    const elements = collect(CircuitAssembly({ pose, wires: [], ivMode: true, elementVoltage: -0.8 }))
    expect(elements.some((element) => element.props.name === 'circuit-slider')).toBe(false)
    expect(elements.some((element) => element.props.name === 'rheostat-coil')).toBe(false)
    expect(elements.some((element) => element.props.name === 'terminal-rheostat-wiper')).toBe(false)
    expect(elements.find((element) => element.props.name === 'terminal-battery-positive')).toBeTruthy()
    expect(elements.find((element) => element.props.name === 'terminal-battery-negative')).toBeTruthy()
  })

  it('puts the slider, clip and meter needles on the posed groups', () => {
    const pose = circuitPose({ lengthCm: 50, slider: 1, closed: false, ammeterFraction: 0, voltmeterFraction: 1, temperatureRise: 0 })
    const elements = collect(CircuitAssembly({ pose, wires: [] }))
    expect(elements.find((element) => element.props.name === 'circuit-slider')?.props.position).toEqual([15, 0, 0])
    expect(terminalPosition('rh-w', pose)).toEqual([15, 9.9, -14])
    expect(elements.find((element) => element.props.name === 'terminal-rheostat-wiper')?.props.position).toEqual([0, 9.9, -14])
    expect(elements.find((element) => element.props.name === 'circuit-fixed-clip')?.props.position).toEqual([-25, 0, 0])
    expect(elements.find((element) => element.props.name === 'circuit-clip')?.props.position).toEqual([25, 0, 0])
    expect(elements.find((element) => element.props.name === 'terminal-sample-moving')?.props.position).toEqual([0, 4.85, 11.2])
    expect(elements.find((element) => element.props.name === 'circuit-blade')?.props.rotation).toEqual([0, 0, pose.bladeRotation])
    expect(elements.find((element) => element.props.name === 'ammeter-needle')?.props.rotation).toEqual([0, 0, pose.ammeterRotation])
    const voltmeter = elements.find((element) => element.props.name === 'voltmeter-needle')?.props.rotation as [number, number, number]
    expect(voltmeter[2]).toBeCloseTo(-Math.PI / 4, 8)
    expect(pose.ammeterRotation).toBeCloseTo(Math.PI / 4, 8)
  })
})
