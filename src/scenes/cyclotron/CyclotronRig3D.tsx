import { Line } from '@react-three/drei/core/Line'
import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { DEE_THICKNESS, SCENE_Y, TRAJECTORY_Y, type Point3 } from './layout'
import {
  DEE_LABEL_Y,
  INFO_LABEL_Y,
  POWER_FEED_LEFT_PATH,
  POWER_FEED_RIGHT_PATH,
  POWER_FEED_TERMINALS,
  POWER_FEED_TEXT_POSITION,
} from './view'

const GUIDE_RADII = [0.55, 0.95, 1.35, 1.75, 2.1]
const DEE_RADIUS = 2.16

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
  pulse: number
}

function FieldArrow({ x, z, pulse }: FieldArrowProps) {
  return (
    <group position={[x, 1.2 + pulse * 0.02, z]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 12]} />
        <meshBasicMaterial color="#2ca6bf" transparent opacity={0.72 + pulse * 0.2} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.18, 14]} />
        <meshBasicMaterial color="#1f96b0" transparent opacity={0.88} />
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

  const pulse = running ? 0.5 + 0.5 * Math.sin(phase * Math.PI * 2) : 0.1
  const normalizedSign = voltageSign >= 0 ? 1 : -1
  const gapMainColor = normalizedSign > 0 ? '#ef7575' : '#5ba0d6'
  const gapAltColor = normalizedSign > 0 ? '#fdece4' : '#dceefb'
  const directionLabel = normalizedSign > 0 ? 'E: D1→D2' : 'E: D2→D1'
  const directionColor = gapMainColor
  const gapOpacity = 0.1 + pulse * 0.22 + (particleInGap ? 0.2 : 0)
  const gapFieldOpacity = 0.32 + pulse * 0.44 + (particleInGap ? 0.24 : 0)
  const particleGlow = running ? 0.3 + pulse * 0.55 : 0.2
  const gapHalf = deeGapWidth / 2
  const gapLength = DEE_RADIUS * 1.95
  const gapArrowLength = Math.max(0.1, deeGapWidth * 0.78)

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
        <cylinderGeometry args={[DEE_RADIUS, DEE_RADIUS, DEE_THICKNESS, 96, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#dcae7f" roughness={0.42} metalness={0.28} />
      </mesh>
      <mesh position={[-deeGapWidth / 2, SCENE_Y, 0]}>
        <cylinderGeometry args={[DEE_RADIUS, DEE_RADIUS, DEE_THICKNESS, 96, 1, false, Math.PI, Math.PI]} />
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
          position={[0, TRAJECTORY_Y + 0.024, z]}
          rotation={[0, normalizedSign > 0 ? 0 : Math.PI, 0]}
        >
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, gapArrowLength, 12]} />
            <meshBasicMaterial color={gapMainColor} transparent opacity={0.76 + pulse * 0.22} />
          </mesh>
          <mesh position={[gapHalf * 0.38, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.036, 0.09, 14]} />
            <meshBasicMaterial color={gapMainColor} transparent opacity={0.9} />
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
        <Line points={trailPoints} color="#7a3016" lineWidth={3.4} transparent opacity={0.95} />
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
        <FieldArrow key={`field-${index}`} x={x} z={z} pulse={pulse} />
      ))}

      <Text
        position={[0, INFO_LABEL_Y, -2.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#1c6583"
        fontSize={0.28}
        anchorX="center"
        anchorY="middle"
      >
        B
      </Text>
      <Text
        position={[-1.22, DEE_LABEL_Y, 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#5f3a20"
        fontSize={0.18}
        anchorX="center"
        anchorY="middle"
      >
        D1
      </Text>
      <Text
        position={[1.2, DEE_LABEL_Y, 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#5f3a20"
        fontSize={0.18}
        anchorX="center"
        anchorY="middle"
      >
        D2
      </Text>
      <Text
        position={[0, INFO_LABEL_Y, -2.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        color={directionColor}
        fontSize={0.15}
        anchorX="center"
        anchorY="middle"
      >
        {directionLabel}
      </Text>

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
      <Text
        position={POWER_FEED_TEXT_POSITION}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#2a4058"
        fontSize={0.14}
        anchorX="center"
        anchorY="middle"
      >
        U~
      </Text>
    </group>
  )
}
