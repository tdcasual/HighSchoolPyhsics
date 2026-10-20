import { Html } from '@react-three/drei/web/Html'
import { Line } from '../../scene3d/ClassroomLine'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import type { Vec3 } from '../../scene3d/VectorArrow'
import { MEDIA, refract, type MediumKey, type RefractionParams } from './model'

const RAY = 3.6
const RAD = Math.PI / 180
const MEDIUM_COLOR: Record<MediumKey, string> = { air: '#ffffff', water: '#7dd3fc', glass: '#a5f3fc', diamond: '#e9d5ff' }

/** Arc from the normal (pointing `up` or down) to a ray at `angleDeg`, on the given side. */
function arc(angleDeg: number, side: 1 | -1, up: boolean, radius: number): Vec3[] {
  return Array.from({ length: 21 }, (_, index) => {
    const a = (angleDeg * RAD * index) / 20
    return [side * radius * Math.sin(a), (up ? 1 : -1) * radius * Math.cos(a), 0.01]
  })
}

function Medium({ medium, top }: { medium: MediumKey; top: boolean }) {
  if (medium === 'air') return null
  return (
    <mesh position={[0, top ? 1.8 : -1.8, -0.6]}>
      <boxGeometry args={[9, 3.6, 1.2]} />
      <meshStandardMaterial color={MEDIUM_COLOR[medium]} transparent opacity={0.28 + MEDIA[medium].n * 0.05} depthWrite={false} />
    </mesh>
  )
}

function AngleLabel({ position, text, color }: { position: Vec3; text: string; color: string }) {
  return (
    <Html position={position} center distanceFactor={9}>
      <span className="vector-arrow-label" style={{ color }}>{text}</span>
    </Html>
  )
}

export function LightRefractionRig3D({ params, night, predicting }: { params: RefractionParams; night: boolean; predicting: boolean }) {
  const out = refract(params)
  const i = params.incidenceDeg
  const ink = night ? '#e2e8f0' : '#334155'
  const laser = '#ef4444'
  const incidentStart: Vec3 = [-RAY * Math.sin(i * RAD), RAY * Math.cos(i * RAD), 0]
  const reflectedEnd: Vec3 = [RAY * Math.sin(i * RAD), RAY * Math.cos(i * RAD), 0]
  const refractedEnd: Vec3 | null = out.refractionDeg !== null ? [RAY * Math.sin(out.refractionDeg * RAD), -RAY * Math.cos(out.refractionDeg * RAD), 0] : null
  return (
    <group>
      <SceneBackdrop day="#eef3f7" night="#141a22" />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 6, 8]} intensity={0.6} />
      <Medium medium={params.from} top />
      <Medium medium={params.to} top={false} />
      <Line points={[[-4.5, 0, 0], [4.5, 0, 0]]} color={ink} lineWidth={1.6} />
      <Line points={[[0, 3.6, 0], [0, -3.6, 0]]} color={ink} lineWidth={1} dashed dashSize={0.15} gapSize={0.1} />
      <AngleLabel position={[0.35, 3.75, 0]} text="法线" color={ink} />
      <AngleLabel position={[-4.1, 0.35, 0]} text={`${MEDIA[params.from].label} n₁ = ${MEDIA[params.from].n.toFixed(2)}`} color={ink} />
      <AngleLabel position={[-4.1, -0.35, 0]} text={`${MEDIA[params.to].label} n₂ = ${MEDIA[params.to].n.toFixed(2)}`} color={ink} />

      {/* Laser source and the three rays; reflected/refracted brightness follow the Fresnel split. */}
      <mesh position={incidentStart} rotation={[0, 0, i * RAD]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <Line points={[incidentStart, [0, 0, 0]]} color={laser} lineWidth={4} />
      <Line points={[[0, 0, 0], reflectedEnd]} color={laser} lineWidth={1.5 + 3 * out.reflectance} transparent opacity={0.2 + 0.8 * out.reflectance} />
      {refractedEnd ? <Line points={[[0, 0, 0], refractedEnd]} color={laser} lineWidth={1.5 + 3 * (1 - out.reflectance)} transparent opacity={0.2 + 0.8 * (1 - out.reflectance)} /> : null}

      {i > 0.5 ? (
        <>
          <Line points={arc(i, -1, true, 0.9)} color={ink} lineWidth={1.2} />
          <AngleLabel position={[-1.15 * Math.sin((i / 2) * RAD), 1.15 * Math.cos((i / 2) * RAD), 0]} text={`i = ${i.toFixed(0)}°`} color={ink} />
          <Line points={arc(i, 1, true, 0.7)} color={ink} lineWidth={1.2} />
        </>
      ) : null}
      {out.refractionDeg !== null && out.refractionDeg > 0.5 ? (
        <>
          <Line points={arc(out.refractionDeg, 1, false, 0.9)} color={ink} lineWidth={1.2} />
          <AngleLabel position={[1.2 * Math.sin((out.refractionDeg / 2) * RAD), -1.2 * Math.cos((out.refractionDeg / 2) * RAD), 0]} text={predicting ? 'r = ?' : `r = ${out.refractionDeg.toFixed(1)}°`} color={ink} />
        </>
      ) : null}
      {out.totalReflection ? <AngleLabel position={[1.6, -1.2, 0]} text="全反射：没有折射光" color={laser} /> : null}
    </group>
  )
}
