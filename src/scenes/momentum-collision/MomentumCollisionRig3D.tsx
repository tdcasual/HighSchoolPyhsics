import { Html } from '@react-three/drei/web/Html'
import { Line } from '../../scene3d/ClassroomLine'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { VectorArrow } from '../../scene3d/VectorArrow'
import { GLIDER_LENGTH, TRACK_LENGTH, glidersAt, type CollisionParams } from './model'

/** Scene units per metre: the 2 m air track is 8 units long, centred on the origin. */
const S = 4
const X0 = -(TRACK_LENGTH * S) / 2
const toX = (metres: number) => X0 + metres * S

function Glider({ x, velocity, mass, name, color, bumper }: { x: number; velocity: number; mass: number; name: string; color: string; bumper: 'spring' | 'velcro' | 'none' }) {
  const width = GLIDER_LENGTH * S
  // Heavier gliders are drawn taller, so mass is visible at a glance.
  const height = 0.35 + mass * 1.2
  return (
    <group position={[toX(x), 0.3 + height / 2, 0]}>
      <mesh>
        <boxGeometry args={[width, height, 0.7]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {bumper === 'spring' ? (
        // A zig-zag buffer spring on the leading face (elastic collisions).
        <Line points={Array.from({ length: 13 }, (_, i) => [width / 2 + 0.02 * i, i % 2 === 0 ? 0.08 : -0.08, 0] as [number, number, number])} color="#64748b" lineWidth={1.6} />
      ) : null}
      {bumper === 'velcro' ? (
        <mesh position={[name === 'A' ? width / 2 + 0.02 : -width / 2 - 0.02, 0, 0]}>
          <boxGeometry args={[0.04, height * 0.7, 0.6]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ) : null}
      {/* Name and mass on the front face; A's velocity arrow sits higher than B's so they never overlap. */}
      <Html position={[0, 0, 0.36]} center distanceFactor={7}>
        <span className="vector-arrow-label" style={{ color: '#ffffff', textShadow: 'none' }}>{name}<br />{mass.toFixed(2)} kg</span>
      </Html>
      {Math.abs(velocity) > 1e-3 ? (
        <VectorArrow from={[0, (name === 'A' ? 1.55 : 0.85) - height / 2, 0]} vector={[velocity * 2.4, 0, 0]} color={color} label={`v${name === 'A' ? '₁' : '₂'} ${velocity.toFixed(2)} m/s`} />
      ) : null}
    </group>
  )
}

export function MomentumCollisionRig3D({ params, time, night }: { params: CollisionParams; time: number; night: boolean }) {
  const state = glidersAt(params, time)
  const bumper = params.kind === 'elastic' ? 'spring' : params.kind === 'perfectly-inelastic' ? 'velcro' : 'none'
  return (
    <group>
      <SceneBackdrop day="#eef3f7" night="#141a22" />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 8, 6]} intensity={0.8} />
      {/* Air track with end stops */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[TRACK_LENGTH * S + 0.4, 0.3, 0.5]} />
        <meshStandardMaterial color={night ? '#64748b' : '#94a3b8'} metalness={0.4} roughness={0.35} />
      </mesh>
      {[toX(0) - 0.1, toX(TRACK_LENGTH) + 0.1].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      <Glider x={state.xA} velocity={state.vA} mass={params.massA} name="A" color="#2563eb" bumper={bumper} />
      <Glider x={state.xB} velocity={state.vB} mass={params.massB} name="B" color="#dc2626" bumper={bumper === 'velcro' ? 'velcro' : 'none'} />
    </group>
  )
}
