import type { MobilePlaybackAction } from '../store/useAppStore'

/**
 * Anything that plays and pauses: a `SimulationClock`, or a scene state machine that owns its
 * own `running` flag (useAnimatedState / useAnimationLoop).
 */
export type Transport = {
  running: boolean
  toggle: () => void
  step?: () => void
}

export type ClockActionOptions = {
  onReset: () => void
  /** 单步 label in a meaningful unit (单步 T/4, 单步 15°, 单步 0.1 s). Omit only for NO_STEP scenes. */
  stepLabel?: string
  playLabel?: string
  pauseLabel?: string
  resetLabel?: string
  /** The process has ended: the play button reads `finishedLabel` (再演示 by default). */
  finished?: boolean
  finishedLabel?: string
  /** Play and 单步 are unavailable (e.g. the particle has left, or a practice lock). */
  disabled?: boolean
  /** Scene-specific actions after reset. */
  extra?: MobilePlaybackAction[]
}

/**
 * The standard playback zone: play/pause (Space), 单步 (. / →) and reset, with any
 * scene-specific actions after them. Every scene with a play button builds it here so the
 * keys, order and wording stay the same across scenes.
 */
export function clockActions(transport: Transport, options: ClockActionOptions): MobilePlaybackAction[] {
  const playLabel = transport.running
    ? (options.pauseLabel ?? '暂停')
    : options.finished
      ? (options.finishedLabel ?? '再演示')
      : (options.playLabel ?? '播放')
  const actions: MobilePlaybackAction[] = [
    { key: 'toggle-running', label: playLabel, onClick: transport.toggle, disabled: options.disabled },
  ]
  if (options.stepLabel !== undefined) {
    if (!transport.step) throw new Error('clockActions: stepLabel given but the transport has no step()')
    actions.push({ key: 'step', label: options.stepLabel, onClick: transport.step, disabled: options.disabled })
  }
  actions.push({ key: 'reset', label: options.resetLabel ?? '重置', onClick: options.onReset })
  return [...actions, ...(options.extra ?? [])]
}
