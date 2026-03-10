import { describe, expect, it } from 'vitest'
import {
  createElectromagneticDriveState,
  formatAngularSpeed,
  formatLagRatio,
  resetElectromagneticDriveState,
  stepElectromagneticDriveState,
} from './model'

describe('electromagnetic-drive model', () => {
  it('starts from rest with empty chart history', () => {
    const state = createElectromagneticDriveState()

    expect(state.isRunning).toBe(false)
    expect(state.magnetSpeed).toBe(0)
    expect(state.frameSpeed).toBe(0)
    expect(state.magnetAngle).toBe(0)
    expect(state.frameAngle).toBe(0)
    expect(state.history.magnetSpeeds).toEqual([])
    expect(state.history.frameSpeeds).toEqual([])
  })

  it('accelerates the magnet while the aluminum frame lags behind', () => {
    let state = createElectromagneticDriveState({ isRunning: true })

    for (let index = 0; index < 120; index += 1) {
      state = stepElectromagneticDriveState(state)
    }

    expect(state.magnetSpeed).toBeGreaterThan(3.8)
    expect(state.magnetSpeed).toBeLessThan(4.01)
    expect(state.frameSpeed).toBeGreaterThan(0.2)
    expect(state.frameSpeed).toBeLessThan(state.magnetSpeed)
    expect(state.history.magnetSpeeds.length).toBeGreaterThan(0)
    expect(state.history.frameSpeeds).toHaveLength(state.history.magnetSpeeds.length)
  })

  it('lets the frame coast briefly after the magnet is paused, then decay', () => {
    let state = createElectromagneticDriveState({ isRunning: true })

    for (let index = 0; index < 160; index += 1) {
      state = stepElectromagneticDriveState(state)
    }

    const runningFrameSpeed = state.frameSpeed
    state = { ...state, isRunning: false }
    const firstPausedFrame = stepElectromagneticDriveState(state)

    expect(firstPausedFrame.magnetSpeed).toBeLessThan(state.magnetSpeed)
    expect(firstPausedFrame.frameSpeed).toBeGreaterThan(0)
    expect(firstPausedFrame.frameSpeed).toBeGreaterThanOrEqual(runningFrameSpeed * 0.98)

    let decayed = firstPausedFrame
    for (let index = 0; index < 240; index += 1) {
      decayed = stepElectromagneticDriveState(decayed)
    }

    expect(decayed.magnetSpeed).toBeLessThan(0.05)
    expect(decayed.frameSpeed).toBeLessThan(firstPausedFrame.frameSpeed)
  })

  it('resets dynamic values, angles, and chart history', () => {
    let state = createElectromagneticDriveState({ isRunning: true })
    for (let index = 0; index < 40; index += 1) {
      state = stepElectromagneticDriveState(state)
    }

    const reset = resetElectromagneticDriveState(state)

    expect(reset).toEqual(createElectromagneticDriveState())
  })

  it('formats readouts for classroom summaries', () => {
    expect(formatAngularSpeed(3.456)).toBe('3.46 rad/s')
    expect(formatLagRatio(0, 0)).toBe('0%')
    expect(formatLagRatio(3.2, 4)).toBe('80%')
  })
})
