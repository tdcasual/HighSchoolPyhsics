import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { phaseAt } from './model'
import type { CentripetalFactorsSceneState } from './useCentripetalFactorsSceneState'

type Point = [number, number, number]
type Props = Pick<CentripetalFactorsSceneState, 'elapsed' | 'readings'> & { theme: ThemeMode }

function Arrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return <group><Line points={[start, end]} color={color} lineWidth={2.2} /><mesh position={end} rotation={[0, 0, -Math.atan2(dx, dy)]}><coneGeometry args={[0.08, 0.22, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.18, end[1] + 0.16, end[2] + 0.04]} center distanceFactor={8}><span style={{ color, fontSize: '12px', fontWeight: 900 }}>{label}</span></Html></group>
}

function SpringGauge({ position, marks, color, label, value }: { position: Point; marks: number; color: string; label: string; value: string }) {
  const count = Math.max(1, Math.min(8, Math.round(marks)))
  return <group position={position}><mesh><boxGeometry args={[0.42, 2.7, 0.34]} /><meshStandardMaterial color="#e9eef2" roughness={0.45} /></mesh><mesh position={[0, 0.2, 0.2]}><boxGeometry args={[0.22, 2.28, 0.04]} /><meshStandardMaterial color="#1d2227" /></mesh>{Array.from({ length: 9 }, (_, index) => <Line key={index} points={[[-0.22, -1.1 + index * 0.28, 0.24], [0.22, -1.1 + index * 0.28, 0.24]]} color="#8c98a3" lineWidth={0.7} />)}{Array.from({ length: count }, (_, index) => <mesh key={`mark-${index}`} position={[0, -0.96 + index * 0.2, 0.28]}><boxGeometry args={[0.3, 0.12, 0.04]} /><meshStandardMaterial color={color} /></mesh>)}<mesh position={[0, -1.5, 0]}><cylinderGeometry args={[0.42, 0.42, 0.14, 16]} /><meshStandardMaterial color="#343a40" /></mesh><Html position={[0, 1.72, 0]} center distanceFactor={8}><span style={{ color, fontSize: '14px', fontWeight: 900, whiteSpace: 'nowrap' }}>{label}</span></Html><Html position={[0, -1.82, 0]} center distanceFactor={8}><span style={{ color, fontSize: '11px', whiteSpace: 'nowrap' }}>{value}</span></Html></group>
}

function Pulley({ center, radius, angle, color, force, velocity, label }: { center: [number, number]; radius: number; angle: number; color: string; force: number; velocity: number; label: string }) {
  const ball: Point = [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, 0.45]
  const tangent: Point = [ball[0] - Math.sin(angle) * 0.75, ball[1] + Math.cos(angle) * 0.75, 0.45]
  const radial: Point = [ball[0] + (center[0] - ball[0]) * 0.45, ball[1] + (center[1] - ball[1]) * 0.45, 0.45]
  return <group><mesh position={[center[0], center[1], 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.0, 1.0, 0.26, 48]} /><meshStandardMaterial color="#b9c2ca" metalness={0.2} roughness={0.52} /></mesh><mesh position={[center[0], center[1], 0.17]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.62, 0.62, 0.12, 48]} /><meshStandardMaterial color="#d6dce1" /></mesh><mesh position={[center[0], center[1], 0.25]}><cylinderGeometry args={[0.16, 0.16, 0.3, 20]} /><meshStandardMaterial color="#252b31" /></mesh><Line points={[[center[0], center[1], 0.32], [ball[0], ball[1], 0.32]]} color={color} lineWidth={1.4} /><mesh position={ball}><sphereGeometry args={[0.22, 20, 12]} /><meshStandardMaterial color={color} metalness={0.15} roughness={0.35} /></mesh><Arrow start={ball} end={tangent} color="#20a39e" label="v" /><Arrow start={ball} end={radial} color={color === '#e63946' ? '#e63946' : '#2774ae'} label="F" /><Html position={[center[0], center[1] - 1.46, 0]} center distanceFactor={8}><span style={{ color: '#59636d', fontSize: '11px', whiteSpace: 'nowrap' }}>{label} · F={force.toFixed(1)} N · v={velocity.toFixed(1)}</span></Html></group>
}

export function CentripetalFactorsRig3D({ elapsed, readings, theme }: Props) {
  const dark = theme === 'night'
  const text = dark ? '#edf2f7' : '#39424e'
  const leftCenter: [number, number] = [-2.7, -2.0]
  const rightCenter: [number, number] = [2.7, -2.0]
  const leftAngle = phaseAt(elapsed, readings.leftOmega) - Math.PI * 0.3
  const rightAngle = phaseAt(elapsed, readings.rightOmega) - Math.PI * 0.3
  return <group data-rig-scene="centripetal-factors"><ambientLight intensity={dark ? 0.72 : 0.96} /><directionalLight position={[4, 7, 8]} intensity={0.65} /><color attach="background" args={[dark ? '#101823' : '#fbfaf8']} /><Html position={[0, 4.05, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>向心力演示仪 · F = mω²r</span></Html><Html position={[0, 3.68, 0]} center distanceFactor={8}><span style={{ color: '#7d8790', fontSize: '12px', whiteSpace: 'nowrap' }}>侧剖视：弹簧测力标尺与杠杆原理</span></Html><Line points={[[-4.8, -0.2, 0], [4.8, -0.2, 0]]} color={dark ? '#8996a4' : '#626d77'} lineWidth={2.8} /><SpringGauge position={[-2.7, 1.45, 0]} marks={readings.leftSpringMarks} color="#e63946" label="左侧测力标尺" value={`F左 = ${readings.leftForce.toFixed(1)} N`} /><SpringGauge position={[2.7, 1.45, 0]} marks={readings.rightSpringMarks} color="#2774ae" label="右侧测力标尺" value={`F右 = ${readings.rightForce.toFixed(1)} N`} /><mesh position={[-2.05, -0.03, 0.16]}><sphereGeometry args={[0.28, 20, 12]} /><meshStandardMaterial color="#e63946" /></mesh><mesh position={[2.05, -0.03, 0.16]}><sphereGeometry args={[0.28, 20, 12]} /><meshStandardMaterial color="#2774ae" /></mesh><Html position={[-2.7, -0.47, 0]} center distanceFactor={8}><span style={{ color: '#e63946', fontSize: '11px', fontWeight: 800 }}>A / B · r左={readings.leftRadius.toFixed(0)}r₀</span></Html><Html position={[2.7, -0.47, 0]} center distanceFactor={8}><span style={{ color: '#2774ae', fontSize: '11px', fontWeight: 800 }}>C · r右=r₀</span></Html><Html position={[0, -0.78, 0]} center distanceFactor={8}><span style={{ color: '#7d8790', fontSize: '12px', whiteSpace: 'nowrap' }}>俯视动态：塔轮传动与圆周受力分析</span></Html><Line points={[[leftCenter[0], leftCenter[1] + 1.0, 0.18], [rightCenter[0], rightCenter[1] + 1.0, 0.18]]} color="#343a40" lineWidth={3.2} dashed dashScale={2.1} dashSize={0.12} gapSize={0.08} /><Line points={[[leftCenter[0], leftCenter[1] - 1.0, 0.18], [rightCenter[0], rightCenter[1] - 1.0, 0.18]]} color="#343a40" lineWidth={3.2} dashed dashScale={2.1} dashSize={0.12} gapSize={0.08} /><Pulley center={leftCenter} radius={readings.leftRadius === 2 ? 0.82 : 0.58} angle={leftAngle} color="#e63946" force={readings.leftForce} velocity={readings.leftVelocity} label="左球 m左" /><Pulley center={rightCenter} radius={0.58} angle={rightAngle} color="#2774ae" force={readings.rightForce} velocity={readings.rightVelocity} label="右球 m右" /><Html position={[0, -4.15, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '11px', whiteSpace: 'nowrap' }}>红/蓝箭头：F 指向圆心 · 绿色箭头：v 沿切线 · 空格键暂停/恢复</span></Html></group>
}
