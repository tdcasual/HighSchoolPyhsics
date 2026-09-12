import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildSpatialWave, buildTemporalWave, SPACE_LENGTH, TIME_LENGTH } from './model'
import type { MechanicalWaveGraphsSceneState } from './useMechanicalWaveGraphsSceneState'

type Point = [number, number, number]
type Props = Pick<MechanicalWaveGraphsSceneState, 'amplitude' | 'wavelength' | 'period' | 'probeX' | 'elapsed' | 'readings' | 'showVelocity'> & { theme: ThemeMode }
const X_SCALE = 0.13
const Y_SCALE = 0.22
const xWorld = (x: number) => -5.7 + x * X_SCALE
const waveY = (y: number) => y * Y_SCALE

function Axes({ y, width, color, labels }: { y: number; width: number; color: string; labels: [string, string] }) {
  return <group><Line points={[[xWorld(0), y, 0], [xWorld(width), y, 0]]} color="#343a40" lineWidth={1.2} /><Line points={[[xWorld(0), y - 1.5, 0], [xWorld(0), y + 1.5, 0]]} color={color} lineWidth={1.1} /><Html position={[xWorld(width), y - 0.24, 0]} center distanceFactor={8}><span style={{ color: '#343a40', fontSize: '10px', fontStyle: 'italic' }}>{labels[1]}</span></Html><Html position={[xWorld(0), y + 1.62, 0]} center distanceFactor={8}><span style={{ color, fontSize: '10px' }}>{labels[0]}</span></Html></group>
}

export function MechanicalWaveGraphsRig3D({ amplitude, wavelength, period, probeX, elapsed, readings, showVelocity, theme }: Props) {
  const dark = theme === 'night'
  const waveColor = dark ? '#70b3dc' : '#457b9d'
  const probeColor = '#ef476f'
  const textColor = dark ? '#e5edf3' : '#3b2e24'
  const gridColor = dark ? '#657483' : '#c7d0d6'
  const params = { amplitude, wavelength, period, probeX }
  const topY = 1.45
  const bottomY = -2.05
  const spatial = buildSpatialWave(elapsed, params, 97).map(([x, y]) => [xWorld(x), topY + waveY(y), 0.15] as Point)
  const temporal = buildTemporalWave(params, 97).map(([time, y]) => [xWorld(time / TIME_LENGTH * SPACE_LENGTH), bottomY + waveY(y), 0.15] as Point)
  const probeTop: Point = [xWorld(probeX), topY + waveY(readings.displacement), 0.35]
  const probeTime = Math.min(TIME_LENGTH, elapsed % TIME_LENGTH)
  const probeBottom: Point = [xWorld(probeTime / TIME_LENGTH * SPACE_LENGTH), bottomY + waveY(readings.displacement), 0.35]
  const velocitySign = readings.velocity >= 0 ? 1 : -1
  return <group data-rig-scene="mechanical-wave-graphs"><ambientLight intensity={dark ? 0.75 : 0.95} /><color attach="background" args={[dark ? '#101823' : '#f8f9fa']} /><Axes y={topY} width={SPACE_LENGTH} color={gridColor} labels={['y / cm', 'x / m']} /><Axes y={bottomY} width={TIME_LENGTH} color={gridColor} labels={['y / cm', 't / s']} /><Line points={spatial} color={waveColor} lineWidth={2.5} /><Line points={temporal} color="#e63946" lineWidth={2.5} /><Line points={[[xWorld(probeX), topY - 1.4, 0.1], [xWorld(probeX), topY + 1.35, 0.1]]} color={probeColor} lineWidth={1.2} dashed dashScale={2.5} dashSize={0.1} gapSize={0.08} /><Line points={[[xWorld(probeTime / TIME_LENGTH * SPACE_LENGTH), bottomY - 1.4, 0.1], [xWorld(probeTime / TIME_LENGTH * SPACE_LENGTH), bottomY + 1.35, 0.1]]} color={probeColor} lineWidth={1.2} dashed dashScale={2.5} dashSize={0.1} gapSize={0.08} /><mesh position={probeTop}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={probeColor} emissive={probeColor} emissiveIntensity={0.42} /></mesh><mesh position={probeBottom}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={probeColor} emissive={probeColor} emissiveIntensity={0.42} /></mesh>{showVelocity && <><Line points={[probeTop, [probeTop[0], probeTop[1] + velocitySign * 0.45, 0.35]]} color={probeColor} lineWidth={1.8} /><Line points={[probeBottom, [probeBottom[0], probeBottom[1] + velocitySign * 0.45, 0.35]]} color={probeColor} lineWidth={1.8} /></>}<Html position={[xWorld(36), 3.05, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>机械波的形成与图像演示</span></Html><Html position={[xWorld(20), 2.55, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>空间波形图（y-x）</span></Html><Html position={[xWorld(20), -0.45, 0]} center distanceFactor={8}><span style={{ color: probeColor, fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>P：xₚ={probeX.toFixed(0)} m · {readings.velocity >= 0 ? '正在向上振动' : '正在向下振动'}</span></Html><Html position={[xWorld(20), -1.05, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>选中质点的振动图像（y-t）</span></Html><Html position={[xWorld(36), -3.45, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>红色探针区：同一质点在空间图与时间图中的对应状态 · v=λ/T={readings.speed.toFixed(1)} m/s</span></Html></group>
}
