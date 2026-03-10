type ElectromagneticDriveRig3DProps = {
  magnetAngle: number
  frameAngle: number
}

export function ElectromagneticDriveRig3D({ magnetAngle, frameAngle }: ElectromagneticDriveRig3DProps) {
  const frameWidth = 2.2
  const frameHeight = 2.8
  const frameThickness = 0.12
  const poleOffset = 3

  return (
    <group>
      <ambientLight intensity={0.68} />
      <directionalLight position={[10, 20, 10]} intensity={1.02} />
      <color attach="background" args={['#d0d0d0']} />

      <group position={[-10.08, 0.16, 0]} scale={[0.94, 0.94, 0.94]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[12, 0.5, 8]} />
          <meshStandardMaterial color="#ff902d" roughness={0.6} />
        </mesh>

        <group>
          <mesh position={[-5, 4.25, 0]}>
            <boxGeometry args={[0.8, 8, 0.8]} />
            <meshStandardMaterial color="#ae7a3d" roughness={0.8} />
          </mesh>
          <mesh position={[5, 4.25, 0]}>
            <boxGeometry args={[0.8, 8, 0.8]} />
            <meshStandardMaterial color="#ae7a3d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 8.25, 0]}>
            <boxGeometry args={[11.6, 0.8, 0.8]} />
            <meshStandardMaterial color="#ae7a3d" roughness={0.8} />
          </mesh>
        </group>

        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 20]} />
          <meshStandardMaterial color="#ededed" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.8, 10]} />
          <meshStandardMaterial color="#737578" metalness={0.62} roughness={0.34} />
        </mesh>

        <group rotation={[0, frameAngle, 0]} position={[0, 3.2, 0]}>
          <mesh position={[0, frameHeight / 2, 0]}>
            <boxGeometry args={[frameWidth, frameThickness, frameThickness]} />
            <meshStandardMaterial color="#a8a8a8" metalness={0.42} roughness={0.3} />
          </mesh>
          <mesh position={[0, -frameHeight / 2, 0]}>
            <boxGeometry args={[frameWidth, frameThickness, frameThickness]} />
            <meshStandardMaterial color="#a8a8a8" metalness={0.42} roughness={0.3} />
          </mesh>
          <mesh position={[-frameWidth / 2, 0, 0]}>
            <boxGeometry args={[frameThickness, frameHeight, frameThickness]} />
            <meshStandardMaterial color="#a8a8a8" metalness={0.42} roughness={0.3} />
          </mesh>
          <mesh position={[frameWidth / 2, 0, 0]}>
            <boxGeometry args={[frameThickness, frameHeight, frameThickness]} />
            <meshStandardMaterial color="#a8a8a8" metalness={0.42} roughness={0.3} />
          </mesh>
        </group>

        <group rotation={[0, magnetAngle, 0]} position={[0, 7, 0]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 4, 18]} />
            <meshStandardMaterial color="#66696d" metalness={0.62} roughness={0.34} />
          </mesh>
          <mesh>
            <boxGeometry args={[7.5, 1, 1.5]} />
            <meshStandardMaterial color="#494c50" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[-poleOffset, -2.5, 0]}>
            <boxGeometry args={[1.5, 4, 1.5]} />
            <meshPhongMaterial color="#e54453" shininess={82} />
          </mesh>
          <mesh position={[poleOffset, -2.5, 0]}>
            <boxGeometry args={[1.5, 4, 1.5]} />
            <meshPhongMaterial color="#264b82" shininess={82} />
          </mesh>
        </group>

        <group rotation={[0, magnetAngle, 0]} position={[0, 8.65, 0]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.5, 16]} />
            <meshStandardMaterial color="#66696d" metalness={0.62} roughness={0.34} />
          </mesh>
          <mesh position={[0.8, 1.5, 0]}>
            <boxGeometry args={[2, 0.2, 0.4]} />
            <meshStandardMaterial color="#66696d" metalness={0.62} roughness={0.34} />
          </mesh>
          <mesh position={[1.6, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
            <meshStandardMaterial color="#b6864a" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
