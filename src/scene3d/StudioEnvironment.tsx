import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Offline image-based lighting: a procedural softbox room baked into a PMREM map.
 * Polished steel only reads as metal when it has something to reflect; without an
 * environment, metallic materials render nearly black.
 */
export function StudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  const get = useThree((state) => state.get)

  useEffect(() => {
    const { gl, scene, invalidate } = get()
    const generator = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = generator.fromScene(room, 0.04)
    const previous = scene.environment
    scene.environment = target.texture
    scene.environmentIntensity = intensity
    // On-demand canvases would otherwise keep showing the unlit frame until the next interaction.
    invalidate()
    return () => {
      scene.environment = previous
      target.dispose()
      room.dispose()
      generator.dispose()
    }
  }, [get, intensity])

  return null
}
