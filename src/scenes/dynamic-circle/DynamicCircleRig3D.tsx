import type { ReactElement } from 'react'
import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import type { BoundaryType, TrajectoryPoint } from './model'
import type { DynamicCircleSceneState } from './useDynamicCircleSceneState'

type Point = [number, number, number]
type Props = Pick<DynamicCircleSceneState, 'mode' | 'boundary' | 'B' | 'v' | 'thetaDeg' | 'xBound' | 'triangleX' | 'triangleHeight' | 'circleCenterX' | 'circleRadius' | 'showCenter' | 'readings' | 'elapsed'> & { theme: ThemeMode }

const X0 = 250
const Y0 = 330
const SCALE = 46
const toScene = (point: TrajectoryPoint): Point => [(point.x - 325) / SCALE, (325 - point.y) / SCALE, 0]

function Arrow({ start, end, color, label }: { start: Point; end: Point; color: string; label: string }) {
  return <group><Line points={[start, end]} color={color} lineWidth={2.6} /><mesh position={end}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color={color} /></mesh><Html position={[end[0] + 0.12, end[1] + 0.12, 0]} center distanceFactor={8}><span style={{ color, fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(255,255,255,0.75)' }}>{label}</span></Html></group>
}

function FieldGrid({ dark }: { dark: boolean }) {
  const color = dark ? '#53616c' : '#c9c1b9'
  const marks: ReactElement[] = []
  for (let x = 270; x <= 580; x += 45) for (let y = 110; y <= 550; y += 45) {
    const [sx, sy] = toScene({ x, y })
    marks.push(<group key={`${x}-${y}`}><Line points={[[sx - 0.07, sy - 0.07, -0.02], [sx + 0.07, sy + 0.07, -0.02]]} color={color} lineWidth={0.8} /><Line points={[[sx - 0.07, sy + 0.07, -0.02], [sx + 0.07, sy - 0.07, -0.02]]} color={color} lineWidth={0.8} /></group>)
  }
  return <group>{marks}</group>
}

function Boundary({ type, xBound, triangleX, triangleHeight, circleCenterX, circleRadius, dark }: { type: BoundaryType; xBound: number; triangleX: number; triangleHeight: number; circleCenterX: number; circleRadius: number; dark: boolean }) {
  const color = '#e63946'
  const lineColor = dark ? '#ff7a85' : color
  if (type === 'straight') {
    const x = (xBound - 325) / SCALE
    return <><mesh position={[(xBound + X0) / 2 / SCALE - 325 / SCALE, 0, -0.08]}><planeGeometry args={[(xBound - X0) / SCALE, 9.8]} /><meshBasicMaterial color="#f4c7c7" transparent opacity={dark ? 0.08 : 0.12} /></mesh><Line points={[[x, -4.8, 0], [x, 4.8, 0]]} color={lineColor} lineWidth={2} dashed dashSize={0.12} gapSize={0.1} /><Html position={[x, 4.55, 0]} center distanceFactor={8}><span style={{ color: lineColor, fontWeight: 800, fontSize: '11px' }}>右边界</span></Html></>
  }
  if (type === 'triangle') {
    const points: Point[] = [{ x: X0, y: Y0 - triangleHeight / 2 }, { x: triangleX, y: Y0 }, { x: X0, y: Y0 + triangleHeight / 2 }, { x: X0, y: Y0 - triangleHeight / 2 }].map(toScene)
    return <><Line points={points} color={lineColor} lineWidth={2} /><Html position={toScene({ x: triangleX, y: Y0 })} center distanceFactor={8}><span style={{ color: lineColor, fontWeight: 800, fontSize: '11px' }}>三角形边界</span></Html></>
  }
  const points: Point[] = Array.from({ length: 65 }, (_, index) => { const angle = index / 64 * Math.PI * 2; return toScene({ x: circleCenterX + circleRadius * Math.cos(angle), y: Y0 + circleRadius * Math.sin(angle) }) })
  return <><Line points={points} color={lineColor} lineWidth={2} /><Html position={toScene({ x: circleCenterX, y: Y0 + circleRadius + 18 })} center distanceFactor={8}><span style={{ color: lineColor, fontWeight: 800, fontSize: '11px' }}>圆形磁场边界</span></Html></>
}

export function DynamicCircleRig3D(props: Props) {
  const { mode, boundary, B, v, thetaDeg, xBound, triangleX, triangleHeight, circleCenterX, circleRadius, showCenter, readings, theme } = props
  const dark = theme === 'night'
  const trajectory = readings.trajectory.map(toScene)
  const particle = toScene(readings.particle)
  const center = toScene(readings.center)
  const injection = toScene({ x: X0, y: mode === 'translating' || mode === 'comprehensive' ? readings.trajectory[0]?.y ?? Y0 : Y0 })
  const velocityAngle = (mode === 'rotating' || mode === 'comprehensive' ? thetaDeg : 0) * Math.PI / 180
  const velocityEnd: Point = [injection[0] + Math.cos(velocityAngle) * 1.15, injection[1] - Math.sin(velocityAngle) * 1.15, 0]
  const textColor = dark ? '#e4edf4' : '#3e2723'
  return <group data-rig-scene="dynamic-circle"><ambientLight intensity={dark ? 0.7 : 0.95} /><directionalLight position={[4, 6, 8]} intensity={0.7} /><color attach="background" args={[dark ? '#101823' : '#f7f4ef']} /><FieldGrid dark={dark} /><Boundary type={boundary} xBound={xBound} triangleX={triangleX} triangleHeight={triangleHeight} circleCenterX={circleCenterX} circleRadius={circleRadius} dark={dark} />
    <Line points={trajectory} color="#2a9d8f" lineWidth={2.8} />
    <mesh position={particle}><sphereGeometry args={[0.16, 18, 18]} /><meshStandardMaterial color="#e63946" emissive="#e63946" emissiveIntensity={0.6} /></mesh>
    <Arrow start={injection} end={velocityEnd} color="#f59e0b" label={`v ${v.toFixed(1)} m/s`} />
    <Arrow start={particle} end={[particle[0], particle[1] + (B >= 0 ? 0.9 : -0.9), 0]} color="#457b9d" label={`B ${B.toFixed(2)} T`} />
    {showCenter && <><Line points={[center, particle]} color="#e63946" lineWidth={1.2} dashed dashSize={0.1} gapSize={0.08} /><mesh position={center}><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#0f9d8a" /></mesh><Html position={[center[0], center[1] + 0.2, 0]} center distanceFactor={8}><span style={{ color: '#0f9d8a', fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap' }}>圆心 C · R={readings.radius.toFixed(1)}</span></Html></>}
    <Html position={[-4.9, 4.45, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap' }}>有界匀强磁场 · {B >= 0 ? '× 向里' : '· 向外'}</span></Html>
    <Html position={[-4.85, -4.5, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>绿色轨迹：带电粒子圆周运动</span></Html>
  </group>
}
