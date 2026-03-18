import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { CurvePath, LineCurve3, Path, Shape, Vector3 } from 'three'
import type { AlternatorPalette } from '../palette'

type RotorAssemblyProps = {
  angleRad: number
  palette: AlternatorPalette
}

function buildTubePath(points: [number, number, number][]) {
  const curvePath = new CurvePath<Vector3>()
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    curvePath.add(
      new LineCurve3(
        new Vector3(start[0], start[1], start[2]),
        new Vector3(end[0], end[1], end[2]),
      ),
    )
  }
  return curvePath
}

function buildSlipRingShape() {
  const shape = new Shape()
  shape.absarc(0, 0, 1.1, 0, Math.PI * 2, false)

  const hole = new Path()
  hole.absarc(0, 0, 0.7, 0, Math.PI * 2, true)
  shape.holes.push(hole)

  return shape
}

export function RotorAssembly({ angleRad, palette }: RotorAssemblyProps) {
  const orangePath = useMemo(
    () =>
      buildTubePath([
        [0, 0, -6],
        [-2.5, 0, -6],
        [-2.5, 0, 1],
        [-0.9, 0, 1],
        [-0.9, 0, 2.5],
      ]),
    [],
  )
  const bluePath = useMemo(
    () =>
      buildTubePath([
        [0, 0, -6],
        [2.5, 0, -6],
        [2.5, 0, 1.5],
        [0, 0, 1.5],
        [0, 0, 5],
        [0, 0.9, 5],
      ]),
    [],
  )
  const ringShape = useMemo(() => buildSlipRingShape(), [])

  return (
    <group name="rotor-assembly" rotation={[0, 0, angleRad]}>
      <mesh name="orange-wire">
        <tubeGeometry args={[orangePath, 64, 0.15, 12, false]} />
        <meshStandardMaterial color={palette.wireOrange} roughness={0.3} metalness={0.6} />
      </mesh>

      <mesh name="blue-wire">
        <tubeGeometry args={[bluePath, 64, 0.15, 12, false]} />
        <meshStandardMaterial color={palette.wireBlue} roughness={0.3} metalness={0.6} />
      </mesh>

      <group name="coil-loop">
        <Text position={[0, 0, -6.55]} color={palette.label} fontSize={0.28} anchorX="center" anchorY="middle" name="label-A">
          A
        </Text>
        <Text position={[-2.8, 0, 0.5]} color={palette.label} fontSize={0.28} anchorX="center" anchorY="middle" name="label-B">
          B
        </Text>
        <Text position={[2.8, 0, 0.9]} color={palette.label} fontSize={0.28} anchorX="center" anchorY="middle" name="label-C">
          C
        </Text>
        <Text position={[0, 1.3, 5.2]} color={palette.label} fontSize={0.28} anchorX="center" anchorY="middle" name="label-D">
          D
        </Text>
      </group>

      <group name="slip-ring-front">
        <mesh name="ring-orange" position={[0, 0, 2.1]}>
          <extrudeGeometry
            args={[
              ringShape,
              { depth: 0.8, curveSegments: 64, bevelEnabled: false, steps: 1 },
            ]}
          />
          <meshStandardMaterial color={palette.ringOrange} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      <group name="slip-ring-back">
        <mesh name="ring-blue" position={[0, 0, 4.6]}>
          <extrudeGeometry
            args={[
              ringShape,
              { depth: 0.8, curveSegments: 64, bevelEnabled: false, steps: 1 },
            ]}
          />
          <meshStandardMaterial color={palette.ringBlue} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
