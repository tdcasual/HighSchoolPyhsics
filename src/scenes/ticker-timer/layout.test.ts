import { describe, expect, it } from 'vitest'
import { EM_LAYOUT, SPARK_LAYOUT, TAPE } from './layout'
import { TICKER_CANDY } from './palette'

describe('ticker timer component layout', () => {
  it('stacks electromagnetic punching parts as pad → tape → carbon → open press frame', () => {
    expect(EM_LAYOUT.pad.position[1]).toBeLessThan(TAPE.y)
    expect(TAPE.y).toBeLessThan(EM_LAYOUT.carbon.position[1])
    expect(EM_LAYOUT.carbon.position[1]).toBeLessThan(EM_LAYOUT.pressFrame.position[1])
    expect(EM_LAYOUT.pressFrame.inner).toBeLessThan(EM_LAYOUT.pressFrame.outer)
  })

  it('runs the vibrating reed through the coil and between N/S poles', () => {
    const reedX0 = EM_LAYOUT.reed.position[0] - EM_LAYOUT.reed.size[0] / 2
    const reedX1 = EM_LAYOUT.reed.position[0] + EM_LAYOUT.reed.size[0] / 2
    expect(reedX0).toBeLessThan(EM_LAYOUT.coil.position[0])
    expect(reedX1).toBeGreaterThan(EM_LAYOUT.coil.position[0])
    expect(EM_LAYOUT.poleN.position[1]).toBeGreaterThan(EM_LAYOUT.reed.position[1])
    expect(EM_LAYOUT.poleS.position[1]).toBeLessThan(EM_LAYOUT.reed.position[1])
    expect(EM_LAYOUT.reed.position[1]).toBe(EM_LAYOUT.coil.position[1])
  })

  it('places the spark discharge needle below the tape and the ink disc above it', () => {
    expect(SPARK_LAYOUT.needle.position[1]).toBeLessThan(TAPE.y)
    expect(TAPE.y).toBeLessThan(SPARK_LAYOUT.disc.position[1])
    expect(SPARK_LAYOUT.disc.position[1]).toBeLessThan(SPARK_LAYOUT.pressBar.position[1])
  })

  it('keeps candy N/S and terminal polarities distinct', () => {
    expect(TICKER_CANDY.poleN).not.toBe(TICKER_CANDY.poleS)
    expect(TICKER_CANDY.terminalPositive).not.toBe(TICKER_CANDY.terminalNegative)
  })
})
