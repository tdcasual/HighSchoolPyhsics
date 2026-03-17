import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { Shape } from 'three'

type ArcMagnetProps = {
  polarity: 'N' | 'S'
  position: [number, number, number]
}

function buildArcShape(side: 'left' | 'right') {
  const dir = side === 'left' ? 1 : -1
  const shape = new Shape()
  const innerR = 1.3
  const outerR = 1.7
  const arcHalf = (120 * Math.PI) / 360 // 60 degrees half-angle
  const steps = 24

  // Inner arc (concave face)
  for (let i = 0; i <= steps; i++) {
    const angle = -arcHalf + (2 * arcHalf * i) / steps
    const x = innerR * Math.sin(angle) * dir
    const y = innerR * Math.cos(angle)
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  // Outer arc (back face)
  for (let i = steps; i >= 0; i--) {
    const angle = -arcHalf + (2 * arcHalf * i) / steps
    const x = outerR * Math.sin(angle) * dir
    const y = outerR * Math.cos(angle)
    shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

export function ArcMagnet({ polarity, position }: ArcMagnetProps) {
  const side = polarity === 'S' ? 'left' : 'right'
  const arcShape = useMemo(() => buildArcShape(side), [side])
  const poleColor = polarity === 'N' ? '#8B1A1A' : '#1A3C8B'
  const yokeOffsetX = polarity === 'N' ? 0.85 : -0.85

  return (
    <group
      name={polarity === 'N' ? 'right-pole' : 'left-pole'}
      position={position}
    >
      {/* Yoke / backplate */}
      <mesh position={[yokeOffsetX, 0, 0]}>
        <boxGeometry args={[1.7, 2.6, 1.6]} />
        <meshStandardMaterial
          color="#6B6B6B"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Arc-shaped pole face */}
      <mesh position={[0, 0, -0.6]}>
        <extrudeGeometry
          args={[arcShape, { depth: 1.2, bevelEnabled: false }]}
        />
        <meshStandardMaterial
          color={poleColor}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0, 0.92]}
        color="#f7f8fa"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {polarity}
      </Text>
    </group>
  )
}
