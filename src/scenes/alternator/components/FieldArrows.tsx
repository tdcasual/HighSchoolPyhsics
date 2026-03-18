function DashedSegment({
  position,
  length,
  color,
}: {
  position: [number, number, number]
  length: number
  color: string
}) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.028, 0.028, length, 6]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

export function FieldArrows({ color }: { color: string }) {
  const rows: [number, number][] = []
  for (let y = -1.5; y <= 1.5; y += 1.5) {
    for (let z = -5; z <= 0; z += 1.5) {
      rows.push([y, z])
    }
  }

  return (
    <group name="field-lines">
      {rows.map(([y, z], rowIndex) =>
        Array.from({ length: 10 }, (_, segmentIndex) => {
          const startX = -3.15 + segmentIndex * 0.72
          return (
            <DashedSegment
              key={`${rowIndex}-${segmentIndex}`}
              position={[startX, y, z]}
              length={0.34}
              color={color}
            />
          )
        }),
      )}
    </group>
  )
}
