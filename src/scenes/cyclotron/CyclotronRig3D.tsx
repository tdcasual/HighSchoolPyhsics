import { Line } from '../../scene3d/ClassroomLine'
import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import { DEE_RADIUS, DEE_THICKNESS, SCENE_Y, TRAJECTORY_Y, type Point3 } from './layout'
import { SAMPLES_PER_TURN } from './run'

const RECENT_TRAIL_POINTS = SAMPLES_PER_TURN
import {
  DEE_LABEL_Y,
  INFO_LABEL_Y,
  POWER_FEED_LEFT_PATH,
  POWER_FEED_RIGHT_PATH,
  POWER_FEED_TERMINALS,
  POWER_FEED_TEXT_POSITION,
} from './view'

const GUIDE_RADII = [0.55, 0.95, 1.35, 1.75, 2.1]

function CyclotronLabel({
  position,
  color,
  fontSize,
  children,
}: {
  position: Point3
  color: string
  fontSize: number
  children: string
}) {
  return (
    <Html position={position} center>
      <span
        style={{
          color,
          fontSize: `${Math.max(10, Math.round(fontSize * 64))}px`,
          fontWeight: 700,
          lineHeight: 1,
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </Html>
  )
}
function buildCircle(radius: number, y: number, segments = 120): Point3[] {
  const points: Point3[] = []
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    points.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius])
  }
  return points
}

type FieldArrowProps = {
  x: number
  z: number
}

function FieldArrow({ x, z }: FieldArrowProps) {
  return (
    <group position={[x, 1.2, z]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 12]} />
        <meshBasicMaterial color="#2ca6bf" transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.18, 14]} />
        <meshBasicMaterial color="#1f96b0" transparent opacity={0.92} />
      </mesh>
    </group>
  )
}

type CyclotronRig3DProps = {
  trailPoints: Point3[]
  particlePoint: Point3
  phase: number
  running: boolean
  voltageSign: number
  particleInGap: boolean
  deeGapWidth: number
}

export function CyclotronRig3D({
  trailPoints,
  particlePoint,
  phase,
  running,
  voltageSign,
  particleInGap,
  deeGapWidth,
}: CyclotronRig3DProps) {
  const guideRings = useMemo(() => GUIDE_RADII.map((radius) => buildCircle(radius, TRAJECTORY_Y - 0.006)), [])
  const fieldArrows = useMemo(
    () => [
      [-1.9, -1.5],
      [-1.9, 0],
      [-1.9, 1.5],
      [0, -1.9],
      [0, 1.9],
      [1.9, -1.5],
      [1.9, 0],
      [1.9, 1.5],
    ],
    [],
  )
  const gapArrows = useMemo(() => [-1.68, -1.12, -0.56, 0, 0.56, 1.12, 1.68], [])

  const animationPulse = running ? 0.5 + 0.5 * Math.sin(phase * Math.PI * 2) : 0.1
  const rfMagnitude = Math.abs(Math.cos(phase * Math.PI * 2))
  const normalizedSign = voltageSign >= 0 ? 1 : -1
  const gapMainColor = normalizedSign > 0 ? '#ef7575' : '#5ba0d6'
  const gapAltColor = normalizedSign > 0 ? '#fdece4' : '#dceefb'
  const directionLabel = normalizedSign > 0 ? 'E: D1 to D2' : 'E: D2 to D1'
  const directionColor = gapMainColor
  const gapOpacity = 0.08 + rfMagnitude * 0.22 + (particleInGap ? 0.12 : 0)
  const gapFieldOpacity = 0.1 + rfMagnitude * 0.56 + (particleInGap ? 0.12 : 0)
  const particleGlow = running ? 0.3 + animationPulse * 0.55 : 0.2
  const gapHalf = deeGapWidth / 2
  const gapLength = DEE_RADIUS * 1.95
  const gapArrowLength = Math.max(0.1, deeGapWidth * 0.78)
  const gapArrowShaftLength = Math.max(0.01, gapArrowLength - 0.09)

  return (
    <group>
      <ambientLight intensity={0.72} />
      <directionalLight position={[3.8, 4.6, 2.6]} intensity={1} />
      <pointLight position={[0, 2.1, 0]} intensity={0.68} color="#ffe4c2" />

      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[2.72, 2.78, 0.34, 96]} />
        <meshStandardMaterial color="#f0c89b" roughness={0.68} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[2.56, 2.64, 0.1, 96]} />
        <meshStandardMaterial color="#f8dab8" roughness={0.58} metalness={0.08} />
      </mesh>

      <mesh position={[deeGapWidth / 2, SCENE_Y, 0]}>
        <cylinderGeometry args={[DEE_RADIUS, DEE_RADIUS, DEE_THICKNESS, 96, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#dcae7f" roughness={0.42} metalness={0.28} />
      </mesh>
      <mesh position={[-deeGapWidth / 2, SCENE_Y, 0]}>
        <cylinderGeometry args={[DEE_RADIUS, DEE_RADIUS, DEE_THICKNESS, 96, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#e4b989" roughness={0.42} metalness={0.28} />
      </mesh>

      <mesh position={[0, SCENE_Y - 0.05, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.1, 48]} />
        <meshStandardMaterial color="#f3cfaa" roughness={0.68} metalness={0.06} />
      </mesh>

      <mesh position={[gapHalf, SCENE_Y + 0.008, 0]}>
        <boxGeometry args={[0.02, DEE_THICKNESS + 0.018, gapLength]} />
        <meshStandardMaterial color="#7d5530" metalness={0.12} roughness={0.42} />
      </mesh>
      <mesh position={[-gapHalf, SCENE_Y + 0.008, 0]}>
        <boxGeometry args={[0.02, DEE_THICKNESS + 0.018, gapLength]} />
        <meshStandardMaterial color="#7d5530" metalness={0.12} roughness={0.42} />
      </mesh>

      <mesh position={[0, TRAJECTORY_Y - 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[deeGapWidth * 0.94, gapLength]} />
        <meshBasicMaterial color={gapMainColor} transparent opacity={gapOpacity} />
      </mesh>
      <mesh position={[0, TRAJECTORY_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[deeGapWidth * 0.76, gapLength * 0.97]} />
        <meshBasicMaterial color={gapAltColor} transparent opacity={gapFieldOpacity} />
      </mesh>
      <Line
        points={[[0, TRAJECTORY_Y + 0.002, -gapLength / 2], [0, TRAJECTORY_Y + 0.002, gapLength / 2]]}
        color={gapMainColor}
        lineWidth={1.4}
        transparent
        opacity={0.58}
      />

      {gapArrows.map((z, index) => (
        <group
          key={`gap-arrow-${index}`}
          position={[normalizedSign > 0 ? -gapArrowLength / 2 : gapArrowLength / 2, TRAJECTORY_Y + 0.024, z]}
          rotation={[0, normalizedSign > 0 ? 0 : Math.PI, 0]}
        >
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, gapArrowShaftLength, 12]} />
            <meshBasicMaterial color={gapMainColor} transparent opacity={0.18 + rfMagnitude * 0.76} />
          </mesh>
          <mesh position={[gapArrowLength / 2 - 0.045, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.036, 0.09, 14]} />
            <meshBasicMaterial color={gapMainColor} transparent opacity={0.22 + rfMagnitude * 0.72} />
          </mesh>
        </group>
      ))}

      <mesh position={[-2.58, SCENE_Y + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.58, 10]} />
        <meshStandardMaterial color="#f15b6c" metalness={0.22} roughness={0.48} />
      </mesh>

      {guideRings.map((points, index) => (
        <Line
          key={`guide-${index}`}
          points={points}
          color="#de9f68"
          lineWidth={index % 2 === 0 ? 1.6 : 1.2}
          transparent
          opacity={0.42}
        />
      ))}

      {trailPoints.length > 1 ? (
        <>
          {/* A textbook-scale run makes ~40 turns: the whole spiral stays faint so it does not
              merge into a disc, and the latest turn is drawn bold. */}
          <Line points={trailPoints} color="#7a3016" lineWidth={1.1} transparent opacity={0.45} />
          {trailPoints.length > RECENT_TRAIL_POINTS ? (
            <Line points={trailPoints.slice(-RECENT_TRAIL_POINTS)} color="#7a3016" lineWidth={3.2} transparent opacity={0.95} />
          ) : null}
        </>
      ) : null}

      <mesh position={particlePoint}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#2c6b97"
          emissive="#9ed8ff"
          emissiveIntensity={particleGlow}
          metalness={0.3}
          roughness={0.18}
        />
      </mesh>

      {fieldArrows.map(([x, z], index) => (
        <FieldArrow key={`field-${index}`} x={x} z={z} />
      ))}

      <CyclotronLabel position={[0, INFO_LABEL_Y, -2.3]} color="#1c6583" fontSize={0.28}>
        B
      </CyclotronLabel>
      <CyclotronLabel position={[-1.22, DEE_LABEL_Y, 0.8]} color="#5f3a20" fontSize={0.18}>
        D1
      </CyclotronLabel>
      <CyclotronLabel position={[1.2, DEE_LABEL_Y, 0.8]} color="#5f3a20" fontSize={0.18}>
        D2
      </CyclotronLabel>
      <CyclotronLabel position={[0, INFO_LABEL_Y, -2.02]} color={directionColor} fontSize={0.15}>
        {directionLabel}
      </CyclotronLabel>

      <Line points={POWER_FEED_LEFT_PATH} color="#26394d" lineWidth={2} />
      <Line points={POWER_FEED_RIGHT_PATH} color="#26394d" lineWidth={2} />
      <mesh position={POWER_FEED_TERMINALS[0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#f8fafb" metalness={0.16} roughness={0.44} />
      </mesh>
      <mesh position={POWER_FEED_TERMINALS[1]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#f8fafb" metalness={0.16} roughness={0.44} />
      </mesh>
      <CyclotronLabel position={POWER_FEED_TEXT_POSITION} color="#2a4058" fontSize={0.14}>
        U~
      </CyclotronLabel>
    </group>
  )
}
