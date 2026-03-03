import { Line } from '@react-three/drei/core/Line'
import { useMemo } from 'react'
import type { EquipotentialCharge, EquipotentialSurface } from './model'

type EquipotentialRig3DProps = {
  bounds: number
  charges: ReadonlyArray<EquipotentialCharge>
  positiveSurfaces: ReadonlyArray<EquipotentialSurface>
  negativeSurfaces: ReadonlyArray<EquipotentialSurface>
}

const POSITIVE_COLORS = ['#1f8bff', '#45a2ff', '#6bb8ff', '#8ed0ff', '#b4e4ff', '#d8f3ff']
const NEGATIVE_COLORS = ['#ff6378', '#ff7a8d', '#ff91a2', '#ffa8b8', '#ffc2cf', '#ffdde5']

function toPositionBuffer(points: Array<[number, number, number]>): Float32Array {
  const buffer = new Float32Array(points.length * 3)
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const offset = index * 3
    buffer[offset] = point[0]
    buffer[offset + 1] = point[1]
    buffer[offset + 2] = point[2]
  }
  return buffer
}

export function EquipotentialRig3D({
  bounds,
  charges,
  positiveSurfaces,
  negativeSurfaces,
}: EquipotentialRig3DProps) {
  const positiveBuffers = useMemo(
    () => positiveSurfaces.map((surface) => toPositionBuffer(surface.points)),
    [positiveSurfaces],
  )
  const negativeBuffers = useMemo(
    () => negativeSurfaces.map((surface) => toPositionBuffer(surface.points)),
    [negativeSurfaces],
  )

  return (
    <group>
      <ambientLight intensity={0.88} />
      <directionalLight position={[5.2, 6.4, 4.2]} intensity={0.95} />
      <pointLight position={[-4.6, 2.8, -3.5]} intensity={0.42} color="#8ec7ff" />

      <gridHelper args={[bounds * 2, 20, '#6f8095', '#9aafc5']} />
      <Line points={[[-bounds, 0, 0], [bounds, 0, 0]]} color="#ff886e" lineWidth={1.9} />
      <Line points={[[0, -bounds, 0], [0, bounds, 0]]} color="#77d2a7" lineWidth={1.6} />
      <Line points={[[0, 0, -bounds], [0, 0, bounds]]} color="#7fb7ff" lineWidth={1.6} />

      {charges.map((charge) => {
        const radius = 0.18 + Math.min(0.22, Math.abs(charge.magnitude) * 0.008)
        const color = charge.magnitude >= 0 ? '#ff6b6b' : '#5f86ff'
        return (
          <mesh key={charge.id} position={[charge.x, charge.y, charge.z]}>
            <sphereGeometry args={[radius, 24, 24]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.34} roughness={0.35} />
          </mesh>
        )
      })}

      {positiveBuffers.map((buffer, index) => {
        if (buffer.length === 0) {
          return null
        }
        return (
          <points key={`positive-surface-${index}`} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[buffer, 3]} />
            </bufferGeometry>
            <pointsMaterial
              color={POSITIVE_COLORS[index % POSITIVE_COLORS.length]}
              size={0.125 - index * 0.012}
              transparent
              opacity={0.24 + (positiveBuffers.length - index) * 0.1}
              sizeAttenuation
              depthWrite={false}
            />
          </points>
        )
      })}

      {negativeBuffers.map((buffer, index) => {
        if (buffer.length === 0) {
          return null
        }
        return (
          <points key={`negative-surface-${index}`} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[buffer, 3]} />
            </bufferGeometry>
            <pointsMaterial
              color={NEGATIVE_COLORS[index % NEGATIVE_COLORS.length]}
              size={0.125 - index * 0.012}
              transparent
              opacity={0.22 + (negativeBuffers.length - index) * 0.1}
              sizeAttenuation
              depthWrite={false}
            />
          </points>
        )
      })}
    </group>
  )
}
