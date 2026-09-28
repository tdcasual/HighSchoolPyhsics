type CurrentIndicatorsProps = {
  currentA: number
}

function CurrentArrow({
  x,
  direction,
  opacity,
  name,
}: {
  x: number
  direction: 1 | -1
  opacity: number
  name: string
}) {
  return (
    <group
      name={name}
      position={[x, 0.28, 0.45]}
      rotation={[direction > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0]}
    >
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.48, 8]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={opacity} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <coneGeometry args={[0.16, 0.24, 8]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function CurrentIndicators({ currentA }: CurrentIndicatorsProps) {
  const opacity = Math.min(Math.abs(currentA) / 0.35, 1)
  const leftDirection: 1 | -1 = currentA >= 0 ? 1 : -1
  const rightDirection: 1 | -1 = leftDirection === 1 ? -1 : 1

  return (
    <group name="current-indicators">
      <CurrentArrow x={-2.5} direction={leftDirection} opacity={opacity} name="current-arrow-left" />
      <CurrentArrow x={2.5} direction={rightDirection} opacity={opacity} name="current-arrow-right" />
    </group>
  )
}
