import type { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { useThree, type Canvas } from '@react-three/fiber'
import { useLayoutEffect, useRef, type ComponentProps, type RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { readVec3, synchronizeCamera, type CameraSyncConfig, type Vec3Tuple } from './cameraSync'

/**
 * Applies changing camera inputs (a new fit, a view preset) to the live camera and orbit target.
 * Keyed by serialized values, so re-renders with the same numbers leave the teacher's orbit alone.
 */
export function CameraSynchronizer({
  camera,
  cameraUp,
  target,
  controlsRef,
  cameraKey,
  targetKey,
}: {
  camera: NonNullable<ComponentProps<typeof Canvas>['camera']>
  cameraUp?: Vec3Tuple
  target: ComponentProps<typeof OrbitControls>['target']
  controlsRef: RefObject<OrbitControlsImpl | null>
  cameraKey: string
  targetKey: string
}) {
  const activeCamera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const cameraRef = useRef(camera)
  const cameraUpRef = useRef(cameraUp)
  const targetRef = useRef(target)

  useLayoutEffect(() => {
    cameraRef.current = camera
    cameraUpRef.current = cameraUp
    targetRef.current = target
  })

  useLayoutEffect(() => {
    synchronizeCamera(
      activeCamera,
      cameraRef.current as unknown as CameraSyncConfig,
      readVec3(targetRef.current),
      controlsRef,
      cameraUpRef.current,
    )
    invalidate()
  }, [activeCamera, cameraKey, controlsRef, invalidate, targetKey])

  return null
}
