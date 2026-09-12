import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import type { ThemeMode } from '../../store/useAppStore'
import { buildElectronBeamPath, type BasicWaveform, type OscilloscopeMode, type XYSettings } from './model'

type PartId = 'envelope' | 'electron-gun' | 'y-plates' | 'x-plates' | 'screen' | 'beam'
type Props = { mode: OscilloscopeMode; elapsed: number; running: boolean; selectedPart: string | null; onSelectPart: (part: string) => void; theme: ThemeMode; wave: BasicWaveform; amplitudeV: number; frequencyHz: number; voltsDiv: number; timeDiv: number; trigger: boolean; xy: XYSettings }
const PART_LABELS: Record<PartId, string> = { envelope: '透明示波管', 'electron-gun': '电子枪', 'y-plates': 'Y 偏转板（信号）', 'x-plates': 'X 偏转板（时基）', screen: '荧光屏', beam: '电子束' }
function PartLabel({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  return <Html position={position} center distanceFactor={8}><span style={{ color, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>{text}</span></Html>
}
function ScreenGrid({ color, onSelect, selected }: { color: string; onSelect: () => void; selected: boolean }) {
  const lines = useMemo(() => {
    const result: Array<[[number, number, number], [number, number, number]]> = []
    for (let i = 0; i <= 10; i += 1) result.push([[4.72, -1.85 + i * 0.37, -1.7], [4.72, -1.85 + i * 0.37, 1.7]])
    for (let i = 0; i <= 8; i += 1) result.push([[4.72, -1.85, -1.7 + i * 0.425], [4.72, 1.85, -1.7 + i * 0.425]])
    return result
  }, [])
  return <group onClick={(event) => { event.stopPropagation(); onSelect() }}>
    <mesh position={[4.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3.7, 3.4]} /><meshBasicMaterial color={selected ? '#c6fff0' : '#dffdf4'} transparent opacity={0.88} side={2} /></mesh>
    {lines.map(([a, b], index) => <Line key={index} points={[a, b]} color={color} lineWidth={selected ? 1.4 : 0.8} transparent opacity={0.62} />)}
  </group>
}
export function Oscilloscope3dRig3D({ mode, elapsed, running, selectedPart, onSelectPart, theme, wave, amplitudeV, frequencyHz, voltsDiv, timeDiv, trigger, xy }: Props) {
  const beamPath = useMemo(() => buildElectronBeamPath({ mode, elapsed, wave, amplitudeV, frequencyHz, voltsDiv, timeDiv, trigger, xy }), [mode, elapsed, wave, amplitudeV, frequencyHz, voltsDiv, timeDiv, trigger, xy])
  const beamPoint = beamPath[beamPath.length - 1] ?? [4.68, 0, 0]
  const dark = theme === 'night'
  const textColor = dark ? '#d8e4ef' : '#3b2e24'
  const shellColor = dark ? '#7891a8' : '#91a8b2'
  const plateY = selectedPart === 'y-plates' ? '#70f4df' : '#2eb9ae'
  const plateX = selectedPart === 'x-plates' ? '#ffd477' : '#e3a83c'
  const beamColor = running ? '#a4ffe3' : '#86bcae'
  return <group data-rig-scene="oscilloscope-3d">
    <ambientLight intensity={dark ? 0.65 : 0.85} /><directionalLight position={[8, 10, 8]} intensity={dark ? 1.1 : 0.8} /><color attach="background" args={[dark ? '#101823' : '#e9f0ed']} />
    <group onClick={(event) => { event.stopPropagation(); onSelectPart('envelope') }}>
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[2.15, 2.15, 10.4, 48, 1, true]} /><meshPhysicalMaterial color={shellColor} transparent opacity={selectedPart === 'envelope' ? 0.18 : 0.11} roughness={0.2} transmission={0.7} side={2} /></mesh>
      <mesh position={[-5.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><ringGeometry args={[1.55, 2.15, 48]} /><meshBasicMaterial color={shellColor} transparent opacity={0.42} side={2} /></mesh>
    </group>
    <group onClick={(event) => { event.stopPropagation(); onSelectPart('electron-gun') }}>
      <mesh position={[-4.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.42, 0.58, 1.35, 20]} /><meshStandardMaterial color="#8c96a2" metalness={0.6} roughness={0.32} /></mesh>
      <mesh position={[-3.58, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.25, 0.65, 16]} /><meshStandardMaterial color="#c5cdd4" metalness={0.5} roughness={0.28} /></mesh>
    </group>
    <group onClick={(event) => { event.stopPropagation(); onSelectPart('y-plates') }}>
      <mesh position={[0.05, 1.05, 0]}><boxGeometry args={[1.6, 0.12, 2.4]} /><meshStandardMaterial color={plateY} metalness={0.2} roughness={0.28} /></mesh>
      <mesh position={[0.05, -1.05, 0]}><boxGeometry args={[1.6, 0.12, 2.4]} /><meshStandardMaterial color={plateY} metalness={0.2} roughness={0.28} /></mesh>
    </group>
    <group onClick={(event) => { event.stopPropagation(); onSelectPart('x-plates') }}>
      <mesh position={[2.05, 0, 1.05]}><boxGeometry args={[1.6, 2.4, 0.12]} /><meshStandardMaterial color={plateX} metalness={0.2} roughness={0.28} /></mesh>
      <mesh position={[2.05, 0, -1.05]}><boxGeometry args={[1.6, 2.4, 0.12]} /><meshStandardMaterial color={plateX} metalness={0.2} roughness={0.28} /></mesh>
    </group>
    <ScreenGrid color={dark ? '#6ab9a7' : '#4e988b'} selected={selectedPart === 'screen'} onSelect={() => onSelectPart('screen')} />
    <Line points={beamPath} color={beamColor} lineWidth={running ? 3.2 : 2.2} transparent opacity={0.9} />
    <mesh position={beamPoint as [number, number, number]} onClick={(event) => { event.stopPropagation(); onSelectPart('beam') }}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#eaffd8" /></mesh>
    <PartLabel text={PART_LABELS['electron-gun']} position={[-4.3, -2.48, 0]} color={textColor} /><PartLabel text={PART_LABELS['y-plates']} position={[0.05, 2.32, 0]} color={plateY} /><PartLabel text={PART_LABELS['x-plates']} position={[2.05, 0, 2.35]} color={plateX} /><PartLabel text={PART_LABELS.screen} position={[4.74, -2.35, 0]} color={textColor} />
  </group>
}
