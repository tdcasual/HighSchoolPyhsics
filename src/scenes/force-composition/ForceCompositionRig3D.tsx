import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import type { Vector2 } from './model'
import type { ForceCompositionSceneState } from './useForceCompositionSceneState'

type Props = Pick<ForceCompositionSceneState, 'mode' | 'rule' | 'f1' | 'f2' | 'rangeF1' | 'rangeF2' | 'rangeAngleDeg' | 'rangeSweep' | 'orthogonalMagnitude' | 'orthogonalAngleDeg' | 'gravity' | 'slopeAngleDeg' | 'elapsed' | 'running'> & { theme: ThemeMode }
type Point = [number, number, number]

function p(vector: Vector2, scale = 0.65): Point { return [vector.x * scale, vector.y * scale, 0] }
function Arrow({ start, end, color, label, labelOffset = [0, 0.18, 0] as Point }: { start: Point; end: Point; color: string; label: string; labelOffset?: Point }) {
  return <group><Line points={[start, end]} color={color} lineWidth={3} /><mesh position={end}><sphereGeometry args={[0.1, 12, 12]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + labelOffset[0], end[1] + labelOffset[1], end[2] + labelOffset[2]]} center distanceFactor={8}><span style={{ color, fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(255,255,255,0.75)' }}>{label}</span></Html></group>
}
function PlaneGrid({ dark }: { dark: boolean }) { return <group>{Array.from({ length: 9 }, (_, i) => <Line key={`h-${i}`} points={[[-5, (i - 4) * 0.8, -0.02], [5, (i - 4) * 0.8, -0.02]]} color={dark ? '#40505d' : '#cbd5d9'} lineWidth={0.6} />)}{Array.from({ length: 13 }, (_, i) => <Line key={`v-${i}`} points={[[i - 6, -3.2, -0.02], [i - 6, 3.2, -0.02]]} color={dark ? '#40505d' : '#cbd5d9'} lineWidth={0.6} />)}</group> }

export function ForceCompositionRig3D(props: Props) {
  const { mode, rule, f1, f2, rangeF1, rangeF2, rangeAngleDeg, rangeSweep, orthogonalMagnitude, orthogonalAngleDeg, gravity, slopeAngleDeg, elapsed, running, theme } = props
  const dark = theme === 'night'
  const origin: Point = [0, 0, 0]
  const f1Point = p(f1)
  const f2Point = p(f2)
  const sumPoint: Point = [f1Point[0] + f2Point[0], f1Point[1] + f2Point[1], 0]
  const rangeAngle = (rangeAngleDeg + (rangeSweep && running ? Math.sin(elapsed * 1.2) * 8 : 0)) * Math.PI / 180
  const rangeF1Point: Point = [rangeF1 / 12, 0, 0]
  const rangeF2Point: Point = [Math.cos(rangeAngle) * rangeF2 / 12, Math.sin(rangeAngle) * rangeF2 / 12, 0]
  const orthoAngle = orthogonalAngleDeg * Math.PI / 180
  const orthoPoint: Point = [Math.cos(orthoAngle) * orthogonalMagnitude / 12, Math.sin(orthoAngle) * orthogonalMagnitude / 12, 0]
  const slope = slopeAngleDeg * Math.PI / 180
  const slopeOrigin: Point = [-1.7, -1.1, 0]
  const slopeG1: Point = [slopeOrigin[0] + Math.cos(slope) * gravity / 18, slopeOrigin[1] - Math.sin(slope) * gravity / 18, 0]
  const slopeG2: Point = [slopeOrigin[0] - Math.sin(slope) * gravity / 18, slopeOrigin[1] - Math.cos(slope) * gravity / 18, 0]
  const textColor = dark ? '#e4edf4' : '#343a40'
  return <group data-rig-scene="force-composition"><ambientLight intensity={dark ? 0.75 : 0.95} /><directionalLight position={[5, 8, 9]} intensity={0.8} /><color attach="background" args={[dark ? '#101823' : '#f4f5f3']} /><PlaneGrid dark={dark} />
    {mode === 'synthesis' && <><Arrow start={origin} end={f1Point} color="#e63946" label={`F₁ ${Math.hypot(f1.x, f1.y).toFixed(1)} N`} /><Arrow start={origin} end={f2Point} color="#1e88e5" label={`F₂ ${Math.hypot(f2.x, f2.y).toFixed(1)} N`} labelOffset={[0.08, 0.18, 0]} /><Arrow start={origin} end={sumPoint} color="#2a9d8f" label={`F合 ${Math.hypot(f1.x + f2.x, f1.y + f2.y).toFixed(1)} N`} labelOffset={[0.1, -0.2, 0]} />{rule === 'triangle' && <Line points={[f1Point, sumPoint]} color="#1e88e5" lineWidth={2} dashed dashSize={0.14} gapSize={0.1} />}{rule === 'parallelogram' && <><Line points={[f1Point, sumPoint]} color="#1e88e5" lineWidth={1.4} dashed dashSize={0.12} gapSize={0.1} /><Line points={[f2Point, sumPoint]} color="#e63946" lineWidth={1.4} dashed dashSize={0.12} gapSize={0.1} /></>}</>}
    {mode === 'range' && <><Arrow start={origin} end={rangeF1Point} color="#e63946" label={`F₁ ${rangeF1}`} /><Arrow start={origin} end={rangeF2Point} color="#1e88e5" label={`F₂ ${rangeF2}`} labelOffset={[0.1, 0.16, 0]} /><Arrow start={origin} end={[rangeF1Point[0] + rangeF2Point[0], rangeF1Point[1] + rangeF2Point[1], 0]} color="#2a9d8f" label="F合" labelOffset={[0.1, -0.18, 0]} /></>}
    {mode === 'orthogonal' && <><Line points={[[0, -3.1, 0], [0, 3.1, 0]]} color={textColor} lineWidth={1.4} /><Line points={[[-5, 0, 0], [5, 0, 0]]} color={textColor} lineWidth={1.4} /><Arrow start={origin} end={orthoPoint} color="#2a9d8f" label={`F ${orthogonalMagnitude}`} /><Arrow start={origin} end={[orthoPoint[0], 0, 0]} color="#d62828" label={`Fx ${Math.abs(orthogonalMagnitude * Math.cos(orthoAngle)).toFixed(1)}`} labelOffset={[0, -0.22, 0]} /><Arrow start={origin} end={[0, orthoPoint[1], 0]} color="#0077b6" label={`Fy ${Math.abs(orthogonalMagnitude * Math.sin(orthoAngle)).toFixed(1)}`} labelOffset={[0.18, 0, 0]} /><Line points={[[orthoPoint[0], 0, 0], orthoPoint, [0, orthoPoint[1], 0]]} color="#64748b" lineWidth={1} dashed dashSize={0.12} gapSize={0.1} /></>}
    {mode === 'effect' && <><mesh position={[-0.2, -1.45, 0]} rotation={[0, 0, -slope]}><boxGeometry args={[4.8, 0.16, 0.35]} /><meshStandardMaterial color="#d5a85d" /></mesh><mesh position={[-2.0, -0.5, 0]} rotation={[0, 0, -slope]}><boxGeometry args={[0.8, 0.58, 0.62]} /><meshStandardMaterial color="#8d6e63" /></mesh><Arrow start={slopeOrigin} end={[slopeOrigin[0], slopeOrigin[1] - gravity / 18, 0]} color="#e63946" label={`G ${gravity} N`} labelOffset={[0.1, -0.18, 0]} /><Arrow start={slopeOrigin} end={slopeG1} color="#1e88e5" label={`G₁ ${Math.abs(gravity * Math.sin(slope)).toFixed(1)} N`} /><Arrow start={slopeOrigin} end={slopeG2} color="#2a9d8f" label={`G₂ ${Math.abs(gravity * Math.cos(slope)).toFixed(1)} N`} labelOffset={[-0.16, -0.1, 0]} /></>}
    <Html position={[0, 3.35, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>O · 共点力矢量模型</span></Html>
  </group>
}
