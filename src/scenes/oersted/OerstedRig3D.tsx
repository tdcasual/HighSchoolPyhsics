import { Line } from '@react-three/drei/core/Line'
import { Text } from '@react-three/drei/core/Text'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { Plane, Quaternion, Vector3 } from 'three'
import { SCENE_SCALE, WIRE_HALF_LENGTH_M } from './oerstedPresets'
import type { NeedlePlacement, NeedleVisual } from './oerstedTypes'
import { add, cross, normalize, scale, type Vec3 } from './vectorMath'

type Point3 = [number, number, number]

const LOOP_RADIUS_SCENE = 0.58
const LOOP_OFFSET_SCENE = 0.42
const NEEDLE_PLANE_Y_SCENE = 0.08
const NEEDLE_DRAG_MIN_M = -0.25
const NEEDLE_DRAG_MAX_M = 0.25

type LoopSpec = {
  offsetAlongWire: number
}

type OerstedRig3DProps = {
  running: boolean
  currentA: number
  wireHeightM: number
  wireDirection: Vec3
  phase: number
  showFieldLines: boolean
  needles: NeedleVisual[]
  draggingNeedleIndex: number | null
  onNeedleDragStart: (index: number) => void
  onNeedleDrag: (index: number, placement: NeedlePlacement) => void
  onNeedleDragEnd: () => void
}

function toRadians(valueDeg: number): number {
  return (valueDeg * Math.PI) / 180
}

function headingToYawRad(headingDeg: number): number {
  return toRadians(90 - headingDeg)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function capturePointer(event: ThreeEvent<PointerEvent>): void {
  const target = event.nativeEvent.target
  if (target instanceof Element) {
    target.setPointerCapture(event.pointerId)
  }
}

function releasePointer(event: ThreeEvent<PointerEvent>): void {
  const target = event.nativeEvent.target
  if (target instanceof Element) {
    target.releasePointerCapture(event.pointerId)
  }
}

function directionToQuaternion(direction: Vec3): [number, number, number, number] {
  const from = new Vector3(0, 1, 0)
  const to = new Vector3(direction.x, direction.y, direction.z).normalize()
  const quat = new Quaternion()
  quat.setFromUnitVectors(from, to)
  return [quat.x, quat.y, quat.z, quat.w]
}

function buildWireFieldLoopPoints(
  wireCenter: Vec3,
  wireDirection: Vec3,
  basisU: Vec3,
  basisV: Vec3,
  offsetAlongWire: number,
  radius: number,
  segments = 72,
): Point3[] {
  const center = add(wireCenter, scale(wireDirection, offsetAlongWire))
  const points: Point3[] = []

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    const radial = add(scale(basisU, Math.cos(angle) * radius), scale(basisV, Math.sin(angle) * radius))
    const point = add(center, radial)
    points.push([point.x, point.y, point.z])
  }

  return points
}

export function OerstedRig3D({
  running,
  currentA,
  wireHeightM,
  wireDirection,
  phase,
  showFieldLines,
  needles,
  draggingNeedleIndex,
  onNeedleDragStart,
  onNeedleDrag,
  onNeedleDragEnd,
}: OerstedRig3DProps) {
  const wireCenterScene = useMemo<Vec3>(() => ({ x: 0, y: wireHeightM * SCENE_SCALE, z: 0 }), [wireHeightM])
  const wireDirectionNorm = useMemo(() => normalize(wireDirection), [wireDirection])

  const wireQuaternion = useMemo(() => {
    const from = new Vector3(0, 1, 0)
    const to = new Vector3(wireDirectionNorm.x, wireDirectionNorm.y, wireDirectionNorm.z)
    const quat = new Quaternion()
    quat.setFromUnitVectors(from, to)
    return quat
  }, [wireDirectionNorm])

  const basis = useMemo(() => {
    const reference = Math.abs(wireDirectionNorm.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
    const u = normalize(cross(wireDirectionNorm, reference))
    const v = normalize(cross(wireDirectionNorm, u))
    return { u, v }
  }, [wireDirectionNorm])

  const loopSpecs = useMemo<LoopSpec[]>(
    () => [
      { offsetAlongWire: -LOOP_OFFSET_SCENE },
      { offsetAlongWire: 0 },
      { offsetAlongWire: LOOP_OFFSET_SCENE },
    ],
    [],
  )

  const wireHalfLengthScene = WIRE_HALF_LENGTH_M * SCENE_SCALE
  const ringPoints = useMemo(
    () =>
      loopSpecs.map((spec) =>
        buildWireFieldLoopPoints(
          wireCenterScene,
          wireDirectionNorm,
          basis.u,
          basis.v,
          spec.offsetAlongWire,
          LOOP_RADIUS_SCENE,
        ),
      ),
    [basis.u, basis.v, loopSpecs, wireCenterScene, wireDirectionNorm],
  )

  const flowMarkers = useMemo(
    () =>
      loopSpecs.flatMap((spec) => {
        const markerCount = 10
        const center = add(wireCenterScene, scale(wireDirectionNorm, spec.offsetAlongWire))
        return Array.from({ length: markerCount }).map((_, markerIndex) => ({
          center,
          baseAngle: (markerIndex / markerCount) * Math.PI * 2,
        }))
      }),
    [loopSpecs, wireCenterScene, wireDirectionNorm],
  )

  const fieldActive = Math.abs(currentA) > 1e-5
  const currentSign = currentA >= 0 ? 1 : -1
  const pulse = running && fieldActive ? 0.5 + 0.5 * Math.sin(phase * Math.PI * 2) : 0
  const fieldColor = fieldActive ? (currentA >= 0 ? '#f08b53' : '#59aef2') : '#9aa6b5'
  const ringOpacity = fieldActive ? 0.42 + pulse * 0.3 : 0.06
  const flowOpacity = fieldActive ? 0.65 + pulse * 0.25 : 0
  const positiveTerminal: Vec3 = { x: -1.8, y: 0.24, z: 0.13 }
  const negativeTerminal: Vec3 = { x: -2.22, y: 0.08, z: -0.13 }
  const positiveWireColor = fieldActive ? '#ff5a5a' : '#8d6767'
  const negativeWireColor = fieldActive ? '#56a9ff' : '#667a91'

  const wireEndA = add(wireCenterScene, scale(wireDirectionNorm, -wireHalfLengthScene))
  const wireEndB = add(wireCenterScene, scale(wireDirectionNorm, wireHalfLengthScene))

  const currentVector = scale(wireDirectionNorm, currentSign)
  const currentArrowTail = add(wireCenterScene, scale(currentVector, -0.9))
  const currentArrowTip = add(wireCenterScene, scale(currentVector, 0.9))

  const currentArrowQuat = useMemo(() => {
    const from = new Vector3(0, 1, 0)
    const to = new Vector3(currentVector.x, currentVector.y, currentVector.z)
    const quat = new Quaternion()
    quat.setFromUnitVectors(from, to)
    return quat
  }, [currentVector])

  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), -NEEDLE_PLANE_Y_SCENE), [])
  const dragHitPoint = useMemo(() => new Vector3(), [])

  const updateNeedleByRay = (event: ThreeEvent<PointerEvent>, index: number) => {
    if (!event.ray.intersectPlane(dragPlane, dragHitPoint)) {
      return
    }

    const nextX = clamp(dragHitPoint.x / SCENE_SCALE, NEEDLE_DRAG_MIN_M, NEEDLE_DRAG_MAX_M)
    const nextZ = clamp(dragHitPoint.z / SCENE_SCALE, NEEDLE_DRAG_MIN_M, NEEDLE_DRAG_MAX_M)

    onNeedleDrag(index, {
      x: Number(nextX.toFixed(3)),
      z: Number(nextZ.toFixed(3)),
    })
  }

  return (
    <group>
      <ambientLight intensity={0.78} />
      <directionalLight position={[3.6, 4.8, 2.8]} intensity={1.08} />
      <pointLight position={[0, 1.6, 0]} intensity={0.58} color="#f9f3d2" />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 72]} />
        <meshStandardMaterial color="#c0ae8f" roughness={0.86} metalness={0.06} />
      </mesh>

      <mesh position={[-2.04, 0.13, 0]}>
        <boxGeometry args={[0.56, 0.24, 0.32]} />
        <meshStandardMaterial color="#1d2433" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[-1.84, 0.13, 0.12]}>
        <boxGeometry args={[0.18, 0.1, 0.14]} />
        <meshStandardMaterial
          color="#7d2d2d"
          emissive={positiveWireColor}
          emissiveIntensity={fieldActive ? 0.22 : 0.08}
          roughness={0.42}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[-2.24, 0.13, -0.12]}>
        <boxGeometry args={[0.18, 0.1, 0.14]} />
        <meshStandardMaterial
          color="#2c4a76"
          emissive={negativeWireColor}
          emissiveIntensity={fieldActive ? 0.18 : 0.07}
          roughness={0.42}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[positiveTerminal.x, positiveTerminal.y, positiveTerminal.z]}>
        <sphereGeometry args={[0.046, 20, 20]} />
        <meshStandardMaterial
          color={positiveWireColor}
          emissive={positiveWireColor}
          emissiveIntensity={fieldActive ? 0.62 : 0.2}
          roughness={0.3}
          metalness={0.22}
        />
      </mesh>
      <mesh position={[negativeTerminal.x, negativeTerminal.y, negativeTerminal.z]}>
        <sphereGeometry args={[0.046, 20, 20]} />
        <meshStandardMaterial
          color={negativeWireColor}
          emissive={negativeWireColor}
          emissiveIntensity={fieldActive ? 0.58 : 0.2}
          roughness={0.3}
          metalness={0.22}
        />
      </mesh>
      <Text
        position={[positiveTerminal.x + 0.06, positiveTerminal.y + 0.13, positiveTerminal.z + 0.02]}
        color={positiveWireColor}
        fontSize={0.11}
        anchorX="left"
        anchorY="middle"
      >
        正极 +
      </Text>
      <Text
        position={[negativeTerminal.x - 0.06, negativeTerminal.y + 0.13, negativeTerminal.z - 0.02]}
        color={negativeWireColor}
        fontSize={0.11}
        anchorX="right"
        anchorY="middle"
      >
        负极 -
      </Text>

      <Line
        points={[
          [positiveTerminal.x, positiveTerminal.y, positiveTerminal.z],
          [wireEndB.x, wireEndB.y, wireEndB.z],
        ]}
        color={positiveWireColor}
        lineWidth={2.9}
        transparent
        opacity={fieldActive ? 0.96 : 0.72}
      />
      <Line
        points={[
          [negativeTerminal.x, negativeTerminal.y, negativeTerminal.z],
          [wireEndA.x, wireEndA.y, wireEndA.z],
        ]}
        color={negativeWireColor}
        lineWidth={2.9}
        transparent
        opacity={fieldActive ? 0.96 : 0.72}
      />

      <mesh position={[wireCenterScene.x, wireCenterScene.y, wireCenterScene.z]} quaternion={wireQuaternion}>
        <cylinderGeometry args={[0.04, 0.04, wireHalfLengthScene * 2, 28]} />
        <meshStandardMaterial
          color={fieldColor}
          emissive={fieldColor}
          emissiveIntensity={running && fieldActive ? 0.28 + pulse * 0.42 : 0.03}
          roughness={0.28}
          metalness={0.48}
        />
      </mesh>

      <Line
        points={[
          [currentArrowTail.x, currentArrowTail.y, currentArrowTail.z],
          [currentArrowTip.x, currentArrowTip.y, currentArrowTip.z],
        ]}
        color={fieldColor}
        lineWidth={2.7}
        transparent
        opacity={fieldActive ? 0.9 : 0.22}
      />
      <mesh position={[currentArrowTip.x, currentArrowTip.y, currentArrowTip.z]} quaternion={currentArrowQuat}>
        <coneGeometry args={[0.05, 0.16, 14]} />
        <meshBasicMaterial color={fieldColor} transparent opacity={fieldActive ? 0.95 : 0.22} />
      </mesh>
      <Text
        position={[wireCenterScene.x, wireCenterScene.y + 0.22, wireCenterScene.z]}
        color={fieldColor}
        fontSize={0.11}
        anchorX="center"
        anchorY="middle"
      >
        I
      </Text>

      {showFieldLines
        ? ringPoints.map((points, index) => (
            <Line key={`loop-${index}`} points={points} color={fieldColor} lineWidth={2.2} transparent opacity={ringOpacity} />
          ))
        : null}

      {showFieldLines
        ? flowMarkers.map((marker, index) => {
            const angle = marker.baseAngle + phase * Math.PI * 2 * currentSign
            const radial = add(
              scale(basis.u, Math.cos(angle) * LOOP_RADIUS_SCENE),
              scale(basis.v, Math.sin(angle) * LOOP_RADIUS_SCENE),
            )
            const position = add(marker.center, radial)
            const tangent = normalize(
              add(
                scale(basis.u, -Math.sin(angle) * currentSign),
                scale(basis.v, Math.cos(angle) * currentSign),
              ),
            )
            const tail = add(position, scale(tangent, -0.08))
            const tip = add(position, scale(tangent, 0.08))
            const coneQuat = directionToQuaternion(tangent)
            return (
              <group key={`flow-marker-${index}`}>
                <Line
                  points={[
                    [tail.x, tail.y, tail.z],
                    [tip.x, tip.y, tip.z],
                  ]}
                  color={fieldColor}
                  lineWidth={2}
                  transparent
                  opacity={flowOpacity}
                />
                <mesh position={[tip.x, tip.y, tip.z]} quaternion={coneQuat}>
                  <coneGeometry args={[0.045, 0.11, 12]} />
                  <meshBasicMaterial color={fieldColor} transparent opacity={flowOpacity} />
                </mesh>
              </group>
            )
          })
        : null}

      {needles.map((needle, index) => {
        const scenePos: Point3 = [needle.x * SCENE_SCALE, NEEDLE_PLANE_Y_SCENE, needle.z * SCENE_SCALE]
        const isDragging = draggingNeedleIndex === index
        return (
          <group key={`needle-${index}`}>
            <mesh
              position={scenePos}
              onPointerDown={(event) => {
                event.stopPropagation()
                capturePointer(event)
                onNeedleDragStart(index)
                updateNeedleByRay(event, index)
              }}
              onPointerMove={(event) => {
                if (draggingNeedleIndex !== index) {
                  return
                }
                event.stopPropagation()
                updateNeedleByRay(event, index)
              }}
              onPointerUp={(event) => {
                if (draggingNeedleIndex !== index) {
                  return
                }
                event.stopPropagation()
                releasePointer(event)
                onNeedleDragEnd()
              }}
              onPointerCancel={(event) => {
                if (draggingNeedleIndex !== index) {
                  return
                }
                event.stopPropagation()
                onNeedleDragEnd()
              }}
            >
              <cylinderGeometry args={[0.18, 0.18, 0.038, 32]} />
              <meshStandardMaterial color={isDragging ? '#fff5bf' : '#f0f3f8'} roughness={0.2} metalness={0.1} />
            </mesh>
            <mesh position={scenePos}>
              <ringGeometry args={[0.13, 0.14, 28]} />
              <meshBasicMaterial color={isDragging ? '#d97706' : '#2d3748'} />
            </mesh>

            <group
              position={[scenePos[0], scenePos[1] + 0.052, scenePos[2]]}
              rotation={[0, headingToYawRad(needle.headingDeg), 0]}
            >
              <mesh position={[0.1, 0, 0]}>
                <boxGeometry args={[0.2, 0.024, 0.045]} />
                <meshStandardMaterial color="#dc5f4a" emissive="#dc5f4a" emissiveIntensity={0.2 + pulse * 0.2} />
              </mesh>
              <mesh position={[-0.1, 0, 0]}>
                <boxGeometry args={[0.2, 0.024, 0.045]} />
                <meshStandardMaterial color="#3d89d2" emissive="#3d89d2" emissiveIntensity={0.14 + pulse * 0.12} />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.018, 0.018, 0.06, 16]} />
                <meshStandardMaterial color="#f7f0db" roughness={0.38} metalness={0.16} />
              </mesh>
            </group>

            <group
              position={[scenePos[0], scenePos[1] + 0.11, scenePos[2]]}
              rotation={[0, headingToYawRad(needle.targetHeadingDeg), 0]}
            >
              <Line points={[[0, 0, 0], [0.19, 0, 0]]} color="#ffe39f" lineWidth={1.7} transparent opacity={0.5} />
              <mesh position={[0.23, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.036, 0.1, 12]} />
                <meshBasicMaterial color="#ffe39f" transparent opacity={0.55} />
              </mesh>
            </group>

            <Text
              position={[scenePos[0], scenePos[1] + 0.22, scenePos[2]]}
              color="#2d3748"
              fontSize={0.08}
              anchorX="center"
              anchorY="middle"
            >
              磁针{index + 1}
            </Text>
          </group>
        )
      })}

      <group position={[1.45, 0.04, 0.52]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.125, 28]} />
          <meshBasicMaterial color="#2d3748" transparent opacity={0.48} />
        </mesh>
        <Line points={[[0, 0, -0.18], [0, 0, 0.1]]} color="#2d3748" lineWidth={2.2} />
        <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.045, 0.1, 14]} />
          <meshBasicMaterial color="#2d3748" />
        </mesh>
        <Text position={[0, 0.09, 0.24]} color="#2d3748" fontSize={0.07} anchorX="center" anchorY="middle">
          N
        </Text>
      </group>
      <Text position={[1.45, 0.15, 0.78]} color="#2d3748" fontSize={0.08} anchorX="center" anchorY="middle">
        地磁北向
      </Text>
      {showFieldLines ? (
        <Text
          position={[wireCenterScene.x, wireCenterScene.y - 0.44, wireCenterScene.z]}
          color={fieldColor}
          fontSize={0.07}
          anchorX="center"
          anchorY="middle"
        >
          等半径磁感线
        </Text>
      ) : null}
    </group>
  )
}
