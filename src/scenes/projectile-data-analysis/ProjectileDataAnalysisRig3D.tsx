import type { ReactElement } from 'react'
import { Html } from '@react-three/drei/web/Html'
import { Line } from '@react-three/drei/core/Line'
import type { ThemeMode } from '../../store/useAppStore'
import { buildFlashPoints, buildTrajectoryTrace } from './model'
import type { ProjectileDataAnalysisSceneState } from './useProjectileDataAnalysisSceneState'

type Point = [number, number, number]
type Props = Pick<ProjectileDataAnalysisSceneState, 'initialSpeed' | 'gravity' | 'flashPeriod' | 'readings' | 'mode'> & { theme: ThemeMode }
const X_SCALE = 2.1
const Y_SCALE = 1.12
const xWorld = (x: number) => -4.8 + x * X_SCALE
const yWorld = (y: number) => 2.15 - y * Y_SCALE

function Arrow({ start, end, color, label }: { start: Point; end: Point; color: string; label?: string }) {
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0])
  return <group><Line points={[start, end]} color={color} lineWidth={1.6} /><mesh position={end} rotation={[0, 0, angle - Math.PI / 2]}><coneGeometry args={[0.08, 0.22, 8]} /><meshBasicMaterial color={color} /></mesh>{label && <Html position={[end[0] + 0.08, end[1] + 0.12, 0.2]} center distanceFactor={8}><span style={{ color, fontSize: '9px', fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</span></Html>}</group>
}

export function ProjectileDataAnalysisRig3D({ initialSpeed, gravity, flashPeriod, readings, mode, theme }: Props) {
  const dark = theme === 'night'
  const textColor = dark ? '#edf2f7' : '#2f3742'
  const axisColor = dark ? '#aeb9c6' : '#3a424b'
  const gridColor = dark ? '#657483' : '#d8d1c7'
  const params = { initialSpeed, gravity, flashPeriod }
  const trajectory = buildTrajectoryTrace(params, 101).map(([x, y]) => [xWorld(x), yWorld(y), 0.1] as Point)
  const points = buildFlashPoints(params, 5)
  const current: Point = [xWorld(readings.x), yWorld(readings.y), 0.3]
  const grid: ReactElement[] = []
  for (let x = 0; x <= 3; x += 0.4) grid.push(<Line key={`gx-${x}`} points={[[xWorld(x), yWorld(0), -0.7], [xWorld(x), yWorld(2.1), -0.7]]} color={gridColor} lineWidth={0.35} transparent opacity={0.6} />)
  for (let y = 0; y <= 2.1; y += 0.3) grid.push(<Line key={`gy-${y}`} points={[[xWorld(0), yWorld(y), -0.7], [xWorld(3), yWorld(y), -0.7]]} color={gridColor} lineWidth={0.35} transparent opacity={0.6} />)
  return <group data-rig-scene="projectile-data-analysis"><ambientLight intensity={dark ? 0.72 : 0.96} /><color attach="background" args={[dark ? '#101823' : '#fbfaf8']} />{grid}<Line points={[[xWorld(0), yWorld(0), 0], [xWorld(3.25), yWorld(0), 0]]} color={axisColor} lineWidth={1.5} /><Line points={[[xWorld(0), yWorld(0.1), 0], [xWorld(0), yWorld(2.15), 0]]} color={axisColor} lineWidth={1.5} /><Line points={trajectory} color="#ef3948" lineWidth={2.5} dashed dashScale={2.2} dashSize={0.1} gapSize={0.08} />{points.map((point, index) => { const p: Point = [xWorld(point.x), yWorld(point.y), 0.25]; const prior = index > 0 ? points[index - 1] : null; return <group key={point.index}><mesh position={p}><sphereGeometry args={[0.105, 16, 16]} /><meshStandardMaterial color="#ffbd17" emissive="#ffbd17" emissiveIntensity={0.22} /></mesh>{prior && <Arrow start={[xWorld(point.x), yWorld(prior.y), 0.22]} end={[xWorld(point.x), yWorld(point.y), 0.22]} color="#22a895" />}<Html position={[p[0] + 0.12, p[1] + 0.11, 0.3]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '9px', fontWeight: 900, whiteSpace: 'nowrap' }}>{index === 0 ? 'O' : String.fromCharCode(64 + index)}</span></Html></group>})}<mesh position={current}><sphereGeometry args={[0.09, 14, 14]} /><meshStandardMaterial color="#1d8cf0" emissive="#1d8cf0" emissiveIntensity={0.45} /></mesh><Arrow start={[xWorld(0), yWorld(0), 0.25]} end={[xWorld(0.8), yWorld(0), 0.25]} color="#1683ea" label={`v₀=${initialSpeed.toFixed(1)} m/s`} /><Arrow start={[xWorld(0.32), yWorld(0.35), 0.25]} end={[xWorld(0.32), yWorld(0.85), 0.25]} color="#7036bd" label="G=mg" /><Html position={[xWorld(2.25), yWorld(-0.45), 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '14px', fontWeight: 900, whiteSpace: 'nowrap' }}>平抛运动：{mode === 'data' ? '频闪数据还原' : '轨迹与分运动'}</span></Html><Html position={[xWorld(2.45), yWorld(0.34), 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}>+x（水平/m）</span></Html><Html position={[xWorld(-0.12), yWorld(2.12), 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}>+y（竖直向下/m）</span></Html><Html position={[xWorld(1.55), yWorld(2.35), 0]} center distanceFactor={8}><span style={{ color: '#1683ea', fontSize: '9px', whiteSpace: 'nowrap' }}>x=v₀t，y=½gt²，y={readings.trajectoryCoefficient.toFixed(2)}x²</span></Html></group>
}
