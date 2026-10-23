/**
 * A button of the playback zone (and, on phones, of the header). Keys with keyboard shortcuts:
 * 'play' / 'toggle-running' (Space), 'step' (. or →), 'step-back' (, or ←).
 */
export type PlaybackAction = {
  key: string
  label: string
  onClick: () => void
  disabled?: boolean
}
