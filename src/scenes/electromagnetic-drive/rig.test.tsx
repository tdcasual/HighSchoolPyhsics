import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { ElectromagneticDriveRig3D } from './ElectromagneticDriveRig3D'

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

describe('electromagnetic-drive rig', () => {
  it('keeps the crank handle vertical while the crank group rotates with the magnet', () => {
    const tree = ElectromagneticDriveRig3D({ magnetAngle: 1.25, frameAngle: 0.4 })
    const elements = collectElements(tree)

    const crankGroup = elements.find((element) => {
      const position = element.props.position
      return element.type === 'group'
        && Array.isArray(position)
        && position[0] === 0
        && position[1] === 8.65
        && position[2] === 0
    })
    const handleMesh = elements.find((element) => {
      const position = element.props.position
      return element.type === 'mesh'
        && Array.isArray(position)
        && position[0] === 1.6
        && position[1] === 2
        && position[2] === 0
    })

    expect(crankGroup).toBeDefined()
    expect(crankGroup?.props.rotation).toEqual([0, 1.25, 0])
    expect(handleMesh).toBeDefined()
    expect(handleMesh?.props.rotation).toBeUndefined()
  })
})
