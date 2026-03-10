import type { RotationalEmfScenario } from './model'

export const ROD_FIELD_SHAFT_LENGTH = 2.8
export const FRAME_FIELD_SHAFT_LENGTH = 5.4

type RotationalEmfRig3DProps = {
  scenario: RotationalEmfScenario
  angleRad: number
}

type FieldArrowProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
  color: string
  shaftLength?: number
  shaftRadius?: number
}

function FieldArrow({
  position,
  rotation = [0, 0, 0],
  color,
  shaftLength = 1.8,
  shaftRadius = 0.035,
}: FieldArrowProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, shaftLength / 2 + 0.16, 0]}>
        <coneGeometry args={[shaftRadius * 3.3, 0.26, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function RodScenario({ angleRad }: { angleRad: number }) {
  return (
    <group data-rig-scenario="rod">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.92, 0]}>
        <ringGeometry args={[1.85, 1.9, 72]} />
        <meshBasicMaterial color="#476079" />
      </mesh>

      {[-2.5, -1, 0.5, 2].flatMap((x) =>
        [-2.5, -1, 0.5, 2].map((z) => (
          <FieldArrow
            key={`rod-field-${x}-${z}`}
            position={[x, -0.05, z]}
            color="#62b0ff"
            shaftLength={ROD_FIELD_SHAFT_LENGTH}
            shaftRadius={0.04}
          />
        )),
      )}

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.42, 18]} />
        <meshStandardMaterial color="#5f6b7a" />
      </mesh>

      <group rotation={[0, angleRad, 0]}>
        <mesh position={[1.7, 0, 0]}>
          <boxGeometry args={[3.4, 0.12, 0.12]} />
          <meshStandardMaterial color="#f0b64d" metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[3.4, 0, 0]}>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshBasicMaterial color="#ff8c42" />
        </mesh>
      </group>
    </group>
  )
}

function FrameScenario({ angleRad }: { angleRad: number }) {
  const frameWidth = 2.8
  const frameHeight = 2.6
  const axisX = -1.4
  const topY = frameHeight / 2
  const bottomY = -frameHeight / 2

  return (
    <group data-rig-scenario="frame">
      {[-1.7, -0.6, 0.6, 1.7].flatMap((y) =>
        [-3.2, -1.4, 0, 1.4, 3.2].map((z) => (
          <FieldArrow
            key={`frame-field-${y}-${z}`}
            position={[-0.8, y, z]}
            rotation={[0, 0, -Math.PI / 2]}
            color="#7bb7ff"
            shaftLength={FRAME_FIELD_SHAFT_LENGTH}
            shaftRadius={0.04}
          />
        )),
      )}

      <group position={[axisX, 0, 0]} rotation={[0, angleRad, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, frameHeight, 0.12]} />
          <meshStandardMaterial color="#455465" />
        </mesh>
        <mesh position={[frameWidth, 0, 0]}>
          <boxGeometry args={[0.14, frameHeight, 0.14]} />
          <meshStandardMaterial color="#ff9a3c" />
        </mesh>
        <mesh position={[frameWidth / 2, topY, 0]}>
          <boxGeometry args={[frameWidth, 0.08, 0.08]} />
          <meshStandardMaterial color="#70d4a1" />
        </mesh>
        <mesh position={[frameWidth / 2, bottomY, 0]}>
          <boxGeometry args={[frameWidth, 0.08, 0.08]} />
          <meshStandardMaterial color="#70d4a1" />
        </mesh>
      </group>

      <mesh position={[axisX, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, frameHeight + 0.35, 18]} />
        <meshStandardMaterial color="#2f3b49" />
      </mesh>
    </group>
  )
}

export function RotationalEmfRig3D({ scenario, angleRad }: RotationalEmfRig3DProps) {
  return (
    <group>
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} />
      <pointLight position={[-4, 4, 3]} intensity={0.35} color="#b7d7ff" />
      <color attach="background" args={['#101821']} />
      <gridHelper args={[14, 14, '#3c536a', '#1d2833']} position={[0, -1.1, 0]} />

      {scenario === 'rod' ? <RodScenario angleRad={angleRad} /> : <FrameScenario angleRad={angleRad} />}
    </group>
  )
}
