function FieldArrow({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 2.0, 10]} />
        <meshBasicMaterial color="#7cd8ff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -1.1, 0]}>
        <coneGeometry args={[0.07, 0.2, 10]} />
        <meshBasicMaterial color="#7cd8ff" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export function FieldArrows() {
  const positions: [number, number, number][] = []
  for (const y of [-0.6, 0, 0.6]) {
    for (const z of [-0.3, 0, 0.3]) {
      positions.push([0, y, z])
    }
  }

  return (
    <group name="field-arrows">
      {positions.map((pos, i) => (
        <FieldArrow key={i} position={pos} />
      ))}
    </group>
  )
}
