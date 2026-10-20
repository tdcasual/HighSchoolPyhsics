import type { RefObject } from 'react'
import type { Camera, PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type Vec3Tuple = [number, number, number]

export type CameraSyncConfig = {
  position?: unknown
  fov?: number
  near?: number
  far?: number
  zoom?: number
}

export function readVec3(value: unknown): Vec3Tuple | undefined {
  if (Array.isArray(value) && value.length >= 3) {
    return [Number(value[0]), Number(value[1]), Number(value[2])]
  }
  if (value && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
    const vector = value as { x: number; y: number; z: number }
    return [vector.x, vector.y, vector.z]
  }
  return undefined
}

export function synchronizeCamera(
  activeCamera: Camera,
  config: CameraSyncConfig,
  targetPosition: Vec3Tuple | undefined,
  controlsRef: RefObject<OrbitControlsImpl | null>,
  cameraUp?: Vec3Tuple,
) {
  const position = readVec3(config.position)
  if (position) activeCamera.position.set(...position)
  if (cameraUp) activeCamera.up.set(...cameraUp)
  const perspectiveCamera = activeCamera as PerspectiveCamera
  if (typeof config.fov === 'number') perspectiveCamera.fov = config.fov
  if (typeof config.near === 'number') perspectiveCamera.near = config.near
  if (typeof config.far === 'number') perspectiveCamera.far = config.far
  if (typeof config.zoom === 'number') perspectiveCamera.zoom = config.zoom
  perspectiveCamera.updateProjectionMatrix()

  if (targetPosition) {
    const controls = controlsRef.current
    if (controls) {
      controls.target.set(...targetPosition)
      controls.update()
    } else {
      activeCamera.lookAt(...targetPosition)
    }
  }
}
