import type { ReactElement } from 'react'
import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildWavePoints, type WaveParticle } from './model'
import type { WaveStateSceneState } from './useWaveStateSceneState'

type Point = [number, number, number]
type Props = Pick<WaveStateSceneState, 'amplitude' | 'wavelength' | 'period' | 'direction' | 'elapsed' | 'readings' | 'showGhost' | 'showVelocity' | 'showAcceleration'> & { theme: ThemeMode }

const X_SCALE = 1.42
const Y_SCALE = 0.14
const xWorld = (x: number) => -5.7 + x * X_SCALE
const yWorld = (y: number) => y * Y_SCALE

function Arrow({ particle, color, kind }: { particle: WaveParticle; color: string; kind: 'velocity' | 'acceleration' }) {
  const value = kind === 'velocity' ? particle.velocity : particle.acceleration
  if (Math.abs(value) < 0.0001) return null
  const sign = value > 0 ? 1 : -1
  const x = xWorld(particle.x)
  const start: Point = [x, yWorld(particle.y), 0.18]
  const end: Point = [x, yWorld(particle.y) + sign * 0.42, 0.18]
  return <group><Line points={[start, end]} color={color} lineWidth={1.5} /><mesh position={end} rotation={[sign > 0 ? 0 : Math.PI, 0, 0]}><coneGeometry args={[0.07, 0.18, 8]} /><meshBasicMaterial color={color} /></mesh></group>
}

function Axis({ color }: { color: string }) {
  const grid: ReactElement[] = []
  for (let y = -2; y <= 2; y += 1) grid.push(<Line key={`h-${y}`} points={[[xWorld(0), y * 0.72, -0.1], [xWorld(8), y * 0.72, -0.1]]} color={color} lineWidth={0.6} transparent opacity={0.38} />)
  return <group>{grid}<Line points={[[xWorld(0), 0, 0], [xWorld(8.25), 0, 0]]} color="#343a40" lineWidth={1.4} /><Line points={[[xWorld(0), -2.4, 0], [xWorld(0), 2.4, 0]]} color="#343a40" lineWidth={1.4} /></group>
}

export function WaveStateRig3D({ amplitude, wavelength, period, elapsed, readings, direction, showGhost, showVelocity, showAcceleration, theme }: Props) {
  const dark = theme === 'night'
  const waveColor = dark ? '#70b3dc' : '#457b9d'
  const futureColor = dark ? '#a8b5bf' : '#adb5bd'
  const gridColor = dark ? '#657483' : '#c7d0d6'
  const textColor = dark ? '#e5edf3' : '#3b2e24'
  const params = { amplitude, wavelength, period, direction }
  const wavePath = buildWavePoints(elapsed, params, 161).map(([x, y]) => [xWorld(x), yWorld(y), 0.1] as Point)
  const future = buildWavePoints(elapsed + 0.18, params, 161).map(([x, y]) => [xWorld(x), yWorld(y), 0.08] as Point)
  const arrowStart = xWorld(direction === 'right' ? 7.65 : 8.1)
  const arrowEnd = xWorld(direction === 'right' ? 8.1 : 7.65)
  return <group data-rig-scene="wave-state"><ambientLight intensity={dark ? 0.75 : 0.95} /><color attach="background" args={[dark ? '#101823' : '#f8f9fa']} /><Axis color={gridColor} />
    <Line points={wavePath} color={waveColor} lineWidth={2.8} />
    {showGhost && <Line points={future} color={futureColor} lineWidth={1.5} dashed dashScale={3} dashSize={0.08} gapSize={0.06} />}
    {readings.particles.map((particle) => { const point: Point = [xWorld(particle.x), yWorld(particle.y), 0.25]; const probe = particle.x === 2; return <group key={particle.x}><Line points={[[xWorld(particle.x), -2.15, 0], [xWorld(particle.x), 2.15, 0]]} color={probe ? '#ffd166' : gridColor} lineWidth={probe ? 1.05 : 0.45} transparent opacity={probe ? 0.55 : 0.22} dashed={probe} /><mesh position={point}><sphereGeometry args={[probe ? 0.105 : 0.075, 14, 14]} /><meshStandardMaterial color={probe ? '#ffd166' : '#343a40'} emissive={probe ? '#ffd166' : '#343a40'} emissiveIntensity={probe ? 0.42 : 0.08} /></mesh>{showVelocity && <Arrow particle={particle} color="#2a9d8f" kind="velocity" />}{showAcceleration && <Arrow particle={particle} color="#e63946" kind="acceleration" />}</group> })}
    <Line points={[[arrowStart, 2.55, 0], [arrowEnd, 2.55, 0]]} color="#457b9d" lineWidth={1.8} /><mesh position={[arrowEnd, 2.55, 0]} rotation={[0, 0, direction === 'right' ? -Math.PI / 2 : Math.PI / 2]}><coneGeometry args={[0.08, 0.22, 8]} /><meshBasicMaterial color="#457b9d" /></mesh><Html position={[xWorld(4), 3.15, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '15px', fontWeight: 900, whiteSpace: 'nowrap' }}>机械波：简谐横波传播状态</span></Html><Html position={[xWorld(6.1), 2.88, 0]} center distanceFactor={8}><span style={{ color: waveColor, fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>波向{direction === 'right' ? '右' : '左'}传播</span></Html><Html position={[xWorld(2), -2.65, 0]} center distanceFactor={8}><span style={{ color: '#ffd166', fontSize: '11px', fontWeight: 800 }}>P</span></Html><Html position={[xWorld(0), 2.72, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>y / cm</span></Html><Html position={[xWorld(8.25), -0.35, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '11px', fontStyle: 'italic', whiteSpace: 'nowrap' }}>x / m</span></Html><Html position={[xWorld(4), -3.12, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>{showGhost ? '实线：当前波形 · 虚线：Δt 微平移波形' : '实线：当前波形 · 质点沿各自 y 轴振动'}</span></Html></group>
}
