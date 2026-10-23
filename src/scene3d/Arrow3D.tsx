import { arrowGeometry, type ArrowPoint } from './arrowGeometry'
import { Line } from './ClassroomLine'

export type Arrow3DProps = {
  from: ArrowPoint
  to: ArrowPoint
  color: string
  headLength?: number
  headRadius?: number
  /** Radius of the solid shaft. */
  shaftRadius?: number
  /** Draw the shaft as a screen-space line this many px wide instead of a solid cylinder. */
  lineWidth?: number
  opacity?: number
  /** Draw over the apparatus (no depth test), for teaching vectors that must never hide. */
  overlay?: boolean
  /** Radial segments of the head (and solid shaft). */
  segments?: number
  name?: string
}

/** A vector, field direction or force in a 3D scene: shaft plus cone head, tail `from`, tip `to`. */
export function Arrow3D({
  from,
  to,
  color,
  headLength = 0.2,
  headRadius = 0.075,
  shaftRadius = 0.03,
  lineWidth,
  opacity = 1,
  overlay = false,
  segments = 12,
  name,
}: Arrow3DProps) {
  const geometry = arrowGeometry(from, to, headLength)
  if (!geometry) return null
  const material = (
    <meshBasicMaterial
      color={color}
      transparent={opacity < 1 || overlay}
      opacity={opacity}
      depthTest={!overlay}
      depthWrite={!overlay && opacity >= 1}
    />
  )
  return (
    <group name={name}>
      {geometry.shaftLength > 0 &&
        (lineWidth === undefined ? (
          <mesh position={geometry.shaftCenter} quaternion={geometry.quaternion}>
            <cylinderGeometry args={[shaftRadius, shaftRadius, geometry.shaftLength, segments]} />
            {material}
          </mesh>
        ) : (
          <Line
            points={[from as [number, number, number], geometry.base]}
            color={color}
            lineWidth={lineWidth}
            transparent={opacity < 1 || overlay}
            opacity={opacity}
            depthTest={!overlay}
          />
        ))}
      <mesh position={geometry.headCenter} quaternion={geometry.quaternion}>
        <coneGeometry args={[headRadius, geometry.headLength, segments]} />
        {material}
      </mesh>
    </group>
  )
}
