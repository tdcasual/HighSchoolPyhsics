import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'

type ArcMagnetProps = {
  polarity: 'N' | 'S'
  position: [number, number, number]
  color: string
  labelColor: string
}

function buildTileShape() {
  const shape = new Shape()
  const innerRadius = 3.5
  const outerRadius = 4.8
  const angle = Math.PI / 3.5

  shape.absarc(0, 0, outerRadius, Math.PI - angle, Math.PI + angle, false)
  shape.absarc(0, 0, innerRadius, Math.PI + angle, Math.PI - angle, true)
  shape.closePath()
  return shape
}

export function ArcMagnet({ polarity, position, color, labelColor }: ArcMagnetProps) {
  const shape = useMemo(() => buildTileShape(), [])
  const geometry = useMemo(() => {
    const nextGeometry = new ExtrudeGeometry(shape, {
      depth: 7,
      curveSegments: 32,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      steps: 1,
    })
    nextGeometry.translate(0, 0, -3.5)
    return nextGeometry
  }, [shape])
  return (
    <group
      name={polarity === 'N' ? 'left-pole' : 'right-pole'}
      position={position}
      rotation={polarity === 'S' ? [0, Math.PI, 0] : [0, 0, 0]}
    >
      <mesh>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      <Text
        position={[-4.9, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        color={labelColor}
        fontSize={1.55}
        anchorX="center"
        anchorY="middle"
      >
        {polarity}
      </Text>
    </group>
  )
}
