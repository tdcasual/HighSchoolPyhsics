import type { ReactElement } from 'react'
import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import type { CyclotronCoreSceneState } from './useCyclotronCoreSceneState'

type Point = [number, number, number]
type Props = Pick<CyclotronCoreSceneState, 'B' | 'U' | 'readings'> & { theme: ThemeMode }

function HalfOutline({ upper, color }: { upper: boolean; color: string }) {
  const points: Point[] = Array.from({ length: 65 }, (_, index) => {
    const angle = upper ? index / 64 * Math.PI : Math.PI + index / 64 * Math.PI
    return [4.55 * Math.cos(angle), 4.55 * Math.sin(angle), 0]
  })
  return <Line points={points} color={color} lineWidth={2.2} />
}

function FieldMarks({ dark }: { dark: boolean }) {
  const color = dark ? '#8d9aa5' : '#adb5bd'
  const marks: ReactElement[] = []
  for (let x = -3.8; x <= 3.8; x += 0.9) for (let y = -3.6; y <= 3.6; y += 0.9) {
    if (Math.abs(y) < 0.28 || x * x + y * y > 19.8) continue
    marks.push(<group key={`${x}-${y}`}><Line points={[[x - 0.1, y - 0.1, -0.05], [x + 0.1, y + 0.1, -0.05]]} color={color} lineWidth={0.75} /><Line points={[[x - 0.1, y + 0.1, -0.05], [x + 0.1, y - 0.1, -0.05]]} color={color} lineWidth={0.75} /></group>)
  }
  return <group>{marks}</group>
}

function GapArrow({ x, direction, color }: { x: number; direction: number; color: string }) {
  const start: Point = [x - direction * 0.35, 0, 0.12]
  const end: Point = [x + direction * 0.35, 0, 0.12]
  return <group><Line points={[start, end]} color={color} lineWidth={2} /><mesh position={end}><sphereGeometry args={[0.08, 10, 10]} /><meshBasicMaterial color={color} /></mesh></group>
}

function Source({ dark }: { dark: boolean }) {
  const color = dark ? '#e4edf4' : '#3e4b55'
  return <group position={[-5.35, 0, 0]}><mesh><torusGeometry args={[0.32, 0.045, 8, 24]} /><meshBasicMaterial color={color} /></mesh><Line points={[[-0.18, 0, 0], [0.18, 0, 0]]} color={color} lineWidth={1.4} /><Line points={[[0, -0.18, 0], [0, 0.18, 0]]} color={color} lineWidth={1.4} /><Html position={[0, 0.6, 0]} center distanceFactor={8}><span style={{ color: '#4cc9f0', fontWeight: 800, fontSize: '12px' }}>U~</span></Html><Line points={[[0.32, 0, 0], [0.8, 0, 0]]} color={color} lineWidth={1.5} /></group>
}

export function CyclotronCoreRig3D({ B, U, readings, theme }: Props) {
  const dark = theme === 'night'
  const deeColor = dark ? '#34434d' : '#e9ecef'
  const outline = dark ? '#94a3ad' : '#6c757d'
  const path = readings.trail.map(([x, y]) => [x, y, 0.2] as Point)
  const [px, py] = readings.particlePosition
  const particleColor = readings.particle.charge === 2 ? '#f08c46' : '#e63946'
  const gapDirection = readings.polarityTop === '-' ? -1 : 1
  const textColor = dark ? '#e4edf4' : '#343a40'
  const channelDirection = readings.accelerationCount % 2 === 0 ? 1 : -1
  return <group data-rig-scene="cyclotron-core"><ambientLight intensity={dark ? 0.72 : 0.95} /><directionalLight position={[3, 5, 8]} intensity={0.65} /><color attach="background" args={[dark ? '#101823' : '#f8f9fa']} /><FieldMarks dark={dark} /><mesh position={[0, 0.16, -0.12]}><circleGeometry args={[4.55, 64, 0, Math.PI]} /><meshBasicMaterial color={deeColor} transparent opacity={0.62} /></mesh><mesh position={[0, -0.16, -0.12]}><circleGeometry args={[4.55, 64, Math.PI, Math.PI]} /><meshBasicMaterial color={deeColor} transparent opacity={0.62} /></mesh><HalfOutline upper color={outline} /><HalfOutline upper={false} color={outline} /><Line points={[[-4.55, 0.11, 0], [4.55, 0.11, 0]]} color={outline} lineWidth={2} /><Line points={[[-4.55, -0.11, 0], [4.55, -0.11, 0]]} color={outline} lineWidth={2} /><Html position={[0, 2.55, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 900, fontSize: '24px' }}>{readings.polarityTop}</span></Html><Html position={[0, -2.85, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 900, fontSize: '24px' }}>{readings.polarityBottom}</span></Html><Html position={[0, 4.95, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap' }}>D 型盒 · B={B} T</span></Html><Source dark={dark} />{[-3.2, -2.1, -1, 0.1, 1.2, 2.3, 3.4].map((x) => <GapArrow key={x} x={x} direction={gapDirection} color="#4cc9f0" />)}<Line points={path} color={particleColor} lineWidth={2.8} /><mesh position={[px, py, 0.32]}><sphereGeometry args={[0.16, 18, 18]} /><meshStandardMaterial color={particleColor} emissive={particleColor} emissiveIntensity={0.65} /></mesh>{readings.extracted && <><Line points={[[px, py, 0.22], [px + channelDirection * 2.1, py + channelDirection * 1.2, 0.22]]} color="#e63946" lineWidth={2.2} /><Html position={[px + channelDirection * 1.9, py + channelDirection * 1.5, 0]} center distanceFactor={8}><span style={{ color: '#e63946', fontWeight: 900, fontSize: '12px' }}>射出束流</span></Html></>}<Html position={[-4.8, -4.95, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>狭缝交变电场 · U={U} kV · 粒子在 D 型盒内匀速圆周运动</span></Html></group>
}
