type CurrentIndicatorsProps = {
  angleRad: number
}

export function CurrentIndicators({ angleRad }: CurrentIndicatorsProps) {
  const sinAngle = Math.sin(angleRad)
  const direction = sinAngle >= 0 ? 1 : -1
  const opacity = Math.min(Math.abs(sinAngle) * 2, 1)

  return (
    <group name="current-indicators">
      {/* Arrow on AB edge (front, -X side) */}
      <group
        position={[-0.53, 0, 0]}
        rotation={[0, 0, direction > 0 ? 0 : Math.PI]}
      >
        <mesh>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={opacity} />
        </mesh>
      </group>
      {/* Arrow on CD edge (back, +X side) */}
      <group
        position={[0.53, 0, 0]}
        rotation={[0, 0, direction > 0 ? Math.PI : 0]}
      >
        <mesh>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={opacity} />
        </mesh>
      </group>
    </group>
  )
}
