import type { MobilePlaybackAction } from '../store/useAppStore'
import type { SimulationClock } from './useSimulationClock'

/**
 * The standard playback zone for a clocked scene: play/pause (Space), 单步 (. / →) and reset,
 * with any scene-specific actions after them.
 */
export function clockActions(clock: SimulationClock, options: {
  stepLabel: string
  onReset: () => void
  playLabel?: string
  pauseLabel?: string
  resetLabel?: string
  extra?: MobilePlaybackAction[]
}): MobilePlaybackAction[] {
  return [
    { key: 'toggle-running', label: clock.running ? options.pauseLabel ?? '暂停' : options.playLabel ?? '播放', onClick: clock.toggle },
    { key: 'step', label: options.stepLabel, onClick: clock.step },
    { key: 'reset', label: options.resetLabel ?? '重置', onClick: options.onReset },
    ...(options.extra ?? []),
  ]
}
