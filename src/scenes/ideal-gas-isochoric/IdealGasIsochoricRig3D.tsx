import type { ReactElement } from 'react'
import { Html } from '@react-three/drei/web/Html'
import { Line } from '@react-three/drei/core/Line'
import type { ThemeMode } from '../../store/useAppStore'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'

type Props = Pick<IdealGasIsochoricSceneState, 'temperatureK' | 'volumeL' | 'elapsed' | 'readings'> & { theme: ThemeMode }

const PARTICLES = Array.from({ length: 36 }, (_, index) => ({
  x: ((index * 37) % 100) / 100,
  y: ((index * 61 + 17) % 100) / 100,
  z: ((index * 83 + 29) % 100) / 100,
}))

function Gauge({ pressure, color }: { pressure: number; color: string }) {
  const angle = -Math.PI * 0.75 + Math.min(1, pressure / 1.4) * Math.PI * 1.5
  return <group position={[0.8, 2.25, 0.6]}><mesh><cylinderGeometry args={[0.62, 0.62, 0.16, 32]} /><meshStandardMaterial color="#edf1f4" metalness={0.35} roughness={0.45} /></mesh><mesh rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.49, 32]} /><meshBasicMaterial color="#ffffff" /></mesh><Line points={[[0, 0, 0.1], [Math.cos(angle) * 0.38, Math.sin(angle) * 0.38, 0.12]]} color={color} lineWidth={2.2} /><Html position={[0, -0.48, 0.18]} center distanceFactor={8}><span style={{ color, fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>{pressure.toFixed(2)} atm</span></Html></group>
}

function Thermometer({ temperatureK }: { temperatureK: number }) {
  const fill = Math.min(1, Math.max(0, (temperatureK - 100) / 320))
  return <group position={[-2.75, 1.2, 0.52]}><mesh><cylinderGeometry args={[0.075, 0.075, 2.25, 16]} /><meshStandardMaterial color="#b7c0c8" metalness={0.3} roughness={0.4} /></mesh><mesh position={[0, -1.06, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#f04b4f" emissive="#f04b4f" emissiveIntensity={0.3} /></mesh><mesh position={[0, -1.06 + fill * 2.1, 0.06]}><cylinderGeometry args={[0.035, 0.035, Math.max(0.05, fill * 2.1), 12]} /><meshBasicMaterial color="#ef4444" /></mesh><Html position={[0.18, 0.78, 0]} center distanceFactor={8}><span style={{ color: '#374151', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>T = {temperatureK.toFixed(0)} K</span></Html></group>
}

function Particle({ x, y, z, index, temperatureK, elapsed, volumeL }: { x: number; y: number; z: number; index: number; temperatureK: number; elapsed: number; volumeL: number }) {
  const speed = 0.08 + Math.sqrt(temperatureK / 220) * 0.13
  const phase = elapsed * speed + index * 1.83
  const px = -1.9 + x * 3.35 + Math.sin(phase) * 0.12
  const py = -1.55 + y * 3.05 + Math.cos(phase * 1.17) * 0.1
  const depth = -0.7 + z * 1.2 + Math.sin(phase * 0.87) * 0.06
  const scale = Math.max(0.72, Math.min(1.08, Math.sqrt(6 / volumeL)))
  return <mesh position={[px, py, depth]} scale={scale}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color="#4f37bd" emissive="#4f37bd" emissiveIntensity={0.28} /></mesh>
}

function Cylinder({ volumeL, color }: { volumeL: number; color: string }) {
  const width = 2.95 + volumeL / 6 * 0.55
  return <group><mesh position={[0, -0.1, 0]}><boxGeometry args={[width, 3.65, 1.52]} /><meshPhysicalMaterial color="#dcd7f6" transparent opacity={0.2} roughness={0.2} transmission={0.1} /></mesh><Line points={[[-width / 2, -1.92, 0.7], [width / 2, -1.92, 0.7], [width / 2, 1.72, 0.7], [-width / 2, 1.72, 0.7], [-width / 2, -1.92, 0.7]]} color={color} lineWidth={2.2} /><mesh position={[0, 1.72, 0]}><boxGeometry args={[width + 0.12, 0.13, 1.66]} /><meshStandardMaterial color="#3f444a" metalness={0.45} roughness={0.42} /></mesh><mesh position={[0, -1.92, 0]}><boxGeometry args={[width + 0.15, 0.16, 1.7]} /><meshStandardMaterial color="#3f444a" metalness={0.45} roughness={0.42} /></mesh></group>
}

export function IdealGasIsochoricRig3D({ temperatureK, volumeL, elapsed, readings, theme }: Props) {
  const dark = theme === 'night'
  const frameColor = dark ? '#d8dee8' : '#343a40'
  const textColor = dark ? '#f0f4f8' : '#343a40'
  const pressureColor = '#ef3948'
  const width = 2.95 + volumeL / 6 * 0.55
  const lockX = width / 2 + 0.42
  const base: ReactElement[] = []
  for (let index = 0; index < 5; index += 1) {
    const x = -1.9 + index * 0.95
    base.push(<Line key={`grid-${index}`} points={[[x, -1.5, -0.76], [x, 1.5, -0.76]]} color={dark ? '#657483' : '#d2d6dc'} lineWidth={0.45} transparent opacity={0.45} />)
  }
  return <group data-rig-scene="ideal-gas-isochoric"><ambientLight intensity={dark ? 0.72 : 0.96} /><color attach="background" args={[dark ? '#101823' : '#f8f9fa']} />{base}<Cylinder volumeL={volumeL} color={frameColor} />{PARTICLES.map((particle, index) => <Particle key={index} {...particle} index={index} temperatureK={temperatureK} elapsed={elapsed} volumeL={volumeL} />)}<mesh position={[0, -2.2, 0]}><boxGeometry args={[width + 0.55, 0.18, 1.9]} /><meshStandardMaterial color="#70777e" metalness={0.4} roughness={0.5} /></mesh><mesh position={[0, -2.04, 0.66]}><boxGeometry args={[width - 0.25, 0.08, 0.55]} /><meshStandardMaterial color="#e7872f" emissive="#e7872f" emissiveIntensity={0.55} /></mesh><mesh position={[0, 1.62, 0]}><boxGeometry args={[width * 0.8, 0.15, 1.28]} /><meshStandardMaterial color="#4d5660" metalness={0.35} roughness={0.4} /></mesh><Line points={[[lockX, 0.25, 0.72], [lockX + 0.52, 0.25, 0.72]]} color="#adb5bd" lineWidth={3} /><mesh position={[lockX, 0.25, 0.78]}><boxGeometry args={[0.18, 0.75, 0.22]} /><meshStandardMaterial color="#ef3948" /></mesh><mesh position={[lockX + 0.52, 0.25, 0.72]}><boxGeometry args={[0.16, 0.9, 0.25]} /><meshStandardMaterial color="#343a40" /></mesh><Html position={[lockX, 0.92, 0.75]} center distanceFactor={8}><span style={{ color: '#ef3948', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>机械锁定</span></Html><Thermometer temperatureK={temperatureK} /><Gauge pressure={readings.pressureAtm} color={pressureColor} /><Html position={[1.05, 2.85, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '16px', fontWeight: 900, whiteSpace: 'nowrap' }}>理想气体等容变化 · 查理定律</span></Html><Html position={[-0.2, -2.72, 0]} center distanceFactor={8}><span style={{ color: '#e63946', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>{volumeL.toFixed(1)} L · p = {readings.slopeAtmPerK.toFixed(4)}T</span></Html></group>
}
