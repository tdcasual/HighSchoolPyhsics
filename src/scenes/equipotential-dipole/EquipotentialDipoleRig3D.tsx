import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildContourRings, buildFieldArcLines } from './model'
import type { EquipotentialDipoleSceneState } from './useEquipotentialDipoleSceneState'

type Point = [number, number, number]
type Props = Pick<EquipotentialDipoleSceneState, 'elapsed' | 'flow' | 'showEquipotential' | 'showVectors' | 'separation' | 'charge' | 'probeX' | 'probeY' | 'readings'> & { theme: ThemeMode }

function vectorEnd(origin: Point, vector: { x: number; y: number }, scale: number): Point {
  const length = Math.hypot(vector.x, vector.y)
  if (length < 0.001) return [origin[0] + 0.25, origin[1], origin[2]]
  const factor = Math.min(1.55, Math.max(0.35, length * scale)) / length
  return [origin[0] + vector.x * factor, origin[1] + vector.y * factor, origin[2]]
}

function FieldArrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return <group><Line points={[start, end]} color={color} lineWidth={2.5} /><mesh position={end} rotation={[0, 0, -Math.atan2(dx, dy)]}><coneGeometry args={[0.09, 0.25, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.18, end[1] + 0.18, end[2] + 0.04]} center distanceFactor={8}><span style={{ color, fontSize: '13px', fontWeight: 900 }}>{label}</span></Html></group>
}

function Ring({ center, radius, color, opacity }: { center: [number, number]; radius: number; color: string; opacity: number }) {
  const points = Array.from({ length: 49 }, (_, index) => { const angle = index / 48 * Math.PI * 2; return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, 0.05] as Point })
  return <Line points={points} color={color} lineWidth={1.1} dashed dashScale={2.3} dashSize={0.12} gapSize={0.08} transparent opacity={opacity} />
}

export function EquipotentialDipoleRig3D({ elapsed, flow, showEquipotential, showVectors, separation, charge, probeX, probeY, readings, theme }: Props) {
  const dark = theme === 'night'
  const text = dark ? '#eef2f7' : '#3d4650'
  const half = separation / 2
  const positive: Point = [-half, 0, 0.34]
  const negative: Point = [half, 0, 0.34]
  const probe: Point = [probeX, probeY, 0.5]
  const contours = buildContourRings(separation, 6)
  const arcs = buildFieldArcLines(separation, 11)
  const particles = arcs.map((line, index) => line[Math.floor((elapsed * (3 + index * 0.08)) % line.length)])
  return <group data-rig-scene="equipotential-dipole"><ambientLight intensity={dark ? 0.7 : 0.95} /><directionalLight position={[3, 5, 8]} intensity={0.65} /><color attach="background" args={[dark ? '#0f1722' : '#fbfcfd']} />{Array.from({ length: 13 }, (_, index) => <Line key={`v-${index}`} points={[[index - 6, -5.2, -0.12], [index - 6, 5.2, -0.12]]} color={dark ? '#354350' : '#d8e0e7'} lineWidth={0.55} />)}{Array.from({ length: 11 }, (_, index) => <Line key={`h-${index}`} points={[[-6.2, index - 5, -0.12], [6.2, index - 5, -0.12]]} color={dark ? '#354350' : '#d8e0e7'} lineWidth={0.55} />)}<Line points={[[0, -5.2, 0], [0, 5.2, 0]]} color="#3bb2a6" lineWidth={2.1} dashed dashScale={2.2} dashSize={0.15} gapSize={0.1} />{showEquipotential && contours.map((ring, index) => <Ring key={`ring-${index}`} center={ring.center} radius={ring.radius} color={ring.polarity === 'positive' ? '#54b8ae' : '#95a6b8'} opacity={0.78} />)}{arcs.map((line, index) => <Line key={`arc-${index}`} points={line} color={flow ? '#4baea7' : '#99a7b3'} lineWidth={flow ? 1.3 : 0.9} dashed dashScale={2.3} dashSize={0.14} gapSize={0.1} />)}{flow && particles.map((particle, index) => <mesh key={`particle-${index}`} position={[particle[0], particle[1], 0.26]}><sphereGeometry args={[0.075, 8, 8]} /><meshBasicMaterial color="#f3c34b" /></mesh>)}<mesh position={positive}><sphereGeometry args={[0.42, 24, 16]} /><meshStandardMaterial color="#ef3340" emissive="#5e1118" emissiveIntensity={0.22} /></mesh><mesh position={negative}><sphereGeometry args={[0.42, 24, 16]} /><meshStandardMaterial color="#3f7eb5" emissive="#102d4b" emissiveIntensity={0.2} /></mesh><Html position={[-half, -0.66, 0.4]} center distanceFactor={8}><span style={{ color: '#ef3340', fontSize: '16px', fontWeight: 900 }}>+ Q</span></Html><Html position={[half, -0.66, 0.4]} center distanceFactor={8}><span style={{ color: '#3f7eb5', fontSize: '16px', fontWeight: 900 }}>− Q</span></Html><mesh position={probe}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color="#252b31" /></mesh><Html position={[probeX + 0.18, probeY + 0.18, 0.55]} center distanceFactor={8}><span style={{ color: '#252b31', fontSize: '11px', fontWeight: 800 }}>探针 P</span></Html>{showVectors && <><FieldArrow start={probe} end={vectorEnd(probe, readings.positiveField, 0.025)} color="#ef3340" label="E₁" /><FieldArrow start={probe} end={vectorEnd(probe, readings.negativeField, 0.025)} color="#3f7eb5" label="E₂" /><FieldArrow start={probe} end={vectorEnd(probe, readings.totalField, 0.018)} color="#f2b134" label="E" /></>}<Html position={[0, 4.6, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>等量异种电荷模型</span></Html><Html position={[0, 4.22, 0]} center distanceFactor={8}><span style={{ color: '#7d8790', fontSize: '12px', whiteSpace: 'nowrap' }}>电场线从正电荷出发，终止于负电荷 · 中垂线为 V=0 等势线</span></Html><Html position={[0, -5.48, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '11px', whiteSpace: 'nowrap' }}>空格键可暂停/恢复电场线流动</span></Html><Html position={[0, 5.05, 0]} center distanceFactor={8}><span style={{ color: '#8e98a1', fontSize: '10px', whiteSpace: 'nowrap' }}>Q={charge.toFixed(1)} μC · d={separation.toFixed(1)} cm</span></Html></group>
}
