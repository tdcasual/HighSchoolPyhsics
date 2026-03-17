import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

function SpringHelix({
  position,
  direction,
}: {
  position: [number, number, number]
  direction: 1 | -1
}) {
  const curve = useMemo(() => {
    const pts: Vector3[] = []
    const coils = 4
    const height = 0.3
    const radius = 0.05
    for (let i = 0; i <= coils * 20; i++) {
      const t = i / (coils * 20)
      const angle = t * coils * Math.PI * 2
      pts.push(
        new Vector3(
          radius * Math.cos(angle),
          t * height * direction,
          radius * Math.sin(angle),
        ),
      )
    }
    return new CatmullRomCurve3(pts)
  }, [direction])

  return (
    <mesh position={position}>
      <tubeGeometry args={[curve, 64, 0.012, 6, false]} />
      <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
    </mesh>
  )
}

export function Brushes() {
  return (
    <group name="brushes">
      {/* Brush pressing on slip-ring-front from above */}
      <group position={[0, 0.28, 1.8]}>
        <mesh name="brush-left">
          <boxGeometry args={[0.1, 0.3, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.1} roughness={0.8} />
        </mesh>
        <SpringHelix position={[0, 0.22, 0]} direction={1} />
      </group>
      {/* Brush pressing on slip-ring-back from below */}
      <group position={[0, -0.28, 2.1]}>
        <mesh name="brush-right">
          <boxGeometry args={[0.1, 0.3, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.1} roughness={0.8} />
        </mesh>
        <SpringHelix position={[0, -0.22, 0]} direction={-1} />
      </group>
    </group>
  )
}
