import { describe, expect, it, vi } from 'vitest'
import { clockActions } from './clockActions'

const transport = (running: boolean) => ({ running, toggle: vi.fn(), step: vi.fn() })

describe('clockActions', () => {
  it('lists play, 单步 and reset with the shared keys', () => {
    const actions = clockActions(transport(false), { stepLabel: '单步 T/4', onReset: vi.fn() })
    expect(actions.map((action) => [action.key, action.label])).toEqual([
      ['toggle-running', '播放'],
      ['step', '单步 T/4'],
      ['reset', '重置'],
    ])
  })

  it('words the play button for running, finished and custom states', () => {
    expect(clockActions(transport(true), { onReset: vi.fn(), pauseLabel: '暂停扫描' })[0].label).toBe('暂停扫描')
    expect(clockActions(transport(false), { onReset: vi.fn(), finished: true })[0].label).toBe('再演示')
    expect(clockActions(transport(false), { onReset: vi.fn(), finished: true, finishedLabel: '已出射' })[0].label).toBe('已出射')
    expect(clockActions(transport(false), { onReset: vi.fn(), playLabel: '开始传播' })[0].label).toBe('开始传播')
  })

  it('omits 单步 without a step label and disables play and 单步 together', () => {
    expect(clockActions(transport(false), { onReset: vi.fn() }).map((action) => action.key)).toEqual(['toggle-running', 'reset'])
    const disabled = clockActions(transport(false), { stepLabel: '单步', onReset: vi.fn(), disabled: true })
    expect(disabled.map((action) => Boolean(action.disabled))).toEqual([true, true, false])
  })

  it('refuses a step label when there is nothing to step', () => {
    expect(() => clockActions({ running: false, toggle: vi.fn() }, { stepLabel: '单步', onReset: vi.fn() })).toThrow()
  })
})
