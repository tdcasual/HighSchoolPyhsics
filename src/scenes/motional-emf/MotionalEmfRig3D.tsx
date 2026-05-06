import { useMemo } from 'react'
import { CatmullRomCurve3, Euler, Quaternion, TubeGeometry, Vector3 } from 'three'
import { MOTIONAL_EMF_LAYOUT, type Vec3 } from './layout'
import {
  resolveInducedCurrentDirection,
  resolveRodContactOffsets,
  resolveRodVector,
  resolveTeachingVectorAnchors,
  resolveVelocityDirection,
  resolveWireCurvePoints,
  type DiscussionMode,
  type MagneticFieldDirection,
  type MotionOffset,
  type MotionDirectionPreset,
  type RodVelocityAnglePreset,
  type VelocityPreset,
} from './model'

type MotionalEmfRig3DProps = {
  motionOffset: MotionOffset
  rodLengthM: number
  rodAngleDeg: number
  discussionMode: DiscussionMode
  velocityPreset: VelocityPreset
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
  magneticFieldDirection: MagneticFieldDirection
  currentActive: boolean
  needleAngleRad: number
}

const BASE_PHYSICAL_ROD_LENGTH_M = 0.5
const MIN_VISUAL_ROD_LENGTH = 1.4
const MAX_VISUAL_ROD_LENGTH = 4.8
const WIRE_RADIUS = 0.048

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2])
  if (length < 1e-8) {
    return [0, 0, 0]
  }
  return [v[0] / length, v[1] / length, v[2] / length]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function rotateFromYAxis(direction: Vec3): [number, number, number] {
  const target = new Vector3(direction[0], direction[1], direction[2]).normalize()
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), target)
  const euler = new Euler().setFromQuaternion(quaternion)
  return [euler.x, euler.y, euler.z]
}

function Arrow3D({
  anchor,
  direction,
  color,
  length,
  shaftRadius = 0.032,
  headRadius = 0.09,
  opacity = 0.85,
}: {
  anchor: Vec3
  direction: Vec3
  color: string
  length: number
  shaftRadius?: number
  headRadius?: number
  opacity?: number
}) {
  const normalized = normalize(direction)
  if (Math.hypot(normalized[0], normalized[1], normalized[2]) < 1e-8 || length <= 0) {
    return null
  }

  const rotation = rotateFromYAxis(normalized)

  return (
    <group position={anchor} rotation={rotation}>
      <mesh position={[0, length * 0.3, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, length * 0.6, 10]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, length * 0.68, 0]}>
        <coneGeometry args={[headRadius, length * 0.24, 12]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

function resolveVisualRodLength(rodLengthM: number): number {
  const scaled = (rodLengthM / BASE_PHYSICAL_ROD_LENGTH_M) * MOTIONAL_EMF_LAYOUT.rod.size[0]
  return clamp(scaled, MIN_VISUAL_ROD_LENGTH, MAX_VISUAL_ROD_LENGTH)
}

function createCurve(points: Vec3[]): CatmullRomCurve3 {
  return new CatmullRomCurve3(points.map((point) => new Vector3(point[0], point[1], point[2])), false, 'catmullrom', 0.5)
}

export function MotionalEmfRig3D({
  motionOffset,
  rodLengthM,
  rodAngleDeg,
  discussionMode,
  velocityPreset,
  rodVelocityAngleDeg,
  motionDirection,
  magneticFieldDirection,
  currentActive,
  needleAngleRad,
}: MotionalEmfRig3DProps) {
  const velocityDirectionVector = resolveVelocityDirection({
    discussionMode,
    velocityPreset,
    magneticFieldDirection,
    rodAngleDeg,
    rodVelocityAngleDeg,
    motionDirection,
  })
  const velocityDirection = normalize([
    velocityDirectionVector.x,
    velocityDirectionVector.y,
    velocityDirectionVector.z,
  ])
  const currentDirection = resolveInducedCurrentDirection({
    rodAngleDeg,
    discussionMode,
    velocityPreset,
    rodVelocityAngleDeg,
    motionDirection,
    magneticFieldDirection,
    activeMotion: currentActive,
  })
  const rodVector = resolveRodVector(1, rodAngleDeg)
  const rodDirection = normalize([rodVector.x, rodVector.y, rodVector.z])
  const visualRodLength = resolveVisualRodLength(rodLengthM)
  const contactOffsets = resolveRodContactOffsets({ visualRodLength, rodAngleDeg })

  const rodCenter = add(MOTIONAL_EMF_LAYOUT.rod.center, motionOffset)
  const leftContact = add(rodCenter, contactOffsets.left)
  const rightContact = add(rodCenter, contactOffsets.right)
  const rodRotationZ = Math.atan2(rodDirection[1], rodDirection[0])
  const vectorAnchors = resolveTeachingVectorAnchors(rodCenter)

  const wireAPoints = useMemo<Vec3[]>(
    () => resolveWireCurvePoints({ start: leftContact, end: MOTIONAL_EMF_LAYOUT.wires.aLeadEnd, side: 'left' }),
    [leftContact],
  )
  const wireBPoints = useMemo<Vec3[]>(
    () => resolveWireCurvePoints({ start: rightContact, end: MOTIONAL_EMF_LAYOUT.wires.bLeadEnd, side: 'right' }),
    [rightContact],
  )

  const wireACurve = useMemo(() => createCurve(wireAPoints), [wireAPoints])
  const wireBCurve = useMemo(() => createCurve(wireBPoints), [wireBPoints])

  const wireGeoA = useMemo(
    () => new TubeGeometry(wireACurve, 42, WIRE_RADIUS, 12, false),
    [wireACurve],
  )
  const wireGeoB = useMemo(
    () => new TubeGeometry(wireBCurve, 42, WIRE_RADIUS, 12, false),
    [wireBCurve],
  )

  return (
    <group>
      <ambientLight intensity={0.68} />
      <directionalLight position={[6, 8, 5]} intensity={1.05} />
      <pointLight position={[0, 6, 4]} intensity={0.35} color="#c8e6ff" />
      <color attach="background" args={['#0f1620']} />

      <gridHelper args={[18, 18, '#405468', '#22303c']} position={[0, -1.4, 0]} />

      {MOTIONAL_EMF_LAYOUT.field.lineZs.map((z) => (
        <group key={`field-line-${z}`} position={[0, 1, z]}>
          {MOTIONAL_EMF_LAYOUT.field.lineXs.map((x) => {
            const fieldArrowSign = magneticFieldDirection === 'up' ? 1 : -1
            const arrowOffsetY = fieldArrowSign * (
              MOTIONAL_EMF_LAYOUT.field.lineLengthY / 2 + MOTIONAL_EMF_LAYOUT.field.arrowHeadLength * 0.42
            )
            const arrowRotation: [number, number, number] = fieldArrowSign === 1 ? [0, 0, 0] : [Math.PI, 0, 0]

            return (
              <group key={`field-column-${z}-${x}`} position={[x, 0, 0]}>
                <mesh>
                  <cylinderGeometry
                    args={[MOTIONAL_EMF_LAYOUT.field.lineRadius, MOTIONAL_EMF_LAYOUT.field.lineRadius, MOTIONAL_EMF_LAYOUT.field.lineLengthY, 8]}
                  />
                  <meshBasicMaterial color="#62b0ff" />
                </mesh>
                <mesh position={[0, arrowOffsetY, 0]} rotation={arrowRotation}>
                  <coneGeometry
                    args={[
                      MOTIONAL_EMF_LAYOUT.field.arrowHeadRadius,
                      MOTIONAL_EMF_LAYOUT.field.arrowHeadLength,
                      12,
                    ]}
                  />
                  <meshBasicMaterial color="#62b0ff" />
                </mesh>
              </group>
            )
          })}
        </group>
      ))}

      <mesh geometry={wireGeoA}>
        <meshStandardMaterial color="#cf4b42" metalness={0.12} roughness={0.82} />
      </mesh>
      <mesh geometry={wireGeoB}>
        <meshStandardMaterial color="#1f2328" metalness={0.16} roughness={0.8} />
      </mesh>

      <mesh position={rodCenter} rotation={[0, 0, rodRotationZ]}>
        <boxGeometry args={[visualRodLength, MOTIONAL_EMF_LAYOUT.rod.size[1], MOTIONAL_EMF_LAYOUT.rod.size[2]]} />
        <meshStandardMaterial color="#f1b24a" metalness={0.44} roughness={0.28} />
      </mesh>

      <mesh position={leftContact}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshBasicMaterial color="#df4036" />
      </mesh>
      <mesh position={rightContact}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshBasicMaterial color="#101010" />
      </mesh>

      <Arrow3D
        anchor={vectorAnchors.velocity}
        direction={velocityDirection}
        color="#ff9a3c"
        length={1.48}
        opacity={0.78}
      />
      <Arrow3D
        anchor={vectorAnchors.current}
        direction={currentDirection}
        color="#7bcf82"
        length={1.36}
        opacity={0.75}
      />

      <group position={MOTIONAL_EMF_LAYOUT.meter.center} rotation={[0, MOTIONAL_EMF_LAYOUT.meter.rotationY, 0]}>
        <mesh>
          <boxGeometry args={MOTIONAL_EMF_LAYOUT.meter.bodySize} />
          <meshStandardMaterial color="#505963" metalness={0.12} roughness={0.76} />
        </mesh>
        <mesh position={[0, 0, MOTIONAL_EMF_LAYOUT.meter.bodySize[2] / 2 + 0.01]}>
          <ringGeometry
            args={[MOTIONAL_EMF_LAYOUT.meter.bezelInnerRadius, MOTIONAL_EMF_LAYOUT.meter.bezelOuterRadius, 40]}
          />
          <meshStandardMaterial color="#bcc6cf" metalness={0.18} roughness={0.42} side={2} />
        </mesh>
        <mesh position={[0, 0, MOTIONAL_EMF_LAYOUT.meter.bodySize[2] / 2 + 0.005]}>
          <circleGeometry args={[MOTIONAL_EMF_LAYOUT.meter.faceRadius, 40]} />
          <meshBasicMaterial color="#ffffff" side={2} />
        </mesh>
        {Array.from({ length: 11 }, (_, index) => index - 5).map((value) => {
          const angle = -value * (Math.PI / 12)
          return (
            <mesh
              key={`tick-${value}`}
              position={[
                Math.sin(angle) * MOTIONAL_EMF_LAYOUT.meter.tickRadius,
                Math.cos(angle) * MOTIONAL_EMF_LAYOUT.meter.tickRadius - 0.1,
                MOTIONAL_EMF_LAYOUT.meter.bodySize[2] / 2 + 0.025,
              ]}
              rotation={[0, 0, -angle]}
            >
              <boxGeometry args={[0.05, 0.26, 0.01]} />
              <meshBasicMaterial color="#101010" />
            </mesh>
          )
        })}
        <group position={MOTIONAL_EMF_LAYOUT.meter.needlePivot} rotation={[0, 0, needleAngleRad]}>
          <mesh position={[0, MOTIONAL_EMF_LAYOUT.meter.needleLength / 2, 0]}>
            <boxGeometry args={[0.06, MOTIONAL_EMF_LAYOUT.meter.needleLength, 0.02]} />
            <meshBasicMaterial color="#d92f2f" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.08, 18]} />
            <meshBasicMaterial color="#3c4650" />
          </mesh>
        </group>
        <mesh position={[-0.84, -1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, MOTIONAL_EMF_LAYOUT.meter.terminalLength, 18]} />
          <meshStandardMaterial color="#df4036" />
        </mesh>
        <mesh position={[0.84, -1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, MOTIONAL_EMF_LAYOUT.meter.terminalLength, 18]} />
          <meshStandardMaterial color="#101010" />
        </mesh>
      </group>
    </group>
  )
}
