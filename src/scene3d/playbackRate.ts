import { useAppStore } from '../store/useAppStore'

/** Shell-wide slow motion (1, 0.5 or 0.25); simulation loops multiply their frame delta by it. */
export function getPlaybackRate(): number {
  return useAppStore.getState().playbackRate
}

export const PLAYBACK_RATE_OPTIONS = [
  { key: '1', label: '1×' },
  { key: '0.5', label: '½×' },
  { key: '0.25', label: '¼×' },
]
