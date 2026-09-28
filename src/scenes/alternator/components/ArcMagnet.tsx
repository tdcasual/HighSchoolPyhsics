import { Html } from '@react-three/drei/web/Html'
import { useEffect, useMemo } from 'react'
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

  useEffect(() => {
    return () => { geometry.dispose() }
  }, [geometry])

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

      <Html position={[-4.9, 0, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <span style={{ color: labelColor, fontSize: '22px', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}>
          {polarity}
        </span>
      </Html>
    </group>
  )
}
