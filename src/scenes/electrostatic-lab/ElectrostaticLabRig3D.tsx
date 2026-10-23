import { Line } from '../../scene3d/ClassroomLine'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide, Plane, Vector3 } from 'three'
import { samplePotentialTerrainHeight, type ElectrostaticCharge, type PotentialTerrain } from './model'

type ProbePoint = {
  x: number
  z: number
}

type ElectrostaticLabRig3DProps = {
  bounds: number
  charges: ReadonlyArray<ElectrostaticCharge>
  terrain: PotentialTerrain
  fieldLines: ReadonlyArray<ReadonlyArray<[number, number, number]>>
  displayMode: 'potential' | 'field'
  overlayFieldLines: boolean
  showContourLines: boolean
  selectedChargeId: string | null
  probeMode: boolean
  probePoint: ProbePoint | null
  advancedInteractionsEnabled: boolean
  onSelectCharge: (chargeId: string | null) => void
  onProbePointChange: (point: ProbePoint) => void
  onChargePositionChange: (chargeId: string, position: ProbePoint) => void
  onAddChargeAt: (position: ProbePoint, sign: 1 | -1) => void
  onDeleteCharge: (chargeId: string) => void
}

type ContourGroup = {
  key: string
  color: string
  positions: Float32Array
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

type LinePoint = [number, number, number]

function buildFieldArrowheads(
  lines: ReadonlyArray<ReadonlyArray<LinePoint>>,
  charges: ReadonlyArray<ElectrostaticCharge>,
): LinePoint[][] {
  const hasPositiveSource = charges.some((charge) => charge.magnitude > 1e-6)
  const orientation = hasPositiveSource ? 1 : -1
  const arrowheads: LinePoint[][] = []

  for (const line of lines) {
    if (line.length < 3) {
      continue
    }

    const tipIndex = Math.floor((line.length - 1) * 0.58)
    const previous = line[tipIndex - 1]
    const tip = line[tipIndex]
    const next = line[tipIndex + 1]
    if (!previous || !tip || !next) {
      continue
    }

    const dx = (next[0] - previous[0]) * orientation
    const dz = (next[2] - previous[2]) * orientation
    const length = Math.hypot(dx, dz)
    if (length < 1e-6) {
      continue
    }

    const ux = dx / length
    const uz = dz / length
    const backLength = 0.24
    const wingLength = 0.13
    const y = tip[1] + 0.045
    const arrowTip: LinePoint = [tip[0], y, tip[2]]
    const leftWing: LinePoint = [
      tip[0] - ux * backLength - uz * wingLength,
      y,
      tip[2] - uz * backLength + ux * wingLength,
    ]
    const rightWing: LinePoint = [
      tip[0] - ux * backLength + uz * wingLength,
      y,
      tip[2] - uz * backLength - ux * wingLength,
    ]
    arrowheads.push([leftWing, arrowTip, rightWing])
  }

  return arrowheads
}

function resolveContourColor(level: number): string {
  if (Math.abs(level) < 1e-6) {
    return '#f4f7ff'
  }
  return level > 0 ? '#ff8b73' : '#86a8ff'
}

function groupContourSegments(terrain: PotentialTerrain): ContourGroup[] {
  const buckets = new Map<string, { color: string; positions: number[] }>()

  for (const segment of terrain.contourSegments) {
    const key = Number(segment.level).toFixed(2)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { color: resolveContourColor(segment.level), positions: [] }
      buckets.set(key, bucket)
    }

    bucket.positions.push(
      segment.from[0],
      segment.from[1],
      segment.from[2],
      segment.to[0],
      segment.to[1],
      segment.to[2],
    )
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    key,
    color: value.color,
    positions: Float32Array.from(value.positions),
  }))
}

export function ElectrostaticLabRig3D({
  bounds,
  charges,
  terrain,
  fieldLines,
  displayMode,
  overlayFieldLines,
  showContourLines,
  selectedChargeId,
  probeMode,
  probePoint,
  advancedInteractionsEnabled,
  onSelectCharge,
  onProbePointChange,
  onChargePositionChange,
  onAddChargeAt,
  onDeleteCharge,
}: ElectrostaticLabRig3DProps) {
  const showTerrain = displayMode === 'potential'
  const showFieldLines = displayMode === 'field' || (showTerrain && overlayFieldLines)
  const terrainGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(terrain.vertexPositions, 3))
    geometry.setAttribute('color', new BufferAttribute(terrain.vertexColors, 3))
    geometry.setIndex(new BufferAttribute(terrain.indices, 1))
    geometry.computeVertexNormals()
    return geometry
  }, [terrain])
  useEffect(() => () => terrainGeometry.dispose(), [terrainGeometry])
  const displayFieldLines = useMemo(
    () =>
      fieldLines.map((line) =>
        line.map(([x, , z]): [number, number, number] => [
          x,
          showTerrain ? samplePotentialTerrainHeight(terrain, bounds, { x, z }) + 0.1 : 0.08,
          z,
        ]),
      ),
    [bounds, fieldLines, showTerrain, terrain],
  )
  const contourGroups = useMemo(() => groupContourSegments(terrain), [terrain])
  const fieldArrowheads = useMemo(() => buildFieldArrowheads(displayFieldLines, charges), [charges, displayFieldLines])
  const dragPlaneRef = useRef(new Plane(new Vector3(0, 1, 0), 0))
  const dragHitPoint = useMemo(() => new Vector3(), [])
  const dragOffsetRef = useRef({ x: 0, z: 0 })
  const [draggingChargeId, setDraggingChargeId] = useState<string | null>(null)

  const capturePointer = (event: ThreeEvent<PointerEvent>) => {
    const target = event.nativeEvent.target
    if (target instanceof Element) {
      target.setPointerCapture(event.pointerId)
    }
  }

  const releasePointer = (event: ThreeEvent<PointerEvent>) => {
    const target = event.nativeEvent.target
    if (target instanceof Element) {
      target.releasePointerCapture(event.pointerId)
    }
  }

  const startChargeDrag = (event: ThreeEvent<PointerEvent>, charge: ElectrostaticCharge, markerY: number) => {
    dragPlaneRef.current.constant = -markerY
    if (event.ray.intersectPlane(dragPlaneRef.current, dragHitPoint)) {
      dragOffsetRef.current = {
        x: charge.x - dragHitPoint.x,
        z: charge.z - dragHitPoint.z,
      }
    }
  }

  const applyChargePositionFromRay = (event: ThreeEvent<PointerEvent>, chargeId: string) => {
    if (!event.ray.intersectPlane(dragPlaneRef.current, dragHitPoint)) {
      return
    }
    const chargeLimit = Math.max(0, bounds - 1)
    const x = clamp(dragHitPoint.x + dragOffsetRef.current.x, -chargeLimit, chargeLimit)
    const z = clamp(dragHitPoint.z + dragOffsetRef.current.z, -chargeLimit, chargeLimit)
    onChargePositionChange(chargeId, {
      x: Number(x.toFixed(2)),
      z: Number(z.toFixed(2)),
    })
  }

  return (
    <group>
      <ambientLight intensity={0.86} />
      <directionalLight position={[4.8, 7, 5.4]} intensity={0.9} />
      <pointLight position={[-4, 4, -3]} intensity={0.36} color="#9bd0ff" />

      <gridHelper args={[bounds * 2, 28, '#6c7f96', '#8da4bd']} />
      <axesHelper args={[6.5]} />

      <mesh
        position={[0, -0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation()
          const x = clamp(event.point.x, -bounds, bounds)
          const z = clamp(event.point.z, -bounds, bounds)
          if (probeMode) {
            onProbePointChange({ x, z })
          } else {
            onSelectCharge(null)
          }
        }}
        onDoubleClick={(event) => {
          if (!advancedInteractionsEnabled || probeMode) {
            return
          }
          event.stopPropagation()
          const chargeLimit = Math.max(0, bounds - 1)
          const x = clamp(event.point.x, -chargeLimit, chargeLimit)
          const z = clamp(event.point.z, -chargeLimit, chargeLimit)
          const sign: 1 | -1 = event.nativeEvent.shiftKey ? -1 : 1
          onAddChargeAt({ x, z }, sign)
        }}
      >
        <planeGeometry args={[bounds * 2, bounds * 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.001} depthWrite={false} />
      </mesh>

      {showTerrain ? (
        <mesh geometry={terrainGeometry} renderOrder={1}>
          <meshStandardMaterial
            vertexColors
            side={DoubleSide}
            metalness={0.12}
            roughness={0.78}
            transparent
            opacity={0.74}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {showTerrain && showContourLines
        ? contourGroups.map((group) => (
            <lineSegments key={`contour-${group.key}`}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[group.positions, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={group.color} transparent opacity={0.88} />
            </lineSegments>
          ))
        : null}

      {showFieldLines
        ? displayFieldLines.map((line, index) => (
            <Line
              key={`field-line-${index}`}
              points={line}
              color="#ffcf5f"
              lineWidth={1.7}
              transparent
              opacity={0.92}
            />
          ))
        : null}
      {showFieldLines
        ? fieldArrowheads.map((points, index) => (
            <Line
              key={`field-arrow-${index}`}
              points={points}
              color="#fff2b2"
              lineWidth={2.4}
              transparent
              opacity={0.98}
            />
          ))
        : null}

      {charges.map((charge) => {
        const isSelected = charge.id === selectedChargeId
        const color = charge.magnitude > 1e-6 ? '#ff6b6b' : charge.magnitude < -1e-6 ? '#5c86ff' : '#aeb8c7'
        const radius = 0.2 + Math.min(0.18, Math.abs(charge.magnitude) * 0.03)
        const surfaceHeight = showTerrain
          ? samplePotentialTerrainHeight(terrain, bounds, { x: charge.x, z: charge.z })
          : 0
        const markerY = showTerrain ? surfaceHeight + radius * 0.86 : 0.18
        return (
          <mesh
            key={charge.id}
            position={[charge.x, markerY, charge.z]}
            onClick={(event) => {
              event.stopPropagation()
              if (probeMode) {
                onProbePointChange({ x: charge.x, z: charge.z })
                return
              }
              onSelectCharge(charge.id)
            }}
            onPointerDown={(event) => {
              if (!advancedInteractionsEnabled || probeMode) {
                return
              }
              event.stopPropagation()
              capturePointer(event)
              startChargeDrag(event, charge, markerY)
              setDraggingChargeId(charge.id)
              onSelectCharge(charge.id)
            }}
            onPointerMove={(event) => {
              if (!advancedInteractionsEnabled || draggingChargeId !== charge.id || probeMode) {
                return
              }
              event.stopPropagation()
              applyChargePositionFromRay(event, charge.id)
            }}
            onPointerUp={(event) => {
              if (draggingChargeId !== charge.id) {
                return
              }
              event.stopPropagation()
              releasePointer(event)
              setDraggingChargeId(null)
            }}
            onPointerCancel={(event) => {
              if (draggingChargeId !== charge.id) {
                return
              }
              event.stopPropagation()
              setDraggingChargeId(null)
            }}
            onContextMenu={(event) => {
              if (!advancedInteractionsEnabled || probeMode) {
                return
              }
              event.stopPropagation()
              event.nativeEvent.preventDefault()
              onDeleteCharge(charge.id)
            }}
            renderOrder={3}
          >
            <sphereGeometry args={[radius, 26, 24]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isSelected || draggingChargeId === charge.id ? 0.6 : 0.28}
              roughness={0.34}
            />
          </mesh>
        )
      })}

      {probePoint ? (
        <group>
          <mesh
            position={[
              probePoint.x,
              (showTerrain ? samplePotentialTerrainHeight(terrain, bounds, probePoint) : 0) + 0.14,
              probePoint.z,
            ]}
            renderOrder={4}
          >
            <sphereGeometry args={[0.12, 18, 16]} />
            <meshBasicMaterial color="#ffe15a" transparent opacity={0.95} />
          </mesh>
          <Line
            points={[
              [
                probePoint.x,
                showTerrain ? samplePotentialTerrainHeight(terrain, bounds, probePoint) + 0.04 : 0.04,
                probePoint.z,
              ],
              [
                probePoint.x,
                (showTerrain ? samplePotentialTerrainHeight(terrain, bounds, probePoint) : 0.04) + 0.92,
                probePoint.z,
              ],
            ]}
            color="#ffe15a"
            lineWidth={1.5}
            transparent
            opacity={0.9}
          />
        </group>
      ) : null}
    </group>
  )
}
