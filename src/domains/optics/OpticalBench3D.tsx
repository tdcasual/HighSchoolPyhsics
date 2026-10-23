import { MAT_BLACK_PLASTIC, MAT_METAL, type OpticalStage } from './opticalStage'

/** Background, fog and the key light of a darkened optics lab; `ambient` is [with shadows, without]. */
export function OpticalStageLighting({
  stage,
  ambient = [0.4, 0.6],
}: {
  stage: OpticalStage
  ambient?: [number, number]
}) {
  return (
    <>
      <color attach="background" args={[stage.background]} />
      <fog attach="fog" args={[stage.background, 20, 80]} />
      <ambientLight intensity={stage.shadowsEnabled ? ambient[0] : ambient[1]} />
      <directionalLight
        position={[5, 20, 15]}
        intensity={0.8}
        castShadow={stage.shadowsEnabled}
        shadow-mapSize-width={stage.perf.shadowMapSize ?? 1024}
        shadow-mapSize-height={stage.perf.shadowMapSize ?? 1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
    </>
  )
}

/** A rider on the optical rail: post, base block and locking knob. */
export function Stand({
  xPos,
  height = 3.5,
  radialSegments = 16,
}: {
  xPos: number
  height?: number
  radialSegments?: number
}) {
  return (
    <group position={[xPos, 0, 0]}>
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, height, radialSegments]} />
        <meshStandardMaterial {...MAT_METAL} />
        <mesh position={[0, -height / 2 + 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.4, 2]} />
          <meshStandardMaterial {...MAT_METAL} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.5, 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.4, radialSegments]} />
          <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
        </mesh>
      </mesh>
    </group>
  )
}
