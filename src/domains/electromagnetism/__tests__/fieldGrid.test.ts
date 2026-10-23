import { describe, expect, it } from 'vitest'
import { fieldGrid } from '../fieldGrid'

describe('fieldGrid', () => {
  it('lists every combination of the positions', () => {
    expect(fieldGrid([-1, 1], [0], [2, 3])).toEqual([
      [-1, 0, 2],
      [-1, 0, 3],
      [1, 0, 2],
      [1, 0, 3],
    ])
  })
})
