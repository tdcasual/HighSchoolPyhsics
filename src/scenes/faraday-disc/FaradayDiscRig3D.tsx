import type { ReactElement } from 'react'
import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildDiscRimPoints } from './model'
import type { FaradayDiscSceneState } from './useFaradayDiscSceneState'

type Point = [number, number, number]
type Props = Pick<FaradayDiscSceneState, 'B' | 'omega' | 'radius' | 'rotation' | 'magnetic' | 'circuit' | 'elapsed'> & { theme: ThemeMode }
const DISC_RADIUS = 2.55

function Arrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const rotation = -Math.atan2(dx, dy)
  return <group><Line points={[start, end]} color={color} lineWidth={2} /><mesh position={end} rotation={[0, 0, rotation]}><coneGeometry args={[0.09, 0.24, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.16, end[1] + 0.12, end[2]]} center distanceFactor={8}><span style={{ color, fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }}>{label}</span></Html></group>
}

function MagneticMarks({ color }: { color: string }) {
  const marks: ReactElement[] = []
  for (let x = -4.8; x <= 1.5; x += 1.35) for (let y = -1.8; y <= 2.5; y += 1.25) marks.push(<Html key={x + '-' + y} position={[x, y, -0.35]} center distanceFactor={8}><span style={{ color, fontSize: '14px', fontWeight: 800 }}>⊗</span></Html>)
  return <group>{marks}</group>
}

function Circuit({ closed, color, textColor }: { closed: boolean; color: string; textColor: string }) {
  return <group><Line points={[[1.0, 2.05, 0], [4.1, 2.05, 0], [4.1, 0.75, 0]]} color={color} lineWidth={2} /><Line points={[[4.1, -0.35, 0], [4.1, -2.85, 0], [1.0, -2.85, 0]]} color={color} lineWidth={2} /><Line points={[[4.1, 0.75, 0], [4.1, 0.35, 0]]} color={color} lineWidth={2} /><Line points={[[4.1, -0.35, 0], [4.1, -0.75, 0]]} color={color} lineWidth={2} /><mesh position={[4.1, 0, 0.1]}><torusGeometry args={[0.62, 0.12, 12, 32]} /><meshBasicMaterial color="#4b5d73" /></mesh><Html position={[4.1, 0, 0.25]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '11px', fontWeight: 900 }}>G</span></Html><Html position={[4.1, 0.95, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>回路开关 S</span></Html><Line points={closed ? [[3.7, 0.72, 0], [4.1, 0.5, 0]] : [[3.7, 0.72, 0], [4.35, 0.98, 0]]} color={closed ? '#2a9d8f' : '#e63946'} lineWidth={2.2} /><mesh position={[4.1, -1.4, 0.12]}><sphereGeometry args={[0.34, 20, 14]} /><meshBasicMaterial color={closed ? '#ffd166' : '#8994a3'} /></mesh><Html position={[4.1, -1.0, 0]} center distanceFactor={8}><span style={{ color: '#e76f51', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>负载小灯泡</span></Html><Html position={[4.1, -3.15, 0]} center distanceFactor={8}><span style={{ color: closed ? '#2a9d8f' : '#e63946', fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }}>{closed ? '闭合：电流持续定向移动' : '断开：有电势差但 I=0'}</span></Html></group>
}

export function FaradayDiscRig3D({ B, omega, radius, rotation, magnetic, circuit, elapsed, theme }: Props) {
  const dark = theme === 'night'
  const textColor = dark ? '#e5edf3' : '#3b2e24'
  const bg = dark ? '#101823' : '#f8f9fa'
  const fieldColor = dark ? '#8dc7ff' : '#7bb7f0'
  const discColor = dark ? '#d88b2a' : '#ef9418'
  const rotationColor = rotation === 'cw' ? '#2a9d8f' : '#e63946'
  const theta = elapsed * omega * (rotation === 'cw' ? 1 : -1) * 0.22
  const probeAngle = -Math.PI / 4 + theta
  const px = Math.cos(probeAngle) * DISC_RADIUS
  const py = Math.sin(probeAngle) * DISC_RADIUS
  const tangent: Point = [px - Math.sin(probeAngle) * 1.0 * (rotation === 'cw' ? 1 : -1), py + Math.cos(probeAngle) * 1.0 * (rotation === 'cw' ? 1 : -1), 0.5]
  const force: Point = [px + Math.cos(probeAngle) * 0.9 * (magnetic === 'into' ? 1 : -1), py + Math.sin(probeAngle) * 0.9 * (magnetic === 'into' ? 1 : -1), 0.5]
  const rim = buildDiscRimPoints(80).map(([x, y]) => [x * DISC_RADIUS, y * DISC_RADIUS, 0.12] as Point)
  return <group data-rig-scene="faraday-disc"><ambientLight intensity={dark ? 0.75 : 0.95} /><directionalLight position={[4, 6, 8]} intensity={0.65} /><color attach="background" args={[bg]} /><MagneticMarks color={fieldColor} /><group position={[-1.7, 0.2, 0]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, 0.26, 64]} /><meshStandardMaterial color={discColor} metalness={0.55} roughness={0.35} /></mesh><Line points={rim.map(([x, y, z]) => [x - 1.7, y + 0.2, z] as Point)} color="#f6bd60" lineWidth={1.4} /><group>{Array.from({ length: 12 }, (_, index) => { const angle = index / 12 * Math.PI * 2; return <Line key={index} points={[[-1.7, 0.2, 0.25], [-1.7 + Math.cos(angle) * DISC_RADIUS, 0.2 + Math.sin(angle) * DISC_RADIUS, 0.25]]} color="#ffd166" lineWidth={0.8} transparent opacity={0.75} /> })}</group><mesh position={[-1.7, 0.2, 0.42]}><cylinderGeometry args={[0.34, 0.34, 0.5, 24]} /><meshStandardMaterial color="#596575" metalness={0.7} roughness={0.25} /></mesh><mesh position={[px - 1.7, py + 0.2, 0.48]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#ef476f" emissive="#ef476f" emissiveIntensity={0.4} /></mesh><Line points={[[px - 1.7, py + 0.2, 0.48], [tangent[0] - 1.7, tangent[1] + 0.2, tangent[2]]]} color="#2a9d8f" lineWidth={2} /><Arrow start={[px - 1.7, py + 0.2, 0.5]} end={[tangent[0] - 1.7, tangent[1] + 0.2, tangent[2]]} color="#2a9d8f" label="v=ωr" /><Arrow start={[px - 1.7, py + 0.2, 0.52]} end={[force[0] - 1.7, force[1] + 0.2, force[2]]} color="#8a2be2" label="F洛" /><Html position={[-1.7, 2.95, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '16px', fontWeight: 900, whiteSpace: 'nowrap' }}>转动铜盘 · B={B.toFixed(1)} T · R={radius.toFixed(2)} m</span></Html><Html position={[-1.7, -3.1, 0]} center distanceFactor={8}><span style={{ color: rotationColor, fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }}>外部驱动 ω={omega.toFixed(0)} rad/s · {rotation === 'cw' ? '顺时针' : '逆时针'}</span></Html><Html position={[-1.7, 0.2, 0.58]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '11px', fontWeight: 900 }}>A</span></Html><Html position={[px - 1.7 + 0.25, py + 0.2 + 0.2, 0.6]} center distanceFactor={8}><span style={{ color: '#e63946', fontSize: '11px', fontWeight: 900 }}>B（边缘）</span></Html></group><Circuit closed={circuit === 'closed'} color={circuit === 'closed' ? '#2a9d8f' : '#8b98a8'} textColor={textColor} /><Html position={[-0.4, 4.35, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>法拉第圆盘发电机原理</span></Html><Html position={[-0.4, 3.98, 0]} center distanceFactor={8}><span style={{ color: '#457b9d', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>转动切割磁感线 · 感应电动势 E=½BωR²</span></Html><Html position={[0, -4.0, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>红色 P 点：正电荷受洛伦兹力 · 空格键可暂停画面</span></Html></group>
}
