import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CartRig3D } from './CartRig3D'
import { cartPose } from './pose'

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

describe('cart rig', () => {
  it('places the cart, striker, tape and three hook discs from the shared pose', () => {
    const pose = cartPose({ time: 0, hooks: 3, v0: 0.1, dh: 0, group: 5, stage: 'run', assembly: 0 })
    const elements = collect(CartRig3D({ pose, skin: 'classic' }))
    const cart = named(elements, 'cart')[0]
    const wheels = named(elements, 'cart-wheel')
    const tape = named(elements, 'tape')[0]
    expect(cart?.props.position).toEqual([-2.8, 0.14, 0])
    expect(wheels).toHaveLength(4)
    expect((wheels[0]?.props.rotation as number[])[2]).toBeCloseTo(0, 12)
    expect(named(elements, 'striker')[0]?.props.position).toEqual([0.28, 0.43, 0])
    expect(tape?.props.position).toEqual([pose.tapeX, 0.45, 0])
    expect((tape?.props.scale as number[])[0]).toBeCloseTo(0.6, 12)
    expect(named(elements, 'tape-dot')).toHaveLength(1)
    expect(named(elements, 'hook-disc').filter((disc) => disc.props.visible !== false)).toHaveLength(3)
    expect(named(elements, 'string-guide')).toHaveLength(0)
    expect(named(elements, 'velocity-arrow')).toHaveLength(0)
    expect(named(elements, 'pulley-wheel')[0]?.props.position).toEqual([5.02, pose.pulleyY, 0])
  })

  it('rolls the wheels, shows the velocity arrow, and hides parts during assembly', () => {
    const moved = cartPose({ time: 1, hooks: 3, v0: 0.1, dh: 0.05, group: 5, stage: 'run', assembly: 0 })
    const moving = collect(CartRig3D({ pose: moved, skin: 'panda' }))
    expect(named(moving, 'cart')[0]?.props.position).toEqual([moved.cartX, 0.14, 0])
    expect((named(moving, 'cart-wheel')[0]?.props.rotation as number[])[2]).toBeCloseTo(moved.wheelRotation, 8)
    expect(named(moving, 'velocity-arrow')[0]?.props.position).toEqual([moved.cartX, 1.35, 0])
    expect(named(moving, 'string-guide')).toHaveLength(1)
    const body = named(moving, 'cart-body')[0]
    const material = Children.toArray(body?.props.children as ReactNode).filter(isValidElement<Record<string, unknown>>).at(1)
    expect(material?.props.color).toBe('#e4e6d7')

    const hidden = collect(CartRig3D({
      pose: cartPose({ time: 0, hooks: 0, v0: 0.2, dh: 0, group: 5, stage: 'assemble', assembly: 0 }),
      skin: 'classic',
    }))
    expect(named(hidden, 'cart')).toHaveLength(0)
    expect(named(hidden, 'timer')).toHaveLength(0)
    expect(named(hidden, 'pulley')).toHaveLength(0)

    const cartOnly = collect(CartRig3D({
      pose: cartPose({ time: 0, hooks: 3, v0: 0.1, dh: 0, group: 5, stage: 'assemble', assembly: 1 }),
      skin: 'classic',
    }))
    expect(named(cartOnly, 'cart')).toHaveLength(1)
    expect(named(cartOnly, 'timer')).toHaveLength(0)
  })
})
