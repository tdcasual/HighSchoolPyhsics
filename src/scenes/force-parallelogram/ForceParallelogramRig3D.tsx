import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import type { ForceParallelogramSceneState } from './useForceParallelogramSceneState'

type Point = [number, number, number]
type Props = Pick<ForceParallelogramSceneState, 'elapsed' | 'step' | 'f1' | 'f2' | 'readings'> & { theme: ThemeMode }

function Arrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return <group><Line points={[start, end]} color={color} lineWidth={2.7} /><mesh position={end} rotation={[0, 0, -Math.atan2(dx, dy)]}><coneGeometry args={[0.11, 0.28, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.2, end[1] + 0.18, end[2] + 0.04]} center distanceFactor={8}><span style={{ color, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>{label}</span></Html></group>
}

function Protractor() {
  const points = Array.from({ length: 33 }, (_, index) => { const angle = Math.PI * (index / 32); return [2.0 + Math.cos(angle) * 1.45, -3.05 + Math.sin(angle) * 1.45, 0.08] as Point })
  return <group><Line points={points} color="#e07a20" lineWidth={1.5} /><Line points={[[0.55, -3.05, 0.08], [3.45, -3.05, 0.08]]} color="#e07a20" lineWidth={1.5} />{Array.from({ length: 9 }, (_, index) => { const angle = index / 8 * Math.PI; return <Line key={index} points={[[2.0 + Math.cos(angle) * 1.27, -3.05 + Math.sin(angle) * 1.27, 0.09], [2.0 + Math.cos(angle) * 1.45, -3.05 + Math.sin(angle) * 1.45, 0.09]]} color="#e07a20" lineWidth={0.8} /> })}<Html position={[2, -3.35, 0.1]} center distanceFactor={8}><span style={{ color: '#d16c1e', fontSize: '10px', whiteSpace: 'nowrap' }}>量角器 · θ</span></Html></group>
}

function Ruler() {
  return <group><Line points={[[-4.25, -3.2, 0.08], [-1.1, -3.2, 0.08]]} color="#53677e" lineWidth={2.4} />{Array.from({ length: 16 }, (_, index) => <Line key={index} points={[[-4.25 + index * 0.21, -3.2, 0.09], [-4.25 + index * 0.21, -3.02 - (index % 5 === 0 ? 0.1 : 0), 0.09]]} color="#53677e" lineWidth={0.8} />)}<Html position={[-2.65, -3.52, 0.1]} center distanceFactor={8}><span style={{ color: '#53677e', fontSize: '10px', whiteSpace: 'nowrap' }}>学生刻度尺（厘米）</span></Html></group>
}

export function ForceParallelogramRig3D({ elapsed, step, f1, f2, readings, theme }: Props) {
  const dark = theme === 'night'
  const text = dark ? '#edf2f7' : '#39424e'
  const origin: Point = [0, 0.35, 0.45]
  const scale = 1.15
  const f1End: Point = [origin[0] + readings.f1Vector.x * scale, origin[1] + readings.f1Vector.y * scale, 0.45]
  const f2End: Point = [origin[0] + readings.f2Vector.x * scale, origin[1] + readings.f2Vector.y * scale, 0.45]
  const sumEnd: Point = [origin[0] + readings.sumVector.x * scale, origin[1] + readings.sumVector.y * scale, 0.45]
  const measuredEnd: Point = [sumEnd[0] + 0.04, sumEnd[1] - 0.04, 0.46]
  const pulse = 0.17 + Math.sin(elapsed * 4) ** 2 * 0.1
  const showSynthesis = step !== 'draw'
  const showCompare = step === 'compare'
  return <group data-rig-scene="force-parallelogram"><ambientLight intensity={dark ? 0.72 : 0.96} /><directionalLight position={[3, 6, 8]} intensity={0.6} /><color attach="background" args={[dark ? '#111925' : '#f7f3e9']} /><mesh position={[0, 0, -0.25]}><boxGeometry args={[10.5, 8.3, 0.12]} /><meshStandardMaterial color={dark ? '#1d2735' : '#fffdf8'} roughness={0.9} /></mesh><Line points={[[0, -4.1, 0.05], [0, 4.0, 0.05]]} color={dark ? '#607388' : '#d7e4f0'} lineWidth={1.1} dashed dashScale={2} dashSize={0.12} gapSize={0.1} /><mesh position={[0, 3.85, 0.18]}><torusGeometry args={[0.26, 0.07, 12, 24]} /><meshStandardMaterial color="#e6a21e" metalness={0.7} /></mesh><Line points={[[0, 3.6, 0.18], [0, 0.35, 0.18]]} color="#e07a20" lineWidth={2.4} /><Line points={[[origin[0] - 0.25, origin[1], 0.5], [origin[0] + 0.25, origin[1], 0.5]]} color="#d47b24" lineWidth={3.4} /><mesh position={origin}><torusGeometry args={[0.2, 0.055, 12, 24]} /><meshStandardMaterial color="#e7b033" /></mesh><mesh position={origin}><sphereGeometry args={[pulse, 16, 12]} /><meshStandardMaterial color="#f4bc32" transparent opacity={0.22} /></mesh>{step !== 'draw' && <Line points={[f1End, [sumEnd[0], sumEnd[1], sumEnd[2]], f2End]} color="#91a1b4" lineWidth={1.2} dashed dashScale={2.2} dashSize={0.12} gapSize={0.09} />}{<Arrow start={origin} end={f1End} color="#e84a3c" label={`F₁=${f1.toFixed(2)} N`} />}{<Arrow start={origin} end={f2End} color="#3488d6" label={`F₂=${f2.toFixed(2)} N`} />}{showSynthesis && <Arrow start={origin} end={sumEnd} color="#21ad66" label={`F=${readings.theoreticalMagnitude.toFixed(2)} N（理论）`} />}{showCompare && <Arrow start={origin} end={measuredEnd} color="#ed8a21" label={`F′=${readings.measuredMagnitude.toFixed(2)} N（实测）`} />}{showCompare && <Line points={[[sumEnd[0], sumEnd[1], 0.44], [measuredEnd[0], measuredEnd[1], 0.44]]} color="#ed8a21" lineWidth={1.1} dashed dashScale={2} dashSize={0.08} gapSize={0.08} />}{showCompare && <Html position={[0, -1.25, 0.4]} center distanceFactor={8}><span style={{ color: '#16835a', fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>结点 O：两次拉伸终点重合，验证等效替代</span></Html>}<Html position={[0, 4.35, 0.4]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>验证力的平行四边形定则</span></Html><Html position={[0, 3.98, 0.4]} center distanceFactor={8}><span style={{ color: '#718096', fontSize: '11px', whiteSpace: 'nowrap' }}>橡皮条结点 O 的等效替代实验</span></Html><Ruler /><Protractor /></group>
}
