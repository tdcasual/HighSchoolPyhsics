import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import { useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Plane, Vector3 } from 'three'
import type { ThemeMode } from '../../store/useAppStore'
import { angleOf, clamp, magnitude, type Vector2 } from './model'
import type { ForceCompositionSceneState } from './useForceCompositionSceneState'

type Props = Pick<ForceCompositionSceneState, 'mode' | 'rule' | 'f1' | 'f2' | 'rangeF1' | 'rangeF2' | 'displayRangeAngleDeg' | 'orthogonalMagnitude' | 'orthogonalAngleDeg' | 'gravity' | 'slopeAngleDeg' | 'setF1' | 'setF2' | 'setOrthogonalMagnitude' | 'setOrthogonalAngleDeg'> & { theme: ThemeMode }
type Point = [number, number, number]

const VECTOR_SCALE = 0.65
const DRAG_LIMIT = 7

function p(vector: Vector2, scale = VECTOR_SCALE): Point { return [vector.x * scale, vector.y * scale, 0] }

function Arrow({ start, end, color, label, labelOffset = [0, 0.18, 0] as Point }: { start: Point; end: Point; color: string; label: string; labelOffset?: Point }) {
  return <group><Line points={[start, end]} color={color} lineWidth={3} /><mesh position={end}><sphereGeometry args={[0.1, 12, 12]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + labelOffset[0], end[1] + labelOffset[1], end[2] + labelOffset[2]]} center distanceFactor={8}><span style={{ color, fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(255,255,255,0.75)' }}>{label}</span></Html></group>
}

function DraggableVectorHandle({ position, color, onDrag }: { position: Point; color: string; onDrag: (vector: Vector2) => void }) {
  const [dragging, setDragging] = useState(false)
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const dragHitPoint = useMemo(() => new Vector3(), [])

  const applyDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!event.ray.intersectPlane(dragPlane, dragHitPoint)) return
    onDrag({ x: clamp(dragHitPoint.x / VECTOR_SCALE, -DRAG_LIMIT, DRAG_LIMIT), y: clamp(dragHitPoint.y / VECTOR_SCALE, -DRAG_LIMIT, DRAG_LIMIT) })
  }
  const capturePointer = (event: ThreeEvent<PointerEvent>) => {
    const target = event.nativeEvent.target
    if (target instanceof Element) target.setPointerCapture(event.pointerId)
  }
  const releasePointer = (event: ThreeEvent<PointerEvent>) => {
    const target = event.nativeEvent.target
    if (target instanceof Element) target.releasePointerCapture(event.pointerId)
  }

  return <group position={position}>
    <mesh><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={dragging ? 0.75 : 0.35} /></mesh>
    <mesh onPointerDown={(event) => { event.stopPropagation(); capturePointer(event); setDragging(true); applyDrag(event) }} onPointerMove={(event) => { if (!dragging) return; event.stopPropagation(); applyDrag(event) }} onPointerUp={(event) => { if (!dragging) return; event.stopPropagation(); releasePointer(event); setDragging(false) }} onPointerCancel={() => setDragging(false)}>
      <sphereGeometry args={[0.34, 10, 10]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  </group>
}

function PlaneGrid({ dark }: { dark: boolean }) { return <group>{Array.from({ length: 9 }, (_, i) => <Line key={`h-${i}`} points={[[-5, (i - 4) * 0.8, -0.02], [5, (i - 4) * 0.8, -0.02]]} color={dark ? '#40505d' : '#cbd5d9'} lineWidth={0.6} />)}{Array.from({ length: 13 }, (_, i) => <Line key={`v-${i}`} points={[[i - 6, -3.2, -0.02], [i - 6, 3.2, -0.02]]} color={dark ? '#40505d' : '#cbd5d9'} lineWidth={0.6} />)}</group> }

export function ForceCompositionRig3D(props: Props) {
  const { mode, rule, f1, f2, rangeF1, rangeF2, displayRangeAngleDeg, orthogonalMagnitude, orthogonalAngleDeg, gravity, slopeAngleDeg, theme, setF1, setF2, setOrthogonalMagnitude, setOrthogonalAngleDeg } = props
  const dark = theme === 'night'
  const origin: Point = [0, 0, 0]
  const f1Point = p(f1)
  const f2Point = p(f2)
  const sumPoint: Point = [f1Point[0] + f2Point[0], f1Point[1] + f2Point[1], 0]
  const rangeAngle = displayRangeAngleDeg * Math.PI / 180
  const rangeF1Point: Point = [rangeF1 / 12, 0, 0]
  const rangeF2Point: Point = [Math.cos(rangeAngle) * rangeF2 / 12, Math.sin(rangeAngle) * rangeF2 / 12, 0]
  const rangeSumPoint: Point = [rangeF1Point[0] + rangeF2Point[0], rangeF1Point[1] + rangeF2Point[1], 0]
  const orthoAngle = orthogonalAngleDeg * Math.PI / 180
  const orthoPoint: Point = [Math.cos(orthoAngle) * orthogonalMagnitude / 12, Math.sin(orthoAngle) * orthogonalMagnitude / 12, 0]
  const slope = slopeAngleDeg * Math.PI / 180
  const slopeOrigin: Point = [-1.7, -1.1, 0]
  const slopeG1: Point = [slopeOrigin[0] + Math.cos(slope) * gravity / 18, slopeOrigin[1] - Math.sin(slope) * gravity / 18, 0]
  const slopeG2: Point = [slopeOrigin[0] - Math.sin(slope) * gravity / 18, slopeOrigin[1] - Math.cos(slope) * gravity / 18, 0]
  const textColor = dark ? '#e4edf4' : '#343a40'

  const setOrthoVector = (vector: Vector2) => {
    const length = Math.max(1, magnitude(vector) * 12)
    const angle = clamp(angleOf(vector), 0, 90)
    setOrthogonalMagnitude(length)
    setOrthogonalAngleDeg(angle)
  }

  return <group data-rig-scene="force-composition"><ambientLight intensity={dark ? 0.75 : 0.95} /><directionalLight position={[5, 8, 9]} intensity={0.8} /><color attach="background" args={[dark ? '#101823' : '#f4f5f3']} /><PlaneGrid dark={dark} />
    {mode === 'synthesis' && <>
      <Arrow start={origin} end={f1Point} color="#e63946" label={`F₁ ${magnitude(f1).toFixed(1)} N`} />
      <Arrow start={origin} end={f2Point} color="#1e88e5" label={`F₂ ${magnitude(f2).toFixed(1)} N`} labelOffset={[0.08, 0.18, 0]} />
      <Arrow start={origin} end={sumPoint} color="#2a9d8f" label={`F合 ${magnitude({ x: f1.x + f2.x, y: f1.y + f2.y }).toFixed(1)} N`} labelOffset={[0.1, -0.2, 0]} />
      <DraggableVectorHandle position={f1Point} color="#e63946" onDrag={setF1} />
      <DraggableVectorHandle position={f2Point} color="#1e88e5" onDrag={setF2} />
      {rule === 'triangle' && <Line points={[f1Point, sumPoint]} color="#1e88e5" lineWidth={2} dashed dashSize={0.14} gapSize={0.1} />}
      {rule === 'parallelogram' && <><Line points={[f1Point, sumPoint]} color="#1e88e5" lineWidth={1.4} dashed dashSize={0.12} gapSize={0.1} /><Line points={[f2Point, sumPoint]} color="#e63946" lineWidth={1.4} dashed dashSize={0.12} gapSize={0.1} /></>}
    </>}
    {mode === 'range' && <>
      <Arrow start={origin} end={rangeF1Point} color="#e63946" label={`F₁ ${rangeF1}`} />
      <Arrow start={origin} end={rangeF2Point} color="#1e88e5" label={`F₂ ${rangeF2}`} labelOffset={[0.1, 0.16, 0]} />
      <Arrow start={origin} end={rangeSumPoint} color="#2a9d8f" label={`F合 ${(Math.hypot(rangeSumPoint[0], rangeSumPoint[1]) * 12).toFixed(1)}`} labelOffset={[0.1, -0.18, 0]} />
      <Line points={[rangeF1Point, rangeSumPoint]} color="#1e88e5" lineWidth={1.2} dashed dashSize={0.12} gapSize={0.1} />
      <Line points={[rangeF2Point, rangeSumPoint]} color="#e63946" lineWidth={1.2} dashed dashSize={0.12} gapSize={0.1} />
      <Html position={[0, -3.45, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '11px' }}>夹角 θ = {displayRangeAngleDeg.toFixed(1)}°</span></Html>
    </>}
    {mode === 'orthogonal' && <>
      <Line points={[[0, -3.1, 0], [0, 3.1, 0]]} color={textColor} lineWidth={1.4} />
      <Line points={[[-5, 0, 0], [5, 0, 0]]} color={textColor} lineWidth={1.4} />
      <Arrow start={origin} end={orthoPoint} color="#2a9d8f" label={`F ${orthogonalMagnitude}`} />
      <Arrow start={origin} end={[orthoPoint[0], 0, 0]} color="#d62828" label={`Fx ${Math.abs(orthogonalMagnitude * Math.cos(orthoAngle)).toFixed(1)}`} labelOffset={[0, -0.22, 0]} />
      <Arrow start={origin} end={[0, orthoPoint[1], 0]} color="#0077b6" label={`Fy ${Math.abs(orthogonalMagnitude * Math.sin(orthoAngle)).toFixed(1)}`} labelOffset={[0.18, 0, 0]} />
      <Line points={[[orthoPoint[0], 0, 0], orthoPoint, [0, orthoPoint[1], 0]]} color="#64748b" lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />
      <Line points={[[orthoPoint[0] - 0.16, 0, 0], [orthoPoint[0] - 0.16, orthoPoint[1] - 0.16, 0], [orthoPoint[0], orthoPoint[1] - 0.16, 0]]} color="#64748b" lineWidth={1.2} />
      <DraggableVectorHandle position={orthoPoint} color="#2a9d8f" onDrag={setOrthoVector} />
    </>}
    {mode === 'effect' && <>
      <mesh position={[-0.2, -1.45, 0]} rotation={[0, 0, -slope]}><boxGeometry args={[4.8, 0.16, 0.35]} /><meshStandardMaterial color="#d5a85d" /></mesh>
      <mesh position={[-2.0, -0.5, 0]} rotation={[0, 0, -slope]}><boxGeometry args={[0.8, 0.58, 0.62]} /><meshStandardMaterial color="#8d6e63" /></mesh>
      <Arrow start={slopeOrigin} end={[slopeOrigin[0], slopeOrigin[1] - gravity / 18, 0]} color="#e63946" label={`G ${gravity} N`} labelOffset={[0.1, -0.18, 0]} />
      <Arrow start={slopeOrigin} end={slopeG1} color="#1e88e5" label={`G∥ ${Math.abs(gravity * Math.sin(slope)).toFixed(1)} N`} />
      <Arrow start={slopeOrigin} end={slopeG2} color="#2a9d8f" label={`G⊥ ${Math.abs(gravity * Math.cos(slope)).toFixed(1)} N`} labelOffset={[-0.16, -0.1, 0]} />
      <Line points={[slopeG1, slopeOrigin, slopeG2]} color="#64748b" lineWidth={1.1} dashed dashSize={0.1} gapSize={0.1} />
    </>}
    <Html position={[0, 3.35, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap' }}>{mode === 'effect' ? 'G = G∥ + G⊥ · 按效果分解' : 'O · 共点力矢量模型'}</span></Html>
  </group>
}
