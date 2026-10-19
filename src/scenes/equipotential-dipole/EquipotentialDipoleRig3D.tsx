import { useMemo } from 'react'
import { Line } from '../../scene3d/ClassroomLine'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildEquipotentialContours, buildFieldArcLines } from './model'
import type { EquipotentialDipoleSceneState } from './useEquipotentialDipoleSceneState'

type Point = [number, number, number]
type Props = Pick<EquipotentialDipoleSceneState, 'elapsed' | 'flow' | 'showEquipotential' | 'showVectors' | 'separation' | 'charge' | 'probeX' | 'probeY' | 'readings'> & { theme: ThemeMode }

function vectorEnd(origin: Point, vector: { x: number; y: number }): Point {
  const magnitude = Math.hypot(vector.x, vector.y)
  if (magnitude < 1e-8) return origin
  const drawnLength = Math.min(1.45, Math.max(0.24, 0.16 + 0.55 * Math.sqrt(magnitude / 1e7)))
  const factor = drawnLength / magnitude
  return [origin[0] + vector.x * factor, origin[1] + vector.y * factor, origin[2]]
}

function FieldArrow({ start, end, color, label, labelOffset }: { start: Point; end: Point; color: string; label: string; labelOffset: [number, number] }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (Math.hypot(dx, dy) < 1e-6) return null
  return <group>
    <Line points={[start, end]} color={color} lineWidth={2.5} />
    <mesh position={end} rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}><coneGeometry args={[0.09, 0.25, 8]} /><meshBasicMaterial color={color} /></mesh>
    <Html position={[end[0] + labelOffset[0], end[1] + labelOffset[1], end[2] + 0.04]} center distanceFactor={8}><span style={{ color, fontSize: '11px', fontWeight: 900 }}>{label}</span></Html>
  </group>
}

function Contour({ points, polarity, dark }: { points: Point[]; polarity: 'positive' | 'negative'; dark: boolean }) {
  return <Line points={points} color={polarity === 'positive' ? (dark ? '#d8bd83' : '#c29a51') : (dark ? '#9bb7d1' : '#7798b6')} lineWidth={1.15} dashed dashScale={2.3} dashSize={0.12} gapSize={0.08} transparent opacity={0.78} />
}

export function EquipotentialDipoleRig3D({ elapsed, flow, showEquipotential, showVectors, separation, charge, probeX, probeY, readings, theme }: Props) {
  const dark = theme === 'night'
  const text = dark ? '#eef2f7' : '#3d4650'
  const half = separation / 2
  const positive: Point = [-half, 0, 0.34]
  const negative: Point = [half, 0, 0.34]
  const probe: Point = [probeX, probeY, 0.5]
  const contours = useMemo(() => buildEquipotentialContours(separation, charge), [separation, charge])
  const arcs = useMemo(() => buildFieldArcLines(separation, 18), [separation])
  const particles = arcs.map((line, index) => line[Math.floor((((elapsed * 0.12 + index / arcs.length) % 1 + 1) % 1) * (line.length - 1))])
  const gridColor = dark ? '#354350' : '#d8e0e7'
  const probeNote = Math.abs(probeX) < 0.12
    ? '中垂线上 E₁、E₂ 等大，竖直分量抵消；V=0，合场强水平指向负电荷。'
    : Math.abs(probeY) < 0.12 && Math.abs(probeX) < half
      ? '两电荷之间 E₁、E₂ 同向，合场强相加；电势从正电荷向负电荷降低。'
      : Math.abs(probeY) < 0.12
        ? '两电荷外侧 E₁、E₂ 反向，合场强为两者之差。'
        : '斜向位置需分别分解 E₁、E₂；等势线与合场强方向正交。'

  return <group data-rig-scene="equipotential-dipole">
    <ambientLight intensity={dark ? 0.7 : 0.95} />
    <directionalLight position={[3, 5, 8]} intensity={0.65} />
    <color attach="background" args={[dark ? '#0f1722' : '#fbfcfd']} />
    {Array.from({ length: 13 }, (_, index) => <Line key={'v-' + index} points={[[index - 6, -4.2, -0.12], [index - 6, 3.8, -0.12]]} color={gridColor} lineWidth={0.55} />)}
    {Array.from({ length: 9 }, (_, index) => <Line key={'h-' + index} points={[[-6.2, index - 4.2, -0.12], [6.2, index - 4.2, -0.12]]} color={gridColor} lineWidth={0.55} />)}
    {showEquipotential && contours.map((contour, index) => <Contour key={'contour-' + index} points={contour.points} polarity={contour.polarity} dark={dark} />)}
    {showEquipotential && <Line points={[[0, -4.25, 0.05], [0, 3.85, 0.05]]} color={dark ? '#bc9ad7' : '#8c69aa'} lineWidth={1.55} dashed dashScale={2.2} dashSize={0.15} gapSize={0.1} />}
    {arcs.map((line, index) => <Line key={'field-' + index} points={line} color={flow ? '#4baea7' : '#99a7b3'} lineWidth={flow ? 1.3 : 0.9} />)}
    {flow && particles.map((particle, index) => <mesh key={'particle-' + index} position={[particle[0], particle[1], 0.26]}><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color="#f3c34b" /></mesh>)}
    <mesh position={positive}><sphereGeometry args={[0.42, 24, 16]} /><meshStandardMaterial color="#ef3340" emissive="#5e1118" emissiveIntensity={0.22} /></mesh>
    <mesh position={negative}><sphereGeometry args={[0.42, 24, 16]} /><meshStandardMaterial color="#3f7eb5" emissive="#102d4b" emissiveIntensity={0.2} /></mesh>
    <Html position={[-half, -0.66, 0.4]} center distanceFactor={8}><span style={{ color: '#ef3340', fontSize: '16px', fontWeight: 900 }}>+ Q</span></Html>
    <Html position={[half, -0.66, 0.4]} center distanceFactor={8}><span style={{ color: '#3f7eb5', fontSize: '16px', fontWeight: 900 }}>− Q</span></Html>
    <mesh position={probe}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color="#252b31" /></mesh>
    <Html position={[probeX + 0.18, probeY + 0.18, 0.55]} center distanceFactor={8}><span style={{ color: '#252b31', fontSize: '11px', fontWeight: 800 }}>探针 P</span></Html>
    {showVectors && <>
      <FieldArrow start={probe} end={vectorEnd(probe, readings.positiveField)} color="#ef3340" label="E₁" labelOffset={[0.12, 0.2]} />
      <FieldArrow start={probe} end={vectorEnd(probe, readings.negativeField)} color="#3f7eb5" label="E₂" labelOffset={[-0.16, 0.15]} />
      <FieldArrow start={probe} end={vectorEnd(probe, readings.totalField)} color="#f2b134" label="E" labelOffset={[0.12, -0.22]} />
    </>}
    <Html position={[0, 4.55, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>等量异种电荷模型</span></Html>
    <Html position={[0, 4.18, 0]} center distanceFactor={8}><span style={{ color: '#7d8790', fontSize: '11px', whiteSpace: 'nowrap' }}>黄点沿场线方向移动 · 紫色中垂线为 V=0 · 箭长压缩显示</span></Html>
    <Html position={[0, 3.72, 0]} center distanceFactor={8}><span style={{ color: '#8e98a1', fontSize: '10px', whiteSpace: 'nowrap' }}>Q={charge.toFixed(1)} μC · d={separation.toFixed(1)} cm</span></Html>
    <Html position={[0, -4.72, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '10px', whiteSpace: 'nowrap' }}>{probeNote}</span></Html>
  </group>
}
