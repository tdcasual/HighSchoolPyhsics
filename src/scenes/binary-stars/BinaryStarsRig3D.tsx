import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { orbitalPhase } from './model'
import type { BinaryStarsSceneState } from './useBinaryStarsSceneState'

type Point = [number, number, number]
type Props = Pick<BinaryStarsSceneState, 'elapsed' | 'mass1' | 'mass2' | 'separation' | 'readings'> & { theme: ThemeMode }

function Arrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return <group><Line points={[start, end]} color={color} lineWidth={2.3} /><mesh position={end} rotation={[0, 0, -Math.atan2(dx, dy)]}><coneGeometry args={[0.08, 0.22, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.16, end[1] + 0.16, end[2] + 0.04]} center distanceFactor={8}><span style={{ color, fontSize: '12px', fontWeight: 900 }}>{label}</span></Html></group>
}

function OrbitRing({ radius, color }: { radius: number; color: string }) {
  const points = Array.from({ length: 65 }, (_, index) => { const angle = index / 64 * Math.PI * 2; return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0.03] as Point })
  return <Line points={points} color={color} lineWidth={1.1} dashed dashScale={2.2} dashSize={0.14} gapSize={0.1} />
}

export function BinaryStarsRig3D({ elapsed, mass1, mass2, separation, readings, theme }: Props) {
  const dark = theme === 'night'
  const text = dark ? '#e6edf5' : '#39424e'
  const scale = 0.105
  const r1 = readings.radius1 * scale
  const r2 = readings.radius2 * scale
  const phase = orbitalPhase(elapsed, readings.omega)
  const star1: Point = [Math.cos(phase) * r1, Math.sin(phase) * r1, 0.44]
  const star2: Point = [Math.cos(phase + Math.PI) * r2, Math.sin(phase + Math.PI) * r2, 0.44]
  const center: Point = [0, 0, 0.42]
  const f1End: Point = [star1[0] * 0.35, star1[1] * 0.35, 0.48]
  const f2End: Point = [star2[0] * 0.35, star2[1] * 0.35, 0.48]
  const v1End: Point = [star1[0] - Math.sin(phase) * 0.7, star1[1] + Math.cos(phase) * 0.7, 0.48]
  const v2End: Point = [star2[0] + Math.sin(phase) * 0.62, star2[1] - Math.cos(phase) * 0.62, 0.48]
  return <group data-rig-scene="binary-stars"><ambientLight intensity={dark ? 0.54 : 0.8} /><color attach="background" args={[dark ? '#070d19' : '#f4f7fb']} />{Array.from({ length: 42 }, (_, index) => { const x = ((index * 37) % 100) / 10 - 5; const y = ((index * 61) % 100) / 10 - 5; return <mesh key={index} position={[x, y, -0.2]}><sphereGeometry args={[0.018 + (index % 3) * 0.01, 6, 6]} /><meshBasicMaterial color={dark ? '#b4c7e4' : '#a7b6c6'} transparent opacity={dark ? 0.68 : 0.26} /></mesh> })}<OrbitRing radius={r1} color="#e23f6e" /><OrbitRing radius={r2} color="#2f7ed8" /><Line points={[star1, star2]} color="#8d99a9" lineWidth={1.1} dashed dashScale={2.2} dashSize={0.1} gapSize={0.08} /><mesh position={center}><sphereGeometry args={[0.1, 16, 12]} /><meshStandardMaterial color="#f2f4f7" emissive="#ffffff" emissiveIntensity={0.25} /></mesh><Html position={[0.18, 0.06, 0.45]} center distanceFactor={8}><span style={{ color: text, fontSize: '12px', fontWeight: 900 }}>O（质心）</span></Html><mesh position={star1}><sphereGeometry args={[0.25 + mass1 * 0.018, 24, 16]} /><meshStandardMaterial color="#e33c6e" emissive="#591126" emissiveIntensity={0.35} /></mesh><mesh position={star2}><sphereGeometry args={[0.25 + mass2 * 0.018, 24, 16]} /><meshStandardMaterial color="#327ed6" emissive="#102d58" emissiveIntensity={0.32} /></mesh><Html position={[star1[0], star1[1] - 0.43, 0.48]} center distanceFactor={8}><span style={{ color: '#ef6282', fontSize: '13px', fontWeight: 900 }}>m₁</span></Html><Html position={[star2[0], star2[1] + 0.44, 0.48]} center distanceFactor={8}><span style={{ color: '#79ade9', fontSize: '13px', fontWeight: 900 }}>m₂</span></Html><Arrow start={star1} end={f1End} color="#f4bd43" label="F₁" /><Arrow start={star2} end={f2End} color="#f4bd43" label="F₂" /><Arrow start={star1} end={v1End} color="#35bea3" label="v₁" /><Arrow start={star2} end={v2End} color="#35bea3" label="v₂" /><Html position={[-4.7, 4.45, 0.4]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>双星系统动力学</span></Html><Html position={[-4.7, 4.08, 0.4]} center distanceFactor={8}><span style={{ color: '#98a6b8', fontSize: '11px', whiteSpace: 'nowrap' }}>万有引力提供向心力 · 同周期绕质心旋转</span></Html><Html position={[0, -4.62, 0.4]} center distanceFactor={8}><span style={{ color: text, fontSize: '11px', whiteSpace: 'nowrap' }}>虚线连杆长度 L={separation.toFixed(1)}R · 质量越大，轨道半径越小 · 空格键暂停/恢复</span></Html></group>
}
