import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import { Line } from '../../scene3d/ClassroomLine'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { VectorArrow, type Vec3 } from '../../scene3d/VectorArrow'
import { markSpacing, pointAt, strobePoints, throwExtent, type ProjectileParams } from './model'

type Props = {
  params: ProjectileParams
  time: number
  showComponents: boolean
  showStrobe: boolean
  night: boolean
}

/** One scene unit per metre; the camera is framed to the throw instead of rescaling the world. */
const toScene = (x: number, y: number): Vec3 => [x, y, 0]

export function ProjectileMotionRig3D({ params, time, showComponents, showStrobe, night }: Props) {
  const now = pointAt(params, time)
  const path = useMemo(() => {
    const samples = Math.max(2, Math.ceil(now.t / 0.02))
    return Array.from({ length: samples + 1 }, (_, index) => {
      const point = pointAt(params, (now.t * index) / samples)
      return toScene(point.x, point.y)
    })
  }, [params, now.t])
  const strobe = showStrobe ? strobePoints(params, time) : []
  const ball = toScene(now.x, now.y)
  const ink = night ? '#e2e8f0' : '#334155'
  const extent = throwExtent(params)
  const size = Math.max(extent.width, extent.height)
  // The launch velocity arrow is about a quarter of the throw long.
  const speedScale = (0.25 * size) / Math.max(1, params.speed)
  const spacing = markSpacing(extent.width)
  const marks = Array.from({ length: Math.floor(extent.width / spacing) + 2 }, (_, index) => index * spacing)
  const ballRadius = 0.025 * size

  return (
    <group>
      <SceneBackdrop day="#eef3f7" night="#141a22" />
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 14, 10]} intensity={0.9} />

      {/* Ground with metre marks every 5 m */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[extent.width / 2, -0.01, 0]}>
        <planeGeometry args={[extent.width + size * 0.6, size * 0.5]} />
        <meshStandardMaterial color={night ? '#26303b' : '#d9e2d0'} />
      </mesh>
      {marks.map((metres) => (
        <group key={metres}>
          <Line points={[[metres, 0.01, size * 0.04], [metres, 0.01, -size * 0.04]]} color={ink} lineWidth={1.2} />
          <Html position={[metres, 0, size * 0.09]} center distanceFactor={size * 0.9}>
            <span className="vector-arrow-label" style={{ color: ink }}>{metres} m</span>
          </Html>
        </group>
      ))}

      {/* Launch platform */}
      {params.height > 0 ? (
        <mesh position={[-size * 0.03, params.height / 2, 0]}>
          <boxGeometry args={[size * 0.06, params.height, size * 0.1]} />
          <meshStandardMaterial color={night ? '#5b6b7c' : '#a7b4c2'} />
        </mesh>
      ) : null}

      {path.length > 1 ? <Line points={path} color={night ? '#fbbf24' : '#b45309'} lineWidth={showStrobe ? 1 : 2.4} transparent opacity={showStrobe ? 0.45 : 0.95} /> : null}
      {strobe.map((point) => (
        <mesh key={point.t} position={toScene(point.x, point.y)}>
          <sphereGeometry args={[ballRadius * 0.45, 12, 12]} />
          <meshStandardMaterial color={night ? '#fbbf24' : '#b45309'} />
        </mesh>
      ))}

      {/* Shadows on the axes: uniform motion along x, free fall along y */}
      <mesh position={[ball[0], 0.02, 0]}>
        <sphereGeometry args={[ballRadius * 0.55, 12, 12]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <Line points={[[-size * 0.08, 0, 0], [-size * 0.08, extent.height * 1.05, 0]]} color={ink} lineWidth={1} dashed dashSize={size * 0.02} gapSize={size * 0.015} />
      <mesh position={[-size * 0.08, ball[1], 0]}>
        <sphereGeometry args={[ballRadius * 0.55, 12, 12]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>

      <mesh position={ball}>
        <sphereGeometry args={[ballRadius, 24, 24]} />
        <meshStandardMaterial color={night ? '#f8fafc' : '#1e293b'} />
      </mesh>
      <VectorArrow from={ball} vector={[now.vx * speedScale, now.vy * speedScale, 0]} color="#7c3aed" label="v" width={3} />
      {showComponents ? (
        <>
          <VectorArrow from={ball} vector={[now.vx * speedScale, 0, 0]} color="#2563eb" label="vₓ" dashed />
          <VectorArrow from={ball} vector={[0, now.vy * speedScale, 0]} color="#dc2626" label="vᵧ" dashed />
        </>
      ) : null}
    </group>
  )
}
