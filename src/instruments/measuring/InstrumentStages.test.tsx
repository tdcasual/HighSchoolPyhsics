import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CaliperAssembly, CaliperDepthWork } from './CaliperAssembly'
import { MicrometerAssembly } from './MicrometerAssembly'
import { CaliperStage } from './InstrumentStages'
import { caliperPose, micrometerPose } from './pose'

type SceneElement = ReactElement<Record<string, unknown>>

function collectElements(node: ReactNode): SceneElement[] {
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

describe('instrument stages', () => {
  it('drives the caliper frame, screw and depth root from the shared pose', () => {
    const pose = caliperPose({ x: 23.4, exploded: 0.5, locked: true, mode: 'depth' })
    const elements = collectElements(
      CaliperAssembly({ pose, divisions: 20, measure: 'depth', workSize: 23.4, showWork: true, showLabels: false }),
    )
    const frame = elements.find((element) => element.props.name === 'caliper-frame')
    const screw = elements.find((element) => element.props.name === 'caliper-screw')
    const rod = elements.find((element) => element.props.name === 'caliper-rod')
    const root = elements.find((element) => element.props.name === 'caliper-root')

    expect(frame?.props.position).toEqual([23.4, -14, 11])
    expect(screw?.props.position).toEqual([34, 26, 0.2])
    expect(rod?.props.position).toEqual([132.5, 7.8, pose.rodZ])
    expect(root?.props.rotation).toEqual([0, 0, -Math.PI / 2])
    expect(root?.props.position).toEqual([0, 215, 0])

    const depth = collectElements(CaliperStage({
      divisions: 20,
      measure: 'depth',
      caliperX: 23.4,
      caliperExplode: 0.5,
      caliperLocked: true,
      showWork: true,
      showLabels: false,
      workSize: 23.4,
    }))
    const ground = depth.find((element) => element.props.name === 'caliper-ground')
    const depthElements = collectElements(CaliperDepthWork({ pose, size: 23.4, showWork: true }))
    const depthWork = depthElements.find((element) => element.props.name === 'caliper-depth-work')
    const workBoxes = depthElements.filter((element) => element.type === 'boxGeometry')
    expect(ground?.props.position).toEqual([95, -46, 0])
    expect(depthWork?.props.position).toEqual([7.8, 0, -23])
    expect(workBoxes.map((element) => element.props.args)).toEqual([[24, 23.4, 16], [24, 23.4, 16], [60, 0.8, 16]])
  })

  it('puts the thimble rotation and spindle centre on the posed meshes', () => {
    const pose = micrometerPose({ gap: 1.25, zero: 0.01, exploded: 0, locked: false })
    const elements = collectElements(
      MicrometerAssembly({ pose, gap: 1.25, showWork: false, workSize: 1.25, showLabels: false }),
    )
    const thimble = elements.find((element) => element.props.name === 'micrometer-thimble')
    const spindle = elements.find((element) => element.props.name === 'micrometer-spindle')
    const anvil = elements.find((element) => element.props.name === 'micrometer-anvil')

    expect(thimble?.props.position).toEqual([pose.thimbleX, 0, 0])
    expect(thimble?.props.rotation).toEqual([pose.thimbleRotationX, 0, 0])
    expect(spindle?.props.position).toEqual([23.25, 0, 0])
    expect(anvil?.props.position).toEqual([-4.5, 0, 0])
    expect(pose.thimbleRotationX).toBeCloseTo((2 * Math.PI * 1.26) / 0.5, 8)
  })
})
