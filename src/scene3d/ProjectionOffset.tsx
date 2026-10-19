import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import type { PerspectiveCamera } from 'three'

/**
 * Shifts the rendered image by (x, y) CSS pixels without moving the camera, so the orbit
 * target sits at the center of the free area and zooming closes in on it in place.
 */
export function ProjectionOffset({ x, y }: { x: number; y: number }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    if (width <= 0 || height <= 0 || typeof camera.setViewOffset !== 'function') return
    camera.setViewOffset(width, height, -x, -y, width, height)
    invalidate()
    return () => {
      camera.clearViewOffset()
      invalidate()
    }
  }, [camera, height, invalidate, width, x, y])

  return null
}
