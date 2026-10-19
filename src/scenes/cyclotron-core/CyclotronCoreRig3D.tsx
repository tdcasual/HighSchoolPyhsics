import type { ReactElement } from 'react'
import { Html } from '@react-three/drei/web/Html'
import { Line } from '../../scene3d/ClassroomLine'
import { useMemo } from 'react'
import { DoubleSide, Shape } from 'three'
import type { ThemeMode } from '../../store/useAppStore'
import type { CyclotronCoreSceneState } from './useCyclotronCoreSceneState'

type Point = [number, number, number]
type Props = Pick<CyclotronCoreSceneState, 'B' | 'U' | 'readings'> & { theme: ThemeMode }

const DEE_RADIUS = 4.55
const GAP_HALF_HEIGHT = 0.12
const GAP_EDGE_X = Math.sqrt(DEE_RADIUS ** 2 - GAP_HALF_HEIGHT ** 2)

function makeDeeShape(upper: boolean) {
  const shape = new Shape()
  const angle = Math.asin(GAP_HALF_HEIGHT / DEE_RADIUS)
  if (upper) {
    shape.moveTo(GAP_EDGE_X, GAP_HALF_HEIGHT)
    shape.absarc(0, 0, DEE_RADIUS, angle, Math.PI - angle, false)
    shape.lineTo(GAP_EDGE_X, GAP_HALF_HEIGHT)
  } else {
    shape.moveTo(-GAP_EDGE_X, -GAP_HALF_HEIGHT)
    shape.absarc(0, 0, DEE_RADIUS, Math.PI + angle, 2 * Math.PI - angle, false)
    shape.lineTo(-GAP_EDGE_X, -GAP_HALF_HEIGHT)
  }
  shape.closePath()
  return shape
}

function Dee({ upper, color }: { upper: boolean; color: string }) {
  const shape = useMemo(() => makeDeeShape(upper), [upper])
  return (
    <mesh position={[0, 0, -0.24]}>
      <extrudeGeometry args={[shape, { depth: 0.22, bevelEnabled: false, steps: 1 }]} />
      <meshStandardMaterial color={color} metalness={0.18} roughness={0.56} side={DoubleSide} transparent opacity={0.78} />
    </mesh>
  )
}

function HalfOutline({ upper, color }: { upper: boolean; color: string }) {
  const angle = Math.asin(GAP_HALF_HEIGHT / DEE_RADIUS)
  const start = upper ? angle : Math.PI + angle
  const end = upper ? Math.PI - angle : 2 * Math.PI - angle
  const points: Point[] = Array.from({ length: 65 }, (_, index) => {
    const theta = start + index / 64 * (end - start)
    return [DEE_RADIUS * Math.cos(theta), DEE_RADIUS * Math.sin(theta), 0.02]
  })
  const gapY = upper ? GAP_HALF_HEIGHT : -GAP_HALF_HEIGHT
  return (
    <>
      <Line points={points} color={color} lineWidth={2.2} />
      <Line points={[[-GAP_EDGE_X, gapY, 0.02], [GAP_EDGE_X, gapY, 0.02]]} color={color} lineWidth={2.2} />
    </>
  )
}

function FieldMarks({ dark }: { dark: boolean }) {
  const color = dark ? '#8d9aa5' : '#adb5bd'
  const marks: ReactElement[] = []
  for (let x = -3.8; x <= 3.8; x += 0.9) {
    for (let y = -3.6; y <= 3.6; y += 0.9) {
      if (Math.abs(y) < 0.42 || x * x + y * y > 19.8) continue
      marks.push(
        <group key={`${x}-${y}`}>
          <Line points={[[x - 0.1, y - 0.1, -0.015], [x + 0.1, y + 0.1, -0.015]]} color={color} lineWidth={0.75} />
          <Line points={[[x - 0.1, y + 0.1, -0.015], [x + 0.1, y - 0.1, -0.015]]} color={color} lineWidth={0.75} />
        </group>,
      )
    }
  }
  return <group>{marks}</group>
}

function GapArrow({ x, direction, color }: { x: number; direction: number; color: string }) {
  const startY = -direction * 0.088
  const endY = direction * 0.088
  const headBaseY = endY - direction * 0.035
  const start: Point = [x, startY, 0.16]
  const end: Point = [x, endY, 0.16]
  const left: Point = [x - 0.055, headBaseY, end[2]]
  const right: Point = [x + 0.055, headBaseY, end[2]]
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={2} />
      <Line points={[end, left]} color={color} lineWidth={2} />
      <Line points={[end, right]} color={color} lineWidth={2} />
    </group>
  )
}

function RfSupply({
  dark,
  topPolarity,
  bottomPolarity,
  voltage,
}: {
  dark: boolean
  topPolarity: '-' | '+'
  bottomPolarity: '-' | '+'
  voltage: number
}) {
  const color = dark ? '#e4edf4' : '#3e4b55'
  const topColor = topPolarity === '+' ? '#e63946' : '#457b9d'
  const bottomColor = bottomPolarity === '+' ? '#e63946' : '#457b9d'
  return (
    <>
      <group position={[5.25, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.32, 0.045, 8, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <Line points={[[-0.19, 0, 0.04], [-0.1, 0.12, 0.04], [0, -0.12, 0.04], [0.1, 0.12, 0.04], [0.19, 0, 0.04]]} color={color} lineWidth={1.4} />
        <Html position={[0, 0.58, 0]} center distanceFactor={8}>
          <span style={{ color, fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap', position: 'relative', left: '-42px' }}>高频交流电源 U~ = {voltage} kV</span>
        </Html>
      </group>
      <Line points={[[4.96, 0.14, 0.01], [4.76, 0.55, 0.01], [4.25, 0.55, 0.01]]} color={topColor} lineWidth={1.6} />
      <Line points={[[4.96, -0.14, 0.01], [4.76, -0.55, 0.01], [4.25, -0.55, 0.01]]} color={bottomColor} lineWidth={1.6} />
    </>
  )
}

function IonSource({ dark }: { dark: boolean }) {
  const color = dark ? '#f2c14e' : '#d1495b'
  const labelColor = dark ? '#e4edf4' : '#343a40'
  return (
    <group position={[0, 0, 0.31]}>
      <mesh>
        <torusGeometry args={[0.16, 0.035, 8, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={[0.45, -0.43, 0]} center distanceFactor={8}>
        <span style={{ color: labelColor, fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap' }}>离子源</span>
      </Html>
    </group>
  )
}

export function CyclotronCoreRig3D({ B, U, readings, theme }: Props) {
  const dark = theme === 'night'
  const deeColor = dark ? '#34434d' : '#e9ecef'
  const outline = dark ? '#94a3ad' : '#6c757d'
  const textColor = dark ? '#e4edf4' : '#343a40'
  const pathPoints = readings.extracted ? readings.trail.slice(0, -1) : readings.trail
  const path = pathPoints.map(([x, y]) => [x, y, 0.2] as Point)
  const exitStart = readings.extracted ? readings.trail[readings.trail.length - 2] : undefined
  const [px, py] = readings.particlePosition
  const particleColor = readings.particle.charge === 2 ? '#f08c46' : '#e63946'
  // E points from the positive Dee toward the negative Dee.
  const electricFieldDirection = readings.polarityTop === '-' ? 1 : -1
  return (
    <group data-rig-scene="cyclotron-core">
      <ambientLight intensity={dark ? 0.72 : 0.95} />
      <directionalLight position={[3, 5, 8]} intensity={0.65} />
      <color attach="background" args={[dark ? '#101823' : '#f8f9fa']} />
      <Dee upper color={deeColor} />
      <Dee upper={false} color={deeColor} />
      <FieldMarks dark={dark} />
      <HalfOutline upper color={outline} />
      <HalfOutline upper={false} color={outline} />
      <Html position={[0, 2.55, 0.04]} center distanceFactor={8}>
        <span data-testid="dee-top-polarity" style={{ color: textColor, fontWeight: 900, fontSize: '24px' }}>{readings.polarityTop}</span>
      </Html>
      <Html position={[0, -2.85, 0.04]} center distanceFactor={8}>
        <span data-testid="dee-bottom-polarity" style={{ color: textColor, fontWeight: 900, fontSize: '24px' }}>{readings.polarityBottom}</span>
      </Html>
      <Html position={[0, 4.9, 0.04]} center distanceFactor={8}>
        <span style={{ color: textColor, fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap' }}>
          D 型电极 · Rmax=2.88 cm · B={B} T
        </span>
      </Html>
      <RfSupply dark={dark} topPolarity={readings.polarityTop} bottomPolarity={readings.polarityBottom} voltage={U} />
      <IonSource dark={dark} />
      {[-3.2, -2.1, -1, 0.1, 1.2, 2.3, 3.4].map((x) => (
        <GapArrow key={x} x={x} direction={electricFieldDirection} color="#4cc9f0" />
      ))}
      <Line points={path} color={particleColor} lineWidth={2.8} />
      {readings.extracted && exitStart && (
        <Line
          points={[[exitStart[0], exitStart[1], 0.2], [px, py, 0.2]]}
          color="#e63946"
          lineWidth={2.2}
        />
      )}
      <mesh position={[px, py, 0.39]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial color={particleColor} emissive={particleColor} emissiveIntensity={0.65} />
      </mesh>
      {readings.extracted && exitStart && (
        <Html position={[(exitStart[0] + px) / 2, (exitStart[1] + py) / 2, 0.02]} center distanceFactor={8}>
          <span style={{ color: '#e63946', fontWeight: 900, fontSize: '12px', whiteSpace: 'nowrap' }}>射出束流</span>
        </Html>
      )}
      <Html position={[-3.4, -4.95, 0.04]} center distanceFactor={8}>
        <span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>
          磁场指向纸内（×） · 轨迹为非相对论示意
        </span>
      </Html>
    </group>
  )
}
