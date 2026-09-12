import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildOrbitPoints } from './model'
import type { TrainTurningSceneState } from './useTrainTurningSceneState'

type Point = [number, number, number]
type Props = Pick<TrainTurningSceneState, 'speed' | 'angleDeg' | 'radius' | 'elapsed' | 'readings'> & { theme: ThemeMode }

function ForceArrow({ start, end, color, label, labelOffset = [0, 0] }: { start: Point; end: Point; color: string; label: string; labelOffset?: [number, number] }) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const rotation = -Math.atan2(dx, dy)
  return <group><Line points={[start, end]} color={color} lineWidth={2.2} /><mesh position={end} rotation={[0, 0, rotation]}><coneGeometry args={[0.1, 0.26, 8]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + labelOffset[0], end[1] + labelOffset[1], end[2] + 0.05]} center distanceFactor={8}><span style={{ color, fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>{label}</span></Html></group>
}

function RailSection({ angle, color }: { angle: number; color: string }) {
  return <group rotation={[0, 0, angle]}><Line points={[[-3.4, 0, 0], [3.4, 0, 0]]} color={color} lineWidth={3.4} /><Line points={[[-3.4, 0.42, 0], [3.4, 0.42, 0]]} color={color} lineWidth={3.4} /><Line points={[[-3.4, 0.2, -0.12], [3.4, 0.2, -0.12]]} color="#7b8794" lineWidth={0.8} /></group>
}

function TrainBody({ angle, color }: { angle: number; color: string }) {
  return <group rotation={[0, 0, angle]}><mesh position={[0, 0.72, 0.15]}><boxGeometry args={[1.25, 0.72, 0.7]} /><meshStandardMaterial color={color} roughness={0.58} /></mesh><mesh position={[0, 1.18, 0.15]}><boxGeometry args={[0.9, 0.26, 0.62]} /><meshStandardMaterial color="#dce8f4" roughness={0.35} /></mesh><mesh position={[-0.42, 0.24, 0.18]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.14, 16]} /><meshStandardMaterial color="#343a40" /></mesh><mesh position={[0.42, 0.24, 0.18]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.14, 16]} /><meshStandardMaterial color="#343a40" /></mesh></group>
}

function ForceDiagram({ readings, color }: { readings: TrainTurningSceneState['readings']; color: string }) {
  const scale = 0.00012
  const origin: Point = [-3.2, -3.1, 0.1]
  const mgEnd: Point = [origin[0], origin[1] - 1.2, origin[2]]
  const normalEnd: Point = [origin[0] + readings.normalForce * scale * 0.6, origin[1] + 1.35, origin[2]]
  const sideEnd: Point = [origin[0] - Math.sign(readings.sideForce || 1) * Math.min(1.1, Math.abs(readings.sideForce) * scale), origin[1], origin[2]]
  const resultantEnd: Point = [origin[0] - Math.min(1.35, readings.resultantForce * scale), origin[1], origin[2]]
  return <group><Line points={[[-4.6, -3.1, 0], [-1.8, -3.1, 0]]} color={color} lineWidth={0.7} /><Html position={[-3.2, -2.35, 0]} center distanceFactor={8}><span style={{ color, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>力矢量平移合成</span></Html><Html position={[-3.2, -2.58, 0]} center distanceFactor={8}><span style={{ color, fontSize: '10px', whiteSpace: 'nowrap' }}>闭合路径：mg + Fₙ + F侧 = F合</span></Html><ForceArrow start={origin} end={mgEnd} color="#e63946" label="mg" labelOffset={[0.22, 0]} /><ForceArrow start={origin} end={normalEnd} color="#457b9d" label="Fₙ" labelOffset={[0.18, 0.1]} /><ForceArrow start={origin} end={sideEnd} color="#f4a261" label="F侧" labelOffset={[-0.2, 0.18]} /><ForceArrow start={origin} end={resultantEnd} color="#2a9d8f" label="F合" labelOffset={[-0.2, 0.2]} /></group>
}

function OrbitDiagram({ elapsed, speed, radius, color }: { elapsed: number; speed: number; radius: number; color: string }) {
  const points = buildOrbitPoints(elapsed, { speed, angleDeg: 16, radius }, 65).map(([x, y]) => [x * 1.2 + 2.7, y - 3.1, 0] as Point)
  const phase = elapsed * speed / Math.max(0.0001, radius)
  const train: Point = [Math.cos(phase - Math.PI * 0.35) * 1.2 + 2.7, Math.sin(phase - Math.PI * 0.35) * 0.8 - 3.1, 0.2]
  return <group><Html position={[2.7, -2.35, 0]} center distanceFactor={8}><span style={{ color, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>宏观俯视动态轨迹</span></Html><Line points={points} color="#b9c2cc" lineWidth={8} transparent opacity={0.35} /><Line points={points} color={color} lineWidth={1.2} dashed dashScale={2.5} dashSize={0.1} gapSize={0.08} /><mesh position={train}><boxGeometry args={[0.34, 0.2, 0.18]} /><meshStandardMaterial color="#343a40" /></mesh><Html position={[2.7, -4.15, 0]} center distanceFactor={8}><span style={{ color, fontSize: '10px', whiteSpace: 'nowrap' }}>v={speed.toFixed(1)} m/s · R={radius.toFixed(0)} m</span></Html></group>
}

export function TrainTurningRig3D({ speed, angleDeg, radius, elapsed, readings, theme }: Props) {
  const dark = theme === 'night'
  const bg = dark ? '#101823' : '#f8f9fa'
  const text = dark ? '#e5edf3' : '#3b2e24'
  const rail = dark ? '#9aa8b6' : '#65748b'
  const train = readings.status === 'ideal' ? '#2a9d8f' : readings.status === 'high' ? '#e63946' : '#e9a23b'
  const theta = angleDeg * Math.PI / 180
  const force = readings.status === 'ideal' ? '#2a9d8f' : '#343a40'
  const sideSignLabel = readings.sideForce >= 0 ? '外轨侧向补偿' : '内轨侧向补偿'
  return <group data-rig-scene="train-turning"><ambientLight intensity={dark ? 0.72 : 0.95} /><directionalLight position={[4, 6, 8]} intensity={0.7} /><color attach="background" args={[bg]} /><group position={[-1.1, 1.0, 0]}><RailSection angle={theta} color={rail} /><TrainBody angle={theta} color={train} /><ForceArrow start={[0, 0.72, 0.35]} end={[0, -1.2, 0.35]} color="#e63946" label="mg" labelOffset={[0.22, 0]} /><ForceArrow start={[0, 0.72, 0.35]} end={[Math.sin(theta) * 1.7, 0.72 + Math.cos(theta) * 1.7, 0.35]} color="#457b9d" label="Fₙ" labelOffset={[0.18, 0.06]} /><ForceArrow start={[0, 0.72, 0.36]} end={[-Math.sign(readings.sideForce || 1) * 1.35, 0.72, 0.36]} color="#f4a261" label="F侧" labelOffset={[-0.18, 0.18]} /><ForceArrow start={[0, 0.72, 0.37]} end={[-1.5, 0.72, 0.37]} color="#2a9d8f" label="F合" labelOffset={[-0.18, 0.2]} /><Html position={[0, 1.95, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '16px', fontWeight: 900, whiteSpace: 'nowrap' }}>受力剖面：θ={angleDeg.toFixed(0)}°</span></Html><Html position={[0, -1.55, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '10px', whiteSpace: 'nowrap' }}>{sideSignLabel} · 车轮轮缘卡在轨道内侧</span></Html></group><ForceDiagram readings={readings} color={force} /><OrbitDiagram elapsed={elapsed} speed={speed} radius={radius} color={rail} /><Html position={[-0.4, 4.25, 0]} center distanceFactor={8}><span style={{ color: text, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>火车转弯受力分析模型</span></Html><Html position={[-0.4, 3.9, 0]} center distanceFactor={8}><span style={{ color: readings.status === 'ideal' ? '#2a9d8f' : '#e63946', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>{readings.status === 'ideal' ? '理想状态：重力与支持力合成向心力' : readings.status === 'high' ? '速度偏大：外轨提供向内的弹力补偿' : '速度偏小：内轨提供向外的弹力补偿'}</span></Html></group>
}
