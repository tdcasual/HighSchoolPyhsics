import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CircuitAssembly } from './CircuitAssembly'
import { circuitPose } from './circuitPose'

type SceneElement = ReactElement<Record<string, unknown>>

function collect(node: ReactNode): SceneElement[] {
  const elements: SceneElement[] = []
  const visit = (value: ReactNode) => {
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
  it('puts the slider, clip and meter needles on the posed groups', () => {
    const pose = circuitPose({ lengthCm: 50, slider: 1, closed: false, ammeterFraction: 0, voltmeterFraction: 1, temperatureRise: 0 })
    const elements = collect(CircuitAssembly({ pose, wires: [] }))
    expect(elements.find((element) => element.props.name === 'circuit-slider')?.props.position).toEqual([15, 0, 0])
    expect(elements.find((element) => element.props.name === 'circuit-clip')?.props.position).toEqual([25, 0, 0])
    expect(elements.find((element) => element.props.name === 'circuit-blade')?.props.rotation).toEqual([0, 0, pose.bladeRotation])
    expect(elements.find((element) => element.props.name === 'ammeter-needle')?.props.rotation).toEqual([0, 0, pose.ammeterRotation])
    const voltmeter = elements.find((element) => element.props.name === 'voltmeter-needle')?.props.rotation as [number, number, number]
    expect(voltmeter[2]).toBeCloseTo(-Math.PI / 4, 8)
    expect(pose.ammeterRotation).toBeCloseTo(Math.PI / 4, 8)
  })
})
