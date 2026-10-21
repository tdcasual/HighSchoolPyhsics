import { useAppStore } from '../store/useAppStore'

/**
 * The day/night theme as a rig sees it: `night`, `pick(day, night)` for any themed value, and
 * the shared label ink. Rigs call it directly instead of receiving a `theme` prop.
 */
export function useSceneTheme() {
  const night = useAppStore((state) => state.theme) === 'night'
  return {
    night,
    pick: <T,>(day: T, nightValue: T): T => (night ? nightValue : day),
    /** Annotation text on the light lab background or the night sky. */
    ink: night ? '#e4edf4' : '#3b2e24',
  }
}
