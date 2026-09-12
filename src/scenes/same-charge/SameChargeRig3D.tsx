import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildSameChargeContours, buildSameChargeFieldLines, type SameChargeReadings } from './model'
import type { SameChargePolarity } from './model'

type Point = [number, number, number]
type Props = { elapsed: number; separation: number; charge: number; probeX: number; probeY: number; polarity: SameChargePolarity; flow: boolean; showEquipotential: boolean; showVectors: boolean; readings: SameChargeReadings; theme: ThemeMode }

function vectorEnd(origin: Point, vector: { x: number; y: number }, scale: number): Point {
  const length = Math.hypot(vector.x, vector.y)
  if (length < 0.001) return [origin[0] + 0.18, origin[1], origin[2]]
  const factor = Math.min(1.7, Math.max(0.35, length * scale)) / length
  return [origin[0] + vector.x * factor, origin[1] + vector.y * factor, origin[2]]
}

function FieldArrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return <group><Line points={[start, end]} color={color} lineWidth={2.5} /><mesh position={end} rotation={[0, 0, -Math.atan2(dx, dy)]}><coneGeometry args={[0.09, 0.25, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.18, end[1] + 0.16, end[2] + 0.04]} center distanceFactor={8}><span style={{ color, fontSize: '13px', fontWeight: 900 }}>{label}</span></Html></group>
}

function Contour({ center, radiusX, radiusY, kind, color }: { center: [number, number]; radiusX: number; radiusY: number; kind: 'local' | 'outer'; color: string }) {
  const points = Array.from({ length: 65 }, (_, index) => { const angle = index / 64 * Math.PI * 2; return [center[0] + Math.cos(angle) * radiusX, center[1] + Math.sin(angle) * radiusY, 0.04] as Point })
  return <Line points={points} color={color} lineWidth={kind === 'outer' ? 1.25 : 1.05} dashed dashScale={2.2} dashSize={0.13} gapSize={0.09} transparent opacity={kind === 'outer' ? 0.78 : 0.7} />
}

export function SameChargeRig3D({ elapsed, separation, charge, probeX, probeY, polarity, flow, showEquipotential, showVectors, readings, theme }: Props) {
  const dark = theme === 'night'
  const text = dark ? '#eef2f7' : '#3d4650'
  const half = separation / 2
  const chargeColor = polarity === 'positive' ? '#ef3340' : '#3f7eb5'
  const chargeGlow = polarity === 'positive' ? '#5e1118' : '#102d4b'
  const chargeSign = polarity === 'positive' ? '+' : '−'
  const first: Point = [-half, 0, 0.38]
  const second: Point = [half, 0, 0.38]
  const probe: Point = [probeX, probeY, 0.52]
  const contours = buildSameChargeContours(separation, 6)
  const fieldLines = buildSameChargeFieldLines(separation, 10)
  const particles = flow ? fieldLines.map((line, index) => {
    const phase = (elapsed * (2.2 + (index % 5) * 0.12)) % 1
    const positionIndex = polarity === 'positive' ? Math.floor(phase * line.length) : line.length - 1 - Math.floor(phase * line.length)
    return line[Math.max(0, Math.min(line.length - 1, positionIndex))]
  }) : []
  const fieldColor = polarity === 'positive' ? '#39a99f' : '#8ba9c5'
  return <group data-rig-scene="same-charge"><ambientLight intensity={dark ? 0.68 : 0.94} /><directionalLight position={[3, 5, 8]} intensity={0.62} /><color attach="background" args={[dark ? '#0f1722' : '#fbfcfd']} />{Array.from({ length: 13 }, (_, index) => <Line key={`v-${index}`} points={[[index - 6, -5.15, -0.12], [index - 6, 5.15, -0.12]]} color={dark ? '#344451' : '#d8e0e7'} lineWidth={0.55} />)}{Array.from({ length: 11 }, (_, index) => <Line key={`h-${index}`} points={[[-6.15, index - 5, -0.12], [6.15, index - 5, -0.12]]} color={dark ? '#344451' : '#d8e0e7'} lineWidth={0.55} />)}<Line points={[[-6.2, 0, 0], [6.25, 0, 0]]} color={dark ? '#8191a1' : '#a5b1bc'} lineWidth={1.4} /><Line points={[[0, -5.15, 0], [0, 5.25, 0]]} color={dark ? '#8191a1' : '#a5b1bc'} lineWidth={1.4} /><mesh position={[6.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.1, 0.26, 8]} /><meshBasicMaterial color={dark ? '#8191a1' : '#a5b1bc'} /></mesh><mesh position={[0, 5.2, 0]}><coneGeometry args={[0.1, 0.26, 8]} /><meshBasicMaterial color={dark ? '#8191a1' : '#a5b1bc'} /></mesh>{showEquipotential && contours.map((contour, index) => <Contour key={`contour-${index}`} {...contour} color={contour.kind === 'outer' ? '#42b5ad' : '#65c2b9'} />)}{fieldLines.map((line, index) => <Line key={`field-${index}`} points={line} color={fieldColor} lineWidth={flow ? 1.15 : 0.78} dashed dashScale={2.3} dashSize={0.13} gapSize={0.1} transparent opacity={flow ? 0.85 : 0.58} />)}{particles.map((particle, index) => <mesh key={`particle-${index}`} position={[particle[0], particle[1], 0.24]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#f3c34b" /></mesh>)}<mesh position={first}><sphereGeometry args={[0.43, 24, 16]} /><meshStandardMaterial color={chargeColor} emissive={chargeGlow} emissiveIntensity={0.25} /></mesh><mesh position={second}><sphereGeometry args={[0.43, 24, 16]} /><meshStandardMaterial color={chargeColor} emissive={chargeGlow} emissiveIntensity={0.25} /></mesh><Html position={[-half, -0.67, 0.44]} center distanceFactor={8}><span style={{ color: chargeColor, fontSize: '15px', fontWeight: 900 }}>{chargeSign}Q₁</span></Html><Html position={[half, -0.67, 0.44]} center distanceFactor={8}><span style={{ color: chargeColor, fontSize: '15px', fontWeight: 900 }}>{chargeSign}Q₂</span></Html><Html position={[0.16, 0.2, 0.42]} center distanceFactor={8}><span style={{ color: text, fontSize: '12px', fontWeight: 900 }}>中垂线 y</span></Html><mesh position={probe}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color="#252b31" /></mesh><Html position={[probeX + 0.18, probeY + 0.2, 0.56]} center distanceFactor={8}><span style={{ color: '#252b31', fontSize: '11px', fontWeight: 800 }}>探针 P</span></Html>{showVectors && <><FieldArrow start={probe} end={vectorEnd(probe, readings.field1, 0.025)} color="#ef5963" label="E₁" /><FieldArrow start={probe} end={vectorEnd(probe, readings.field2, 0.025)} color="#4d8fca" label="E₂" /><FieldArrow start={probe} end={vectorEnd(probe, readings.totalField, 0.018)} color="#f2b134" label="E" /></>}<Html position={[-4.65, 4.55, 0.38]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>等量同种电荷场</span></Html><Html position={[-4.65, 4.18, 0.38]} center distanceFactor={8}><span style={{ color: '#7d8790', fontSize: '11px', whiteSpace: 'nowrap' }}>同号电荷的电场线向外（或向内）发散 · 中垂线场强具有对称性</span></Html><Html position={[0, -5.45, 0.38]} center distanceFactor={8}><span style={{ color: text, fontSize: '11px', whiteSpace: 'nowrap' }}>2d={separation.toFixed(1)} cm · Q={charge.toFixed(1)} μC · 空格键暂停/恢复场线流动</span></Html><Html position={[0, 5.02, 0.38]} center distanceFactor={8}><span style={{ color: '#8e98a1', fontSize: '10px', whiteSpace: 'nowrap' }}>E=E₁+E₂ · φ=φ₁+φ₂</span></Html></group>
}
