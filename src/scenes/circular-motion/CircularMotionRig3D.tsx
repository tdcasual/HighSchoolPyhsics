import { Line } from '../../scene3d/ClassroomLine'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { VectorArrow, type Vec3 } from '../../scene3d/VectorArrow'
import { G, conicalReadings, turntableReadings, type CircularMode, type ConicalParams, type TurntableParams } from './model'
import { TABLE_RADIUS_M } from './useCircularMotionSceneState'

type Props = {
  mode: CircularMode
  turntable: TurntableParams
  conical: ConicalParams
  phase: number
  slipDistance: number
  slipPhase: number
  night: boolean
}

/** Turntable drawn at 6 scene units per metre; the pendulum at 3. */
const TABLE_SCALE = 6
const PENDULUM_SCALE = 3

function circle(radius: number, y: number, segments = 72): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2
    return [radius * Math.cos(angle), y, -radius * Math.sin(angle)]
  })
}

/** Position on a horizontal circle; the scene rotates counter-clockwise seen from above. */
const onCircle = (radius: number, angle: number, y: number): Vec3 => [radius * Math.cos(angle), y, -radius * Math.sin(angle)]
const tangent = (angle: number): Vec3 => [-Math.sin(angle), 0, -Math.cos(angle)]

function Turntable({ params, phase, slipDistance, slipPhase, night }: { params: TurntableParams; phase: number; slipDistance: number; slipPhase: number; night: boolean }) {
  const readings = turntableReadings(params)
  const tableRadius = TABLE_RADIUS_M * TABLE_SCALE
  const r = params.radius * TABLE_SCALE
  const sliding = slipDistance > 0
  const angle = sliding ? slipPhase : phase
  const start = onCircle(r, angle, 0.32)
  const t = tangent(angle)
  const block: Vec3 = sliding ? [start[0] + t[0] * slipDistance * TABLE_SCALE, start[1], start[2] + t[2] * slipDistance * TABLE_SCALE] : start
  const forceScale = 2.4 / Math.max(readings.requiredForce, readings.maxFriction)
  const inward: Vec3 = [-Math.cos(angle), 0, Math.sin(angle)]
  // On the table the friction supplies the centripetal force; once sliding there is none toward the axis.
  const friction = Math.min(readings.requiredForce, readings.maxFriction) * forceScale
  return (
    <group>
      <group rotation={[0, phase, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[tableRadius, tableRadius, 0.3, 72]} />
          <meshStandardMaterial color={night ? '#3b4654' : '#c9d3dd'} />
        </mesh>
        <Line points={[[0, 0.16, 0], [tableRadius, 0.16, 0]]} color={night ? '#94a3b8' : '#64748b'} lineWidth={1.4} />
      </group>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 1, 16]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Line points={circle(r, 0.17)} color={night ? '#fbbf24' : '#b45309'} lineWidth={1.2} dashed dashSize={0.18} gapSize={0.12} />
      <mesh position={block}>
        <boxGeometry args={[0.55, 0.4, 0.55]} />
        <meshStandardMaterial color={sliding ? '#dc2626' : '#2563eb'} />
      </mesh>
      <VectorArrow from={[block[0], 0.75, block[2]]} vector={[t[0] * (0.8 + readings.speed * 1.2), 0, t[2] * (0.8 + readings.speed * 1.2)]} color="#7c3aed" label="v" />
      {!sliding ? (
        <VectorArrow from={[block[0], 0.5, block[2]]} vector={[inward[0] * friction, 0, inward[2] * friction]} color="#dc2626" label="f静 = Fₙ" />
      ) : null}
    </group>
  )
}

function ConicalPendulum({ params, phase, night }: { params: ConicalParams; phase: number; night: boolean }) {
  const readings = conicalReadings(params)
  const length = params.length * PENDULUM_SCALE
  const pivot: Vec3 = [0, length + 0.6, 0]
  const radius = readings.radius * PENDULUM_SCALE
  const ball: Vec3 = [...onCircle(radius, phase, pivot[1] - readings.depth * PENDULUM_SCALE)] as Vec3
  const weight = params.mass * G
  const forceScale = 1.4 / Math.max(readings.tension, weight)
  const toPivot: Vec3 = [(pivot[0] - ball[0]) / length, (pivot[1] - ball[1]) / length, (pivot[2] - ball[2]) / length]
  const inward: Vec3 = radius > 0 ? [-ball[0] / radius, 0, -ball[2] / radius] : [0, 0, 0]
  return (
    <group>
      <mesh position={[0, pivot[1] + 0.1, 0]}>
        <boxGeometry args={[1.6, 0.16, 0.6]} />
        <meshStandardMaterial color={night ? '#5b6b7c' : '#94a3b8'} />
      </mesh>
      <Line points={[[0, pivot[1], 0], [0, 0.2, 0]]} color={night ? '#64748b' : '#94a3b8'} lineWidth={1} dashed dashSize={0.15} gapSize={0.12} />
      {radius > 0 ? <Line points={circle(radius, ball[1])} color={night ? '#fbbf24' : '#b45309'} lineWidth={1.2} dashed dashSize={0.18} gapSize={0.12} /> : null}
      <Line points={[pivot, ball]} color={night ? '#e2e8f0' : '#334155'} lineWidth={2} />
      <mesh position={ball}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <VectorArrow from={ball} vector={[0, -weight * forceScale, 0]} color="#475569" label="mg" />
      <VectorArrow from={ball} vector={toPivot.map((c) => c * readings.tension * forceScale) as Vec3} color="#ea580c" label="F拉" />
      {radius > 0 ? (
        <VectorArrow from={ball} vector={inward.map((c) => c * readings.centripetalForce * forceScale) as Vec3} color="#dc2626" label="F合 = Fₙ" dashed />
      ) : null}
    </group>
  )
}

export function CircularMotionRig3D({ mode, turntable, conical, phase, slipDistance, slipPhase, night }: Props) {
  return (
    <group>
      <SceneBackdrop day="#eef3f7" night="#141a22" />
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 12, 8]} intensity={0.9} />
      {mode === 'turntable' ? (
        <Turntable params={turntable} phase={phase} slipDistance={slipDistance} slipPhase={slipPhase} night={night} />
      ) : (
        <ConicalPendulum params={conical} phase={phase} night={night} />
      )}
    </group>
  )
}
