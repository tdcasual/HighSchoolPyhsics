import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import type { PerspectiveCamera } from 'three'

/**
 * Shifts the rendered image by (x, y) CSS pixels and shrinks it by `scale` around that point,
 * without moving the camera: the orbit target stays where it is in the scene, so zooming
 * closes in on it in place. Raycasting and drei <Html> labels use the same projection.
 */
export function ProjectionOffset({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    if (width <= 0 || height <= 0 || typeof camera.setViewOffset !== 'function') return
    // Show a (width/scale × height/scale) window of the full image so the image center lands
    // at (width/2 + x, height/2 + y) on screen.
    const s = Math.max(0.1, scale)
    camera.setViewOffset(width, height, width / 2 - (width / 2 + x) / s, height / 2 - (height / 2 + y) / s, width / s, height / s)
    invalidate()
    return () => {
      camera.clearViewOffset()
      invalidate()
    }
  }, [camera, height, invalidate, scale, width, x, y])

  return null
}
