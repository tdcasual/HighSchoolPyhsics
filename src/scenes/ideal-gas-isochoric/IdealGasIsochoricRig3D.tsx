import { Html } from '@react-three/drei/web/Html'
import { Line } from '../../scene3d/ClassroomLine'
import type { ThemeMode } from '../../store/useAppStore'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'
import { chamberGasHeightForVolumeL, clamp } from './model'

type Point3 = [number, number, number]
type Props = Pick<IdealGasIsochoricSceneState, 'temperatureK' | 'volumeL' | 'elapsed' | 'readings'> & { theme: ThemeMode; mobile?: boolean }

const PARTICLES = Array.from({ length: 36 }, (_, index) => ({
  x: ((index * 37) % 100) / 100,
  y: ((index * 61 + 17) % 100) / 100,
  z: ((index * 83 + 29) % 100) / 100,
}))
const BASE_Y = -1.78
const CHAMBER_WIDTH = 2.85
const CHAMBER_DEPTH = 1.52
const FRONT_Z = CHAMBER_DEPTH / 2 + 0.03

function reflectBetween(start: number, velocity: number, distance: number, min: number, max: number): number {
  const span = Math.max(0.001, max - min)
  const cycle = span * 2
  const path = ((start - min + velocity * distance) % cycle + cycle) % cycle
  return min + (path <= span ? path : cycle - path)
}

function particleDirection(index: number): Point3 {
  const x = Math.sin((index + 1) * 12.9898)
  const y = Math.cos((index + 3) * 7.233)
  const z = Math.sin((index + 5) * 4.117)
  const length = Math.hypot(x, y, z) || 1
  return [x / length, y / length, z / length]
}

function particleColor(temperatureK: number): string {
  if (temperatureK >= 330) return '#ef5142'
  if (temperatureK >= 220) return '#e58b38'
  return '#4f78cc'
}

function Particle({
  x, y, z, index, temperatureK, elapsed, volumeL,
}: { x: number; y: number; z: number; index: number; temperatureK: number; elapsed: number; volumeL: number }) {
  const gasHeight = chamberGasHeightForVolumeL(volumeL)
  const direction = particleDirection(index)
  const speedRatio = Math.sqrt(Math.max(0, temperatureK) / 220)
  const travel = elapsed * 0.78 * speedRatio
  const xMin = -CHAMBER_WIDTH / 2 + 0.18
  const xMax = CHAMBER_WIDTH / 2 - 0.18
  const yMin = BASE_Y + gasHeight * 0.08
  const yMax = BASE_Y + gasHeight * 0.92
  const zMin = -CHAMBER_DEPTH / 2 + 0.18
  const zMax = CHAMBER_DEPTH / 2 - 0.18
  const startX = xMin + x * (xMax - xMin)
  const startY = yMin + y * (yMax - yMin)
  const startZ = zMin + z * (zMax - zMin)
  const position: Point3 = [
    reflectBetween(startX, direction[0], travel, xMin, xMax),
    reflectBetween(startY, direction[1], travel, yMin, yMax),
    reflectBetween(startZ, direction[2], travel, zMin, zMax),
  ]
  const markerLength = 0.16 * speedRatio
  const markerEnd: Point3 = [
    clamp(position[0] + direction[0] * markerLength, xMin, xMax),
    clamp(position[1] + direction[1] * markerLength, yMin, yMax),
    clamp(position[2] + direction[2] * markerLength, zMin, zMax),
  ]
  const color = particleColor(temperatureK)
  return <>
    <mesh position={position}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} /></mesh>
    {index % 6 === 0 && <Line points={[position, markerEnd]} color={color} lineWidth={1.3} />}
  </>
}

function Cylinder({ volumeL, color }: { volumeL: number; color: string }) {
  const gasHeight = chamberGasHeightForVolumeL(volumeL)
  const pistonY = BASE_Y + gasHeight
  const wallHeight = gasHeight + 0.12
  const centerY = (BASE_Y + pistonY + 0.12) / 2
  return <group>
    <mesh position={[0, centerY, 0]}><boxGeometry args={[CHAMBER_WIDTH, wallHeight, CHAMBER_DEPTH]} /><meshPhysicalMaterial color="#dcd7f6" transparent opacity={0.18} roughness={0.2} transmission={0.1} /></mesh>
    <Line points={[
      [-CHAMBER_WIDTH / 2, BASE_Y, FRONT_Z],
      [-CHAMBER_WIDTH / 2, pistonY + 0.12, FRONT_Z],
      [CHAMBER_WIDTH / 2, pistonY + 0.12, FRONT_Z],
      [CHAMBER_WIDTH / 2, BASE_Y, FRONT_Z],
      [-CHAMBER_WIDTH / 2, BASE_Y, FRONT_Z],
    ]} color={color} lineWidth={2.2} />
    <mesh position={[0, BASE_Y - 0.03, 0]}><boxGeometry args={[CHAMBER_WIDTH + 0.16, 0.16, CHAMBER_DEPTH + 0.18]} /><meshStandardMaterial color="#3f444a" metalness={0.45} roughness={0.42} /></mesh>
    <mesh position={[0, pistonY + 0.06, 0]}><boxGeometry args={[CHAMBER_WIDTH + 0.12, 0.14, CHAMBER_DEPTH + 0.12]} /><meshStandardMaterial color="#4d5660" metalness={0.35} roughness={0.4} /></mesh>
  </group>
}

function Thermometer({ temperatureK, dark }: { temperatureK: number; dark: boolean }) {
  const fill = clamp((temperatureK - 100) / 320, 0, 1)
  const tubeBottom = -1.02
  const tubeHeight = 2.1
  const liquidHeight = fill * (tubeHeight - 0.12)
  const labelColor = dark ? '#f0f4f8' : '#343a40'
  return <group position={[-1.9, 0.1, 0.58]}>
    <mesh position={[0, tubeBottom + tubeHeight / 2, 0]}><cylinderGeometry args={[0.075, 0.075, tubeHeight, 16]} /><meshStandardMaterial color="#b7c0c8" metalness={0.3} roughness={0.4} /></mesh>
    <mesh position={[0, tubeBottom - 0.08, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#f04b4f" emissive="#f04b4f" emissiveIntensity={0.3} /></mesh>
    {liquidHeight > 0 && <mesh position={[0, tubeBottom + liquidHeight / 2, 0.06]}><cylinderGeometry args={[0.035, 0.035, liquidHeight, 12]} /><meshBasicMaterial color="#ef4444" /></mesh>}
    {Array.from({ length: 5 }, (_, index) => {
      const y = tubeBottom + index * (tubeHeight / 4)
      return <Line key={index} points={[[-0.13, y, 0.08], [0.13, y, 0.08]]} color="#66727e" lineWidth={1} />
    })}
    <Html position={[0.22, tubeBottom + tubeHeight + 0.14, 0]} center distanceFactor={8}><span style={{ color: labelColor, fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>T = {temperatureK.toFixed(0)} K</span></Html>
  </group>
}

function Gauge({ pressure, color, position, mobile }: { pressure: number; color: string; position: Point3; mobile: boolean }) {
  const maxPressure = 4.2
  const angle = -Math.PI * 0.75 + clamp(pressure / maxPressure, 0, 1) * Math.PI * 1.5
  return <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.62, 0.62, 0.16, 32]} /><meshStandardMaterial color="#edf1f4" metalness={0.35} roughness={0.45} /></mesh>
    <mesh position={[0, 0, 0.095]}><circleGeometry args={[0.49, 32]} /><meshBasicMaterial color="#ffffff" /></mesh>
    {Array.from({ length: 5 }, (_, index) => {
      const tickAngle = -Math.PI * 0.75 + index / 4 * Math.PI * 1.5
      const labelValue = (index / 4 * maxPressure).toFixed(index === 0 ? 0 : 1)
      return <group key={index}>
        <Line points={[[Math.cos(tickAngle) * 0.4, Math.sin(tickAngle) * 0.4, 0.13], [Math.cos(tickAngle) * 0.47, Math.sin(tickAngle) * 0.47, 0.13]]} color="#596575" lineWidth={1} />
        <Html position={[Math.cos(tickAngle) * 0.53, Math.sin(tickAngle) * 0.53, 0.14]} center distanceFactor={8}><span style={{ color: '#596575', fontSize: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{labelValue}</span></Html>
      </group>
    })}
    <Line points={[[0, 0, 0.16], [Math.cos(angle) * 0.36, Math.sin(angle) * 0.36, 0.17]]} color={color} lineWidth={2.4} />
    <mesh position={[0, 0, 0.18]}><sphereGeometry args={[0.045, 12, 10]} /><meshBasicMaterial color={color} /></mesh>
    <Html position={mobile ? [0.72, 0.06, 0.18] : [0, 0.82, 0.18]} center distanceFactor={8}><span style={{ color: '#374151', fontSize: '9px', fontWeight: 800, whiteSpace: 'nowrap' }}>{mobile ? 'p / atm' : 'p / atm · 0–4.2'}</span></Html>
  </group>
}

function HeatingSource({ temperatureK, elapsed }: { temperatureK: number; elapsed: number }) {
  const heat = clamp((temperatureK - 100) / 320, 0, 1)
  const coilColor = heat > 0.66 ? '#e85b35' : '#e7872f'
  return <group>
    <mesh position={[0, BASE_Y - 0.2, 0]}><boxGeometry args={[CHAMBER_WIDTH + 0.55, 0.18, 1.9]} /><meshStandardMaterial color="#70777e" metalness={0.4} roughness={0.5} /></mesh>
    <mesh position={[0, BASE_Y - 0.31, 1.02]}><boxGeometry args={[CHAMBER_WIDTH - 0.25, 0.07, 0.42]} /><meshStandardMaterial color={coilColor} emissive={coilColor} emissiveIntensity={0.18 + heat * 0.82} /></mesh>
    {heat > 0.08 && Array.from({ length: 3 }, (_, index) => {
      const pulse = 0.82 + 0.18 * Math.sin(elapsed * 5 + index * 1.7)
      const height = (0.08 + heat * 0.12) * pulse
      return <mesh key={index} position={[(index - 1) * 0.48, BASE_Y - 0.29 + height / 2, 1.14]} scale={[0.88, pulse, 0.78]}>
        <coneGeometry args={[0.15 + heat * 0.04, height, 10]} />
        <meshBasicMaterial color={coilColor} transparent opacity={0.48 + heat * 0.4} />
      </mesh>
    })}
  </group>
}

export function IdealGasIsochoricRig3D({ temperatureK, volumeL, elapsed, readings, theme, mobile = false }: Props) {
  const dark = theme === 'night'
  const frameColor = dark ? '#d8dee8' : '#343a40'
  const textColor = dark ? '#f0f4f8' : '#343a40'
  const pressureColor = '#ef3948'
  const gasHeight = chamberGasHeightForVolumeL(volumeL)
  const pistonY = BASE_Y + gasHeight
  const midGasY = BASE_Y + gasHeight * 0.52
  const gaugeX = CHAMBER_WIDTH / 2 + 0.5
  const lockX = CHAMBER_WIDTH * 0.34
  const supportX = lockX + 0.5
  const lockBarY = pistonY + 0.38
  return <group data-rig-scene="ideal-gas-isochoric">
    <ambientLight intensity={dark ? 0.72 : 0.96} />
    <color attach="background" args={[dark ? '#101823' : '#f8f9fa']} />
    <Cylinder volumeL={volumeL} color={frameColor} />
    {PARTICLES.map((particle, index) => <Particle key={index} {...particle} index={index} temperatureK={temperatureK} elapsed={elapsed} volumeL={volumeL} />)}
    <HeatingSource temperatureK={temperatureK} elapsed={elapsed} />
    <mesh position={[lockX, pistonY + 0.23, 0.82]}><boxGeometry args={[0.17, 0.3, 0.22]} /><meshStandardMaterial color="#ef3948" /></mesh>
    <Line points={[[lockX, lockBarY, 0.82], [supportX, lockBarY, 0.82]]} color="#adb5bd" lineWidth={3} />
    <mesh position={[supportX, lockBarY + 0.2, 0.82]}><boxGeometry args={[0.16, 0.62, 0.25]} /><meshStandardMaterial color="#343a40" /></mesh>
    <Line points={[[CHAMBER_WIDTH / 2, midGasY, 0.78], [gaugeX - 0.62, midGasY, 0.78]]} color="#66727e" lineWidth={2.4} />
    <Thermometer temperatureK={temperatureK} dark={dark} />
    <Gauge pressure={readings.pressureAtm} color={pressureColor} position={[gaugeX, midGasY, 0.6]} mobile={mobile} />
    <Html position={[0, BASE_Y + chamberGasHeightForVolumeL(6) + 1.14, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '16px', fontWeight: 900, whiteSpace: 'nowrap' }}>理想气体等容变化 · 查理定律</span></Html>
  </group>
}
