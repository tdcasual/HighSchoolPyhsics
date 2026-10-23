import { Line } from '../../scene3d/ClassroomLine'
import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide } from 'three'
import type { EquipotentialCharge, EquipotentialSurface } from './model'
import { SceneLabel } from '../../scene3d/SceneLabel'

type EquipotentialRig3DProps = {
  bounds: number
  charges: ReadonlyArray<EquipotentialCharge>
  selectedChargeId: string | null
  positiveSurfaces: ReadonlyArray<EquipotentialSurface>
  negativeSurfaces: ReadonlyArray<EquipotentialSurface>
}

type SurfaceGeometry = {
  geometry: BufferGeometry
  triangleCount: number
}

const POSITIVE_COLORS = ['#ef3340', '#f05252', '#f46b62', '#f58270', '#f69a80', '#f8b596']
const NEGATIVE_COLORS = ['#3f7eb5', '#4f91c9', '#65a3d8', '#7eb4e4', '#9ac8ed', '#bddcf4']

function createSurfaceGeometries(surfaces: ReadonlyArray<EquipotentialSurface>): SurfaceGeometry[] {
  return surfaces.map((surface) => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(surface.positions, 3))
    geometry.setIndex(new BufferAttribute(surface.indices, 1))
    geometry.computeVertexNormals()
    return { geometry, triangleCount: surface.triangleCount }
  })
}

function WorldLabel({
  position,
  color,
  children,
}: {
  position: [number, number, number]
  color: string
  children: string
}) {
  return (
    <SceneLabel position={position} color={color} size={12} weight={800} distanceFactor={8}>
      {children}
    </SceneLabel>
  )
}

export function EquipotentialRig3D({
  bounds,
  charges,
  selectedChargeId,
  positiveSurfaces,
  negativeSurfaces,
}: EquipotentialRig3DProps) {
  const positiveGeometries = useMemo(() => createSurfaceGeometries(positiveSurfaces), [positiveSurfaces])
  const negativeGeometries = useMemo(() => createSurfaceGeometries(negativeSurfaces), [negativeSurfaces])

  useEffect(
    () => () => {
      for (const item of positiveGeometries) item.geometry.dispose()
      for (const item of negativeGeometries) item.geometry.dispose()
    },
    [negativeGeometries, positiveGeometries],
  )

  return (
    <group>
      <ambientLight intensity={0.88} />
      <directionalLight position={[5.2, 6.4, 4.2]} intensity={0.95} />
      <pointLight position={[-4.6, 2.8, -3.5]} intensity={0.42} color="#8ec7ff" />

      <gridHelper args={[bounds * 2, 20, '#6f8095', '#9aafc5']} />
      <Line
        points={[
          [-bounds, 0, 0],
          [bounds, 0, 0],
        ]}
        color="#ff886e"
        lineWidth={1.9}
      />
      <Line
        points={[
          [0, -bounds, 0],
          [0, bounds, 0],
        ]}
        color="#77d2a7"
        lineWidth={1.6}
      />
      <Line
        points={[
          [0, 0, -bounds],
          [0, 0, bounds],
        ]}
        color="#7fb7ff"
        lineWidth={1.6}
      />
      <WorldLabel position={[bounds, 0, 0]} color="#c34d3c">
        +X
      </WorldLabel>
      <WorldLabel position={[0, bounds, 0]} color="#288d68">
        +Y
      </WorldLabel>
      <WorldLabel position={[0, 0, bounds]} color="#3978bb">
        +Z
      </WorldLabel>

      {positiveGeometries.map((item, index) => (
        <mesh key={`positive-surface-${index}`} geometry={item.geometry} renderOrder={1}>
          <meshStandardMaterial
            color={POSITIVE_COLORS[index % POSITIVE_COLORS.length]}
            emissive={POSITIVE_COLORS[index % POSITIVE_COLORS.length]}
            emissiveIntensity={0.12}
            roughness={0.42}
            metalness={0.02}
            transparent
            opacity={0.22 + (positiveGeometries.length - index) * 0.09}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {negativeGeometries.map((item, index) => (
        <mesh key={`negative-surface-${index}`} geometry={item.geometry} renderOrder={1}>
          <meshStandardMaterial
            color={NEGATIVE_COLORS[index % NEGATIVE_COLORS.length]}
            emissive={NEGATIVE_COLORS[index % NEGATIVE_COLORS.length]}
            emissiveIntensity={0.1}
            roughness={0.44}
            metalness={0.02}
            transparent
            opacity={0.2 + (negativeGeometries.length - index) * 0.09}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {charges.map((charge) => {
        const radius = 0.18 + Math.min(0.22, Math.abs(charge.magnitude) * 0.008)
        const color = charge.magnitude === 0 ? '#64748b' : charge.magnitude > 0 ? '#d92736' : '#2568a8'
        const sign = charge.magnitude > 0 ? '+' : charge.magnitude < 0 ? '−' : '0'
        return (
          <group key={charge.id}>
            <mesh position={[charge.x, charge.y, charge.z]} renderOrder={2}>
              <sphereGeometry args={[radius, 24, 24]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.32} />
            </mesh>
            <WorldLabel position={[charge.x, charge.y + radius + 0.16, charge.z]} color={color}>
              {`${sign} ${charge.id}`}
            </WorldLabel>
            {charge.id === selectedChargeId ? (
              <mesh position={[charge.x, charge.y + 0.06, charge.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
                <ringGeometry args={[radius + 0.04, radius + 0.09, 32]} />
                <meshBasicMaterial color="#f2b134" transparent opacity={0.95} depthWrite={false} />
              </mesh>
            ) : null}
          </group>
        )
      })}
    </group>
  )
}
