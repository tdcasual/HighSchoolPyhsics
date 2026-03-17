type BearingMountProps = {
  position: [number, number, number]
}

export function BearingMount({ position }: BearingMountProps) {
  return (
    <group name="bearing-mount" position={position}>
      {/* Base plate */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Left upright */}
      <mesh position={[-0.25, -0.4, 0]}>
        <boxGeometry args={[0.12, 1.5, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Right upright */}
      <mesh position={[0.25, -0.4, 0]}>
        <boxGeometry args={[0.12, 1.5, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Top crossbar */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.62, 0.2, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Bearing ring */}
      <mesh position={[0, 0.35, 0]}>
        <torusGeometry args={[0.1, 0.03, 12, 24]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  )
}
