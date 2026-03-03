import { Line } from '@react-three/drei/core/Line'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { DoubleSide, Plane, Vector3 } from 'three'
import type { ElectrostaticCharge, PotentialTerrain } from './model'

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
  const contourGroups = useMemo(() => groupContourSegments(terrain), [terrain])
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), [])
  const dragHitPoint = useMemo(() => new Vector3(), [])
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

  const applyChargePositionFromRay = (event: ThreeEvent<PointerEvent>, chargeId: string) => {
    if (!event.ray.intersectPlane(dragPlane, dragHitPoint)) {
      return
    }
    const x = clamp(dragHitPoint.x, -bounds, bounds)
    const z = clamp(dragHitPoint.z, -bounds, bounds)
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
          const x = clamp(event.point.x, -bounds, bounds)
          const z = clamp(event.point.z, -bounds, bounds)
          const sign: 1 | -1 = event.nativeEvent.shiftKey ? -1 : 1
          onAddChargeAt({ x, z }, sign)
        }}
      >
        <planeGeometry args={[bounds * 2, bounds * 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.001} depthWrite={false} />
      </mesh>

      {showTerrain ? (
        <mesh renderOrder={1}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[terrain.vertexPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[terrain.vertexColors, 3]} />
            <bufferAttribute attach="index" args={[terrain.indices, 1]} />
          </bufferGeometry>
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
        ? fieldLines.map((line, index) => (
            <Line
              key={`field-line-${index}`}
              points={line as Array<[number, number, number]>}
              color="#ffcf5f"
              lineWidth={1.7}
              transparent
              opacity={0.92}
            />
          ))
        : null}

      {charges.map((charge) => {
        const isSelected = charge.id === selectedChargeId
        const color = charge.magnitude >= 0 ? '#ff6b6b' : '#5c86ff'
        const radius = 0.2 + Math.min(0.18, Math.abs(charge.magnitude) * 0.03)
        return (
          <mesh
            key={charge.id}
            position={[charge.x, 0.18, charge.z]}
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
              setDraggingChargeId(charge.id)
              onSelectCharge(charge.id)
              applyChargePositionFromRay(event, charge.id)
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
          <mesh position={[probePoint.x, 0.14, probePoint.z]} renderOrder={4}>
            <sphereGeometry args={[0.12, 18, 16]} />
            <meshBasicMaterial color="#ffe15a" transparent opacity={0.95} />
          </mesh>
          <Line
            points={[
              [probePoint.x, 0.04, probePoint.z],
              [probePoint.x, 0.92, probePoint.z],
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
