import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import { Line } from './ClassroomLine'

export type Vec3 = [number, number, number]

type VectorArrowProps = {
  from: Vec3
  /** The vector itself (not the end point), in scene units. */
  vector: Vec3
  color: string
  label?: string
  width?: number
  dashed?: boolean
}

/** A physics vector drawn from `from`: shaft, cone head and an optional label past the tip. */
export function VectorArrow({ from, vector, color, label, width = 2.6, dashed = false }: VectorArrowProps) {
  const length = Math.hypot(...vector)
  const head = Math.min(0.32, length * 0.35)
  const direction = useMemo(() => new Vector3(...vector).normalize(), [vector])
  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction), [direction])
  if (length < 1e-4) return null
  const shaftEnd: Vec3 = [
    from[0] + direction.x * (length - head),
    from[1] + direction.y * (length - head),
    from[2] + direction.z * (length - head),
  ]
  const headCenter: Vec3 = [
    from[0] + direction.x * (length - head / 2),
    from[1] + direction.y * (length - head / 2),
    from[2] + direction.z * (length - head / 2),
  ]
  // Centre the label beyond the tip by about half its width, so longer labels clear the arrowhead.
  const labelGap = 0.25 + (label?.length ?? 0) * 0.07
  const labelAt: Vec3 = [
    from[0] + direction.x * (length + labelGap),
    from[1] + direction.y * (length + labelGap),
    from[2] + direction.z * (length + labelGap),
  ]
  return (
    <group>
      <Line points={[from, shaftEnd]} color={color} lineWidth={width} dashed={dashed} dashSize={0.18} gapSize={0.12} />
      <mesh position={headCenter} quaternion={quaternion}>
        <coneGeometry args={[head * 0.42, head, 14]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label ? (
        <Html position={labelAt} center distanceFactor={10}>
          <span className="vector-arrow-label" style={{ color }}>{label}</span>
        </Html>
      ) : null}
    </group>
  )
}
