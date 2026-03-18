export function Brushes({ color }: { color: string }) {
  return (
    <group name="brushes">
      <mesh name="brush-left" position={[0, -1.25, 2.5]}>
        <boxGeometry args={[0.8, 0.3, 0.6]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>

      <mesh name="brush-right" position={[0, -1.25, 5.0]}>
        <boxGeometry args={[0.8, 0.3, 0.6]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0.1} />
      </mesh>
    </group>
  )
}
