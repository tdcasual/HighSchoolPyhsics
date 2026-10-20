import { Line } from '../../scene3d/ClassroomLine'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { VectorArrow, type Vec3 } from '../../scene3d/VectorArrow'
import { GRAVITY, type PendulumParams, type PendulumState } from './model'

/** Scene units per metre; the 2 m pendulum stays inside the view. */
const S = 2.2

export function SimplePendulumRig3D({ params, state, night }: { params: PendulumParams; state: PendulumState; night: boolean }) {
  const length = params.length * S
  const pivot: Vec3 = [0, 2 * S + 0.3, 0]
  const bob: Vec3 = [pivot[0] + length * Math.sin(state.theta), pivot[1] - length * Math.cos(state.theta), 0]
  const amplitude = (params.amplitudeDeg * Math.PI) / 180
  const arc = Array.from({ length: 41 }, (_, i) => {
    const angle = -amplitude + (2 * amplitude * i) / 40
    return [pivot[0] + length * Math.sin(angle), pivot[1] - length * Math.cos(angle), 0] as Vec3
  })
  const ink = night ? '#e2e8f0' : '#334155'
  const g = GRAVITY[params.gravity]
  // Restoring force mg·sinθ along the tangent, towards the lowest point. At classroom amplitudes it
  // is a few percent of mg, so it is drawn three times larger (and labelled so).
  const restoring = -Math.sin(state.theta) * 1.6 * 3
  const tangent: Vec3 = [Math.cos(state.theta), Math.sin(state.theta), 0]
  const bobRadius = 0.12 + Math.cbrt(params.mass) * 0.12
  return (
    <group>
      <SceneBackdrop day="#eef3f7" night="#141a22" />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 8, 6]} intensity={0.8} />
      <mesh position={[0, pivot[1] + 0.12, 0]}>
        <boxGeometry args={[2.4, 0.2, 0.6]} />
        <meshStandardMaterial color={night ? '#5b6b7c' : '#94a3b8'} />
      </mesh>
      <Line points={[pivot, [pivot[0], pivot[1] - length - 0.4, 0]]} color={ink} lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />
      <Line points={arc} color={night ? '#fbbf24' : '#b45309'} lineWidth={1.2} dashed dashSize={0.1} gapSize={0.08} />
      <Line points={[pivot, bob]} color={ink} lineWidth={1.6} />
      <mesh position={bob}>
        <sphereGeometry args={[bobRadius, 24, 24]} />
        <meshStandardMaterial color="#2563eb" metalness={0.3} roughness={0.3} />
      </mesh>
      <VectorArrow from={bob} vector={[0, -1.6, 0]} color="#475569" label={`mg（g = ${g}）`} />
      {Math.abs(restoring) > 0.03 ? (
        <VectorArrow from={bob} vector={tangent.map((c) => c * restoring) as Vec3} color="#dc2626" label="F回 = mg sinθ（×3）" />
      ) : null}
    </group>
  )
}
