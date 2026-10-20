import { useMemo } from 'react'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'

/** Bench metals shared by the optics rigs. */
export const MAT_METAL = { color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }
export const MAT_BLACK_PLASTIC = { color: 0x151515, metalness: 0.3, roughness: 0.7 }

const SHADOWS = { castShadow: true as const, receiveShadow: true as const }

/** The darkened lab the optics benches sit in (theme token --scene-optical-bg). */
function readOpticalBackground(): string {
  if (typeof window === 'undefined') return '#222222'
  const shell = document.querySelector('.app-shell')
  if (!shell) return '#222222'
  return getComputedStyle(shell).getPropertyValue('--scene-optical-bg').trim() || '#222222'
}

/**
 * Device-dependent set-up every optics rig needs: the performance profile, whether shadows are
 * on (and the props to spread on shadowed meshes), and the background colour.
 */
export function useOpticalStage() {
  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const background = useMemo(() => readOpticalBackground(), [])
  const shadowsEnabled = perf.shadowMapSize !== null
  return { perf, background, shadowsEnabled, shadowProps: shadowsEnabled ? SHADOWS : {} }
}

export type OpticalStage = ReturnType<typeof useOpticalStage>
