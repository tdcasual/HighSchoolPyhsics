import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CelestialRig3D } from './CelestialRig3D'
import { scenarioOf } from './model'
import { celestialPose } from './pose'

type SceneElement = ReactElement<Record<string, unknown>>

function collect(node: ReactNode): SceneElement[] {
  const elements: SceneElement[] = []
  const visit = (value: ReactNode) => {
    if (typeof value === 'string' || typeof value === 'number' || value == null || typeof value === 'boolean') return
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

function named(elements: SceneElement[], name: string) {
  return elements.filter((element) => element.props.name === name)
}

describe('celestial rig', () => {
  it('places the satellite, north pole and equator plane from the shared pose', () => {
    const scenario = scenarioOf({ mode: 'circular', body: 'earth', r1: 1.1, r2: 3, phaseDeg: 90, inclinationDeg: 0, time: 0 })
    const pose = celestialPose({ scenario, showVectors: true, showArea: true, showPlane: true, corotate: false })
    const elements = collect(CelestialRig3D({ pose }))
    expect(named(elements, 'satellite')[0]?.props.position).toEqual(pose.satellites[0]?.position)
    expect(named(elements, 'north-pole')[0]?.props.position).toEqual([0, 1.36, 0])
    expect(named(elements, 'equator-plane')).toHaveLength(1)
    expect(named(elements, 'orbit-inner')).toHaveLength(1)
    expect(named(elements, 'satellite-velocity')).toHaveLength(1)
    expect(named(elements, 'celestial-body')).toHaveLength(1)
  })

  it('shows both burn points on a transfer and hides the plane when asked', () => {
    const scenario = scenarioOf({ mode: 'transfer', body: 'earth', r1: 1.2, r2: 4, phaseDeg: 0, inclinationDeg: 26, time: 0 })
    const pose = celestialPose({ scenario, showVectors: false, showArea: false, showPlane: false, corotate: false })
    const elements = collect(CelestialRig3D({ pose }))
    expect(named(elements, 'periapsis')[0]?.props.position).toEqual(pose.periapsis)
    expect(named(elements, 'apoapsis')[0]?.props.position).toEqual(pose.apoapsis)
    expect(named(elements, 'transfer-orbit')).toHaveLength(1)
    expect(named(elements, 'equator-plane')).toHaveLength(0)
    expect(named(elements, 'satellite-velocity')).toHaveLength(0)
  })
})
