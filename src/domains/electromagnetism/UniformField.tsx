import { Arrow3D, type Arrow3DProps } from '../../scene3d/Arrow3D'
import type { ArrowPoint } from '../../scene3d/arrowGeometry'

type UniformFieldProps = Omit<Arrow3DProps, 'from' | 'to' | 'name'> & {
  /** Where the arrows sit: each is centred on its point. */
  points: readonly ArrowPoint[]
  /** Field direction (any length). */
  direction: ArrowPoint
  /** Tail-to-tip length of every arrow. */
  length: number
}

/** A uniform field (B or E) drawn as parallel, equal arrows through a set of points. */
export function UniformField({ points, direction, length, ...arrow }: UniformFieldProps) {
  const norm = Math.hypot(direction[0], direction[1], direction[2])
  if (norm < 1e-9) return null
  const half: ArrowPoint = [
    (direction[0] / norm) * (length / 2),
    (direction[1] / norm) * (length / 2),
    (direction[2] / norm) * (length / 2),
  ]
  return (
    <group>
      {points.map((p) => (
        <Arrow3D
          key={p.join(',')}
          {...arrow}
          from={[p[0] - half[0], p[1] - half[1], p[2] - half[2]]}
          to={[p[0] + half[0], p[1] + half[1], p[2] + half[2]]}
        />
      ))}
    </group>
  )
}
