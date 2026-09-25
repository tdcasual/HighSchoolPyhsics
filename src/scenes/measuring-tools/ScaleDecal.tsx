import { usePaintedTexture, type ScalePaint } from './usePaintedTexture'

export function ScaleDecal({
  width,
  height,
  plane,
  position,
  paint,
  wrapT = false,
  rotation,
}: {
  width: number
  height: number
  plane: [number, number]
  position: [number, number, number]
  paint: ScalePaint
  wrapT?: boolean
  rotation?: [number, number, number]
}) {
  const texture = usePaintedTexture(width, height, paint, wrapT)
  return (
    <mesh position={position} rotation={rotation} castShadow={false} receiveShadow={false}>
      <planeGeometry args={plane} />
      <meshStandardMaterial
        map={texture}
        color="#ffffff"
        metalness={0.15}
        roughness={0.55}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}
