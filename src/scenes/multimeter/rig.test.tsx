import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { MeterAssembly } from './MeterAssembly'
import { NEEDLE_PIVOT_Y, meterPose } from './pose'

type SceneElement = ReactElement<Record<string, unknown>>

function collect(node: ReactNode): SceneElement[] {
  const elements: SceneElement[] = []
  const visit = (value: ReactNode) => {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return
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

describe('multimeter rig', () => {
  it('mounts the needle, knob and probes from the shared pose', () => {
    const pose = meterPose({
      fraction: 0,
      range: 'V2.5',
      mechanicalSlider: 0,
      ohmSlider: 0,
      target: 'cell',
      swapped: false,
    })
    const elements = collect(MeterAssembly({ pose }))
    const needle = elements.find((element) => element.props.name === 'meter-needle')
    const knob = elements.find((element) => element.props.name === 'meter-knob')
    const red = elements.find((element) => element.props.name === 'probe-red')
    expect(needle?.props.position).toEqual([0, NEEDLE_PIVOT_Y, 2.06])
    expect(needle?.props.rotation).toEqual([0, 0, pose.needle])
    expect(knob?.props.rotation).toEqual([0, 0, pose.knob])
    expect(red?.props.position).toEqual([-5.6, 2.7, 9])
    expect(pose.needle).toBeCloseTo((48 * Math.PI) / 180, 8)
  })
})
