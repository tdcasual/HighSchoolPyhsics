import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import type { ThemeMode } from '../../store/useAppStore'
import { deriveGeneratorReadings } from './model'

type Props = { angleRad: number; running: boolean; theme: ThemeMode }

function Label({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  return <Html position={position} center distanceFactor={8}><span style={{ color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.38)' }}>{text}</span></Html>
}

function Arrow({ start, end, color, width = 2 }: { start: [number, number, number]; end: [number, number, number]; color: string; width?: number }) {
  const direction = useMemo(() => [end[0] - start[0], end[1] - start[1], end[2] - start[2]] as [number, number, number], [end, start])
  const length = Math.hypot(...direction)
  const midpoint: [number, number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]
  return <group>
    <Line points={[start, end]} color={color} lineWidth={width} />
    <mesh position={end} rotation={[0, Math.atan2(direction[0], direction[2]), Math.acos(direction[1] / Math.max(0.001, length))]}><coneGeometry args={[0.12, 0.34, 12]} /><meshBasicMaterial color={color} /></mesh>
    <mesh position={midpoint} visible={false}><sphereGeometry args={[0.01, 4, 4]} /></mesh>
  </group>
}

function FieldLines({ dark }: { dark: boolean }) {
  const lines = useMemo(() => Array.from({ length: 5 }, (_, index) => -2 + index), [])
  return <group>
    {lines.map((y) => <Arrow key={`field-${y}`} start={[-3.9, y, -1.8]} end={[3.9, y, -1.8]} color={dark ? '#78b7d8' : '#457b9d'} width={1.2} />)}
    {lines.map((y) => <Arrow key={`field-back-${y}`} start={[-3.9, y, 1.8]} end={[3.9, y, 1.8]} color={dark ? '#78b7d8' : '#457b9d'} width={1.2} />)}
  </group>
}

export function GeneratorCoreRig3D({ angleRad, running, theme }: Props) {
  const dark = theme === 'night'
  const textColor = dark ? '#e4edf4' : '#3b2e24'
  const readings = deriveGeneratorReadings(angleRad)
  const coilPoints: Array<[number, number, number]> = [[0, -1.55, -1.05], [0, 1.55, -1.05], [0, 1.55, 1.05], [0, -1.55, 1.05], [0, -1.55, -1.05]]
  const currentColor = readings.emfNormalized >= 0 ? '#e63946' : '#3b82c4'
  return <group data-rig-scene="generator-core">
    <ambientLight intensity={dark ? 0.7 : 0.9} /><directionalLight position={[6, 9, 8]} intensity={dark ? 1.1 : 0.85} /><color attach="background" args={[dark ? '#101823' : '#edf1ee']} />
    <mesh position={[-5, 0, 0]}><boxGeometry args={[1.25, 5.2, 4.8]} /><meshStandardMaterial color="#e63946" roughness={0.38} metalness={0.12} /></mesh>
    <mesh position={[5, 0, 0]}><boxGeometry args={[1.25, 5.2, 4.8]} /><meshStandardMaterial color="#2d6db5" roughness={0.38} metalness={0.12} /></mesh>
    <Label text="N" position={[-5, 0, 2.48]} color="#ffffff" /><Label text="S" position={[5, 0, 2.48]} color="#ffffff" />
    <FieldLines dark={dark} />
    <Line points={[[-3.8, 0, 0], [3.8, 0, 0]]} color={dark ? '#a8b9c8' : '#788a92'} lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />
    <group rotation={[0, angleRad, 0]}>
      <Line points={coilPoints} color="#f4a261" lineWidth={running ? 3.2 : 2.4} />
      <mesh position={[0, 1.55, -1.05]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#ffd166" /></mesh>
    </group>
    <Arrow start={[0, 0, 0]} end={[readings.normalVector[0] * 2.3, 0, readings.normalVector[2] * 2.3]} color="#9c27b0" width={2.5} />
    <Arrow start={[0, 2.15, 0]} end={[readings.velocityVector[0] * 1.65, 2.15, readings.velocityVector[2] * 1.65]} color="#f4c542" width={2.5} />
    <Arrow start={[0, -1.9, -1.2]} end={[readings.emfNormalized >= 0 ? 0.95 : -0.95, -1.9, -1.2]} color={currentColor} width={2.1} />
    <Label text="法向量 n" position={[readings.normalVector[0] * 2.4, 0.25, readings.normalVector[2] * 2.4]} color="#9c27b0" />
    <Label text="速度 v" position={[readings.velocityVector[0] * 1.8, 2.38, readings.velocityVector[2] * 1.8]} color="#c08500" />
    <Label text={readings.currentDirection === '换向瞬间' ? '电流换向' : `电流 ${readings.currentDirection}`} position={[0, -2.28, -1.2]} color={currentColor} />
    <Label text="旋转轴 O" position={[0, -2.42, 0]} color={textColor} />
    <Label text="B" position={[0, 2.58, -1.8]} color={dark ? '#9ed7f0' : '#457b9d'} />
  </group>
}

