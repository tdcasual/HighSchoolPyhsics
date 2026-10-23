import { UniformField } from '../../domains/electromagnetism/UniformField'
import { fieldGrid } from '../../domains/electromagnetism/fieldGrid'
import type { RotationalEmfScenario } from './model'
import { NO_FIT } from '../../scene3d/FitBounds'

export const ROTATIONAL_EMF_VISUAL_UNITS_PER_METER = 3.4
export const ROD_FIELD_SHAFT_LENGTH = 2.8
export const FRAME_FIELD_SHAFT_LENGTH = 5.4

type RotationalEmfRig3DProps = {
  scenario: RotationalEmfScenario
  angleRad: number
  effectiveLengthM: number
}

function RodScenario({ angleRad, effectiveLengthM }: { angleRad: number; effectiveLengthM: number }) {
  const scale = ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * effectiveLengthM
  const rodLength = scale
  const fieldOffsets = [-0.55, 0.55].map((ratio) => ratio * rodLength)

  return (
    <group data-rig-scenario="rod">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[Math.max(0.01, rodLength - 0.06 * scale), rodLength, 72]} />
        <meshBasicMaterial color="#476079" />
      </mesh>

      <UniformField
        points={fieldGrid(fieldOffsets, [0.095 * effectiveLengthM], fieldOffsets)}
        direction={[0, 1, 0]}
        length={(ROD_FIELD_SHAFT_LENGTH + 0.29) * effectiveLengthM}
        color="#62b0ff"
        headLength={0.26 * effectiveLengthM}
        headRadius={0.132 * effectiveLengthM}
        shaftRadius={0.04 * effectiveLengthM}
      />

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.14 * scale, 0.14 * scale, 0.42 * scale, 18]} />
        <meshStandardMaterial color="#5f6b7a" />
      </mesh>

      <group rotation={[0, angleRad, 0]}>
        <mesh position={[rodLength / 2, 0, 0]}>
          <boxGeometry args={[rodLength, 0.12 * scale, 0.12 * scale]} />
          <meshStandardMaterial color="#f0b64d" metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[rodLength, 0, 0]}>
          <sphereGeometry args={[0.12 * scale, 18, 18]} />
          <meshBasicMaterial color="#ff8c42" />
        </mesh>
      </group>
    </group>
  )
}

function FrameScenario({ angleRad, effectiveLengthM }: { angleRad: number; effectiveLengthM: number }) {
  const scale = ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * effectiveLengthM
  const frameWidth = scale
  const frameHeight = frameWidth
  const axisX = -frameWidth / 2
  const topY = frameHeight / 2
  const bottomY = -frameHeight / 2
  const fieldYs = [-0.75, 0.75].map((ratio) => ratio * frameHeight)
  const fieldZs = [-0.65, 0.65].map((ratio) => ratio * frameWidth)

  return (
    <group data-rig-scenario="frame">
      <UniformField
        points={fieldGrid([0.145 * effectiveLengthM], fieldYs, fieldZs)}
        direction={[1, 0, 0]}
        length={(FRAME_FIELD_SHAFT_LENGTH + 0.29) * effectiveLengthM}
        color="#7bb7ff"
        headLength={0.26 * effectiveLengthM}
        headRadius={0.132 * effectiveLengthM}
        shaftRadius={0.04 * effectiveLengthM}
      />

      <group position={[axisX, 0, 0]} rotation={[0, angleRad, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12 * effectiveLengthM, frameHeight, 0.12 * effectiveLengthM]} />
          <meshStandardMaterial color="#455465" />
        </mesh>
        <mesh position={[frameWidth, 0, 0]}>
          <boxGeometry args={[0.14 * effectiveLengthM, frameHeight, 0.14 * effectiveLengthM]} />
          <meshStandardMaterial color="#ff9a3c" />
        </mesh>
        <mesh position={[frameWidth / 2, topY, 0]}>
          <boxGeometry args={[frameWidth, 0.08 * effectiveLengthM, 0.08 * effectiveLengthM]} />
          <meshStandardMaterial color="#70d4a1" />
        </mesh>
        <mesh position={[frameWidth / 2, bottomY, 0]}>
          <boxGeometry args={[frameWidth, 0.08 * effectiveLengthM, 0.08 * effectiveLengthM]} />
          <meshStandardMaterial color="#70d4a1" />
        </mesh>
      </group>

      <mesh position={[axisX, 0, 0]}>
        <cylinderGeometry
          args={[0.16 * effectiveLengthM, 0.16 * effectiveLengthM, frameHeight + 0.35 * effectiveLengthM, 18]}
        />
        <meshStandardMaterial color="#2f3b49" />
      </mesh>
    </group>
  )
}

export function RotationalEmfRig3D({ scenario, angleRad, effectiveLengthM }: RotationalEmfRig3DProps) {
  return (
    <group>
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} />
      <pointLight position={[-4, 4, 3]} intensity={0.35} color="#b7d7ff" />
      <color attach="background" args={['#101821']} />
      <gridHelper
        args={[14 * ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * effectiveLengthM, 14, '#3c536a', '#1d2833']}
        position={[0, -1.1 * ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * effectiveLengthM, 0]}
        userData={NO_FIT}
      />

      {scenario === 'rod' ? (
        <RodScenario angleRad={angleRad} effectiveLengthM={effectiveLengthM} />
      ) : (
        <FrameScenario angleRad={angleRad} effectiveLengthM={effectiveLengthM} />
      )}
    </group>
  )
}
