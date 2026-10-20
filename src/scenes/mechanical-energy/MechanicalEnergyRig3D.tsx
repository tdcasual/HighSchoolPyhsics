import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import { Shape } from 'three'
import { Line } from '../../scene3d/ClassroomLine'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { VectorArrow, type Vec3 } from '../../scene3d/VectorArrow'
import { BOWL_DEPTH, BOWL_HALF_WIDTH, G, energiesOf, trackY, type EnergyMotion, type EnergyParams } from './model'

type Props = { params: EnergyParams; motion: EnergyMotion; night: boolean }

const BAR_X = BOWL_HALF_WIDTH + 0.9
const BAR_HEIGHT = 2.6

function EnergyBar({ x, value, full, color, label }: { x: number; value: number; full: number; color: string; label: string }) {
  const height = Math.max(0.001, (value / full) * BAR_HEIGHT)
  return (
    <group>
      <mesh position={[x, height / 2, 0]}>
        <boxGeometry args={[0.32, height, 0.32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html position={[x, -0.3, 0]} center distanceFactor={9}>
        <span className="vector-arrow-label" style={{ color }}>{label}</span>
      </Html>
    </group>
  )
}

export function MechanicalEnergyRig3D({ params, motion, night }: Props) {
  const track = useMemo(() => {
    const points: Vec3[] = []
    for (let i = 0; i <= 120; i++) {
      const x = -BOWL_HALF_WIDTH + (2 * BOWL_HALF_WIDTH * i) / 120
      points.push([x, trackY(x), 0])
    }
    return points
  }, [])
  const body = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-BOWL_HALF_WIDTH, -0.3)
    track.forEach(([x, y]) => shape.lineTo(x, y))
    shape.lineTo(BOWL_HALF_WIDTH, -0.3)
    shape.lineTo(-BOWL_HALF_WIDTH, -0.3)
    return shape
  }, [track])

  const energies = energiesOf(params, motion)
  const full = params.mass * G * params.releaseHeight
  const slope = (2 * BOWL_DEPTH * motion.x) / (BOWL_HALF_WIDTH * BOWL_HALF_WIDTH)
  const norm = Math.hypot(1, slope)
  const normal: Vec3 = [-slope / norm, 1 / norm, 0]
  const block: Vec3 = [motion.x + normal[0] * 0.14, energies.height + normal[1] * 0.14, 0]
  const ink = night ? '#e2e8f0' : '#334155'

  return (
    <group>
      <SceneBackdrop day="#eef3f7" night="#141a22" />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 8, 8]} intensity={0.8} />

      <mesh position={[0, 0, -0.4]}>
        <extrudeGeometry args={[body, { depth: 0.8, bevelEnabled: false }]} />
        <meshStandardMaterial color={night ? '#3b4654' : '#cbd5e1'} />
      </mesh>
      <Line points={track.map(([x, y]) => [x, y, 0.41] as Vec3)} color={params.mu > 0 ? '#a16207' : '#2563eb'} lineWidth={3} />

      {/* Release height: on a smooth track the block climbs back exactly to this line. */}
      <Line points={[[-BOWL_HALF_WIDTH - 0.3, params.releaseHeight, 0.42], [BOWL_HALF_WIDTH + 0.3, params.releaseHeight, 0.42]]} color={ink} lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />
      <Html position={[-BOWL_HALF_WIDTH - 0.6, params.releaseHeight, 0.42]} center distanceFactor={9}>
        <span className="vector-arrow-label" style={{ color: ink }}>h₀</span>
      </Html>

      <mesh position={block}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {Math.abs(motion.v) > 0.05 ? (
        <VectorArrow from={[block[0], block[1], 0.5]} vector={[(motion.v / norm) * 0.35, (motion.v * slope / norm) * 0.35, 0]} color="#7c3aed" label="v" />
      ) : null}

      {/* Live energy bars, scaled to the starting energy mgh₀ */}
      <EnergyBar x={BAR_X} value={energies.kinetic} full={full} color="#dc2626" label="Eₖ" />
      <EnergyBar x={BAR_X + 0.55} value={energies.potential} full={full} color="#2563eb" label="Eₚ" />
      <EnergyBar x={BAR_X + 1.1} value={energies.mechanical} full={full} color="#7c3aed" label="E" />
      {params.mu > 0 ? <EnergyBar x={BAR_X + 1.65} value={energies.heat} full={full} color="#a16207" label="Q" /> : null}
      <Line points={[[BAR_X - 0.3, BAR_HEIGHT, 0], [BAR_X + 1.95, BAR_HEIGHT, 0]]} color={ink} lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
    </group>
  )
}
