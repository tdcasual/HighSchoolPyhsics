import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Color, Fog } from 'three'
import { useAppStore } from '../store/useAppStore'

type SceneBackdropProps = {
  /** Clear colour in day mode. */
  day: string
  /** Clear colour in night mode; defaults to the night shell background family. */
  night?: string
  /** Optional linear fog [near, far], tinted to match the backdrop so the floor fades into it. */
  fog?: [number, number]
}

/**
 * Theme-aware 3D clear colour (and fog) for scenes that paint their own backdrop.
 * Writes to the root scene directly: a JSX `attach="background"` binds to the immediate
 * parent, so inside a <group> it would silently set `group.background` and do nothing.
 */
export function SceneBackdrop({ day, night = '#161b22', fog }: SceneBackdropProps) {
  const theme = useAppStore((state) => state.theme)
  const color = theme === 'night' ? night : day
  const get = useThree((state) => state.get)
  const fogNear = fog?.[0]
  const fogFar = fog?.[1]

  useEffect(() => {
    const { scene, invalidate } = get()
    const previousBackground = scene.background
    const previousFog = scene.fog
    scene.background = new Color(color)
    scene.fog = fogNear !== undefined && fogFar !== undefined ? new Fog(color, fogNear, fogFar) : null
    invalidate()
    return () => {
      scene.background = previousBackground
      scene.fog = previousFog
    }
  }, [get, color, fogNear, fogFar])

  return null
}
