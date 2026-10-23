import { useFrame } from '@react-three/fiber'
import { memo, useEffect, useMemo, useRef } from 'react'
import type { Group, InstancedMesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { Object3D } from 'three'
import { MHD_LAYOUT } from './layout'
import { deriveCarrierDeflectionAmplitudeY, deriveChannelVisibilityConfig } from './model'
import { getGeometryDetail, resolvePerformanceProfile } from '../../scene3d/canvasQuality'

/** Moving flow markers, the deflected charge carriers and the charge piling up on the plates. */
const channelVisibility = deriveChannelVisibilityConfig()
/** Scratch object for writing instance matrices. */
const _dummy = new Object3D()

export const FlowMarkers = memo(function FlowMarkers({
  running,
  flowRateScale,
}: {
  running: boolean
  flowRateScale: number
}) {
  const runningRef = useRef(running)
  useEffect(() => {
    runningRef.current = running
  }, [running])
  const flowRateScaleRef = useRef(flowRateScale)
  useEffect(() => {
    flowRateScaleRef.current = flowRateScale
  }, [flowRateScale])
  const phaseRef = useRef(0)

  const perf = resolvePerformanceProfile()
  const markersPerLane = perf.level === 'low' ? 5 : perf.level === 'medium' ? 8 : 10

  const markers = useMemo(() => {
    const result: Array<{ lane: number; laneIndex: number; i: number }> = []
    MHD_LAYOUT.flow.lanes.forEach((lane, laneIndex) => {
      for (let i = 0; i < markersPerLane; i += 1) {
        result.push({ lane, laneIndex, i })
      }
    })
    return result
  }, [markersPerLane])

  const groupRefs = useRef<(Group | null)[]>([])

  useFrame((_, delta) => {
    if (runningRef.current) {
      phaseRef.current = (phaseRef.current + delta * 0.36 * flowRateScaleRef.current) % 1
    }

    markers.forEach((_, idx) => {
      const group = groupRefs.current[idx]
      if (!group) return

      const marker = markers[idx]
      const progress = (marker.i / markersPerLane + phaseRef.current) % 1
      const x = MHD_LAYOUT.flow.startX + progress * MHD_LAYOUT.flow.spanX
      const pulse =
        0.55 + 0.45 * Math.sin((phaseRef.current * 2 + marker.i * 0.11 + marker.laneIndex * 0.17) * Math.PI * 2)

      group.position.set(x, 0, marker.lane)

      const shaft = group.children[0] as { material?: MeshBasicMaterial }
      const tip = group.children[1] as { material?: MeshBasicMaterial }
      const baseOpacity = runningRef.current ? 0.45 : 0.25
      const tipBaseOpacity = runningRef.current ? 0.48 : 0.26
      if (shaft?.material) {
        shaft.material.opacity = baseOpacity + pulse * 0.5
      }
      if (tip?.material) {
        tip.material.opacity = tipBaseOpacity + pulse * 0.42
      }
    })
  })

  const geoDetail = getGeometryDetail()

  return markers.map((_, index) => (
    <group
      key={`flow-${index}`}
      ref={(el) => {
        groupRefs.current[index] = el
      }}
    >
      <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.34, geoDetail.cylinderRadialSegments]} />
        <meshBasicMaterial color="#ff84c8" transparent />
      </mesh>
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.24, geoDetail.coneRadialSegments]} />
        <meshBasicMaterial color="#ff5ea8" transparent />
      </mesh>
    </group>
  ))
})

export const ChargeCarriers = memo(function ChargeCarriers({
  running,
  plasmaDensityRatio,
  chargeSeparation,
  flowRateScale,
  driveRatio,
  electrodeGapM,
}: {
  running: boolean
  plasmaDensityRatio: number
  chargeSeparation: number
  flowRateScale: number
  driveRatio: number
  electrodeGapM: number
}) {
  const runningRef = useRef(running)
  useEffect(() => {
    runningRef.current = running
  }, [running])
  const chargeSeparationRef = useRef(chargeSeparation)
  useEffect(() => {
    chargeSeparationRef.current = chargeSeparation
  }, [chargeSeparation])
  const driveRatioRef = useRef(driveRatio)
  useEffect(() => {
    driveRatioRef.current = driveRatio
  }, [driveRatio])
  const flowRateScaleRef = useRef(flowRateScale)
  useEffect(() => {
    flowRateScaleRef.current = flowRateScale
  }, [flowRateScale])

  const phaseRef = useRef(0)

  const perf = resolvePerformanceProfile()
  const carrierCount = Math.max(
    perf.mhdCarrierCountBase,
    Math.round(perf.mhdCarrierCountBase + plasmaDensityRatio * perf.mhdCarrierCountScale),
  )

  const carriers = useMemo(() => {
    const result: Array<{ lane: number; laneIndex: number; i: number }> = []
    MHD_LAYOUT.flow.lanes.forEach((lane, laneIndex) => {
      for (let i = 0; i < carrierCount; i += 1) {
        result.push({ lane, laneIndex, i })
      }
    })
    return result
  }, [carrierCount])

  const posMeshRef = useRef<InstancedMesh>(null)
  const negMeshRef = useRef<InstancedMesh>(null)

  const totalCount = carriers.length

  useFrame((_, delta) => {
    if (runningRef.current) {
      phaseRef.current = (phaseRef.current + delta * 0.36 * flowRateScaleRef.current) % 1
    }

    const cs = chargeSeparationRef.current
    const dr = driveRatioRef.current
    const transientDeflectionY = deriveCarrierDeflectionAmplitudeY(cs, electrodeGapM, dr)
    const carrierOpacity = 0.35 + 0.55 * Math.max(cs, dr * 0.4)
    const emissiveIntensity = 0.35 + cs * 0.95

    const posMesh = posMeshRef.current
    const negMesh = negMeshRef.current
    if (!posMesh || !negMesh) return

    let needsUpdate = false

    for (let idx = 0; idx < totalCount; idx += 1) {
      const carrier = carriers[idx]
      const progress = (carrier.i / carrierCount + phaseRef.current * 0.86) % 1
      const x = MHD_LAYOUT.flow.startX + progress * MHD_LAYOUT.flow.spanX
      const jitter = (((carrier.i + carrier.laneIndex * 2) % 7) - 3) * 0.004
      const zOffset = (((carrier.laneIndex + carrier.i) % 5) - 2) * 0.004

      _dummy.position.set(x, jitter - transientDeflectionY * progress, carrier.lane + zOffset - 0.015)
      _dummy.updateMatrix()
      posMesh.setMatrixAt(idx, _dummy.matrix)

      _dummy.position.set(x, jitter + transientDeflectionY * progress, carrier.lane + zOffset + 0.015)
      _dummy.updateMatrix()
      negMesh.setMatrixAt(idx, _dummy.matrix)
      needsUpdate = true
    }

    if (needsUpdate) {
      posMesh.instanceMatrix.needsUpdate = true
      negMesh.instanceMatrix.needsUpdate = true

      const posMat = (Array.isArray(posMesh.material) ? posMesh.material[0] : posMesh.material) as MeshStandardMaterial
      const negMat = (Array.isArray(negMesh.material) ? negMesh.material[0] : negMesh.material) as MeshStandardMaterial
      posMat.opacity = carrierOpacity
      posMat.emissiveIntensity = emissiveIntensity
      negMat.opacity = carrierOpacity
      negMat.emissiveIntensity = emissiveIntensity
    }
  })

  const geoDetail = getGeometryDetail()

  return (
    <>
      <instancedMesh
        ref={posMeshRef}
        args={[undefined, undefined, totalCount]}
        renderOrder={channelVisibility.particleRenderOrder}
      >
        <sphereGeometry args={[0.03, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshStandardMaterial
          color="#ff6f91"
          emissive="#ff2f65"
          emissiveIntensity={0.35}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={negMeshRef}
        args={[undefined, undefined, totalCount]}
        renderOrder={channelVisibility.particleRenderOrder}
      >
        <sphereGeometry args={[0.03, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshStandardMaterial
          color="#6db5ff"
          emissive="#2a74ff"
          emissiveIntensity={0.35}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  )
})

export const PlateCharges = memo(function PlateCharges({
  chargeSeparation,
  topChargeY,
  bottomChargeY,
}: {
  chargeSeparation: number
  topChargeY: number
  bottomChargeY: number
}) {
  const plateChargeSites = useMemo(() => {
    const sites: Array<{ x: number; z: number }> = []
    const xSites = [-0.72, -0.26, 0.26, 0.72]
    const zSites = [-0.3, 0, 0.3]
    xSites.forEach((x) => {
      zSites.forEach((z) => {
        sites.push({ x, z })
      })
    })
    return sites
  }, [])

  const plateChargeFill = chargeSeparation * plateChargeSites.length

  const posMeshRef = useRef<InstancedMesh>(null)
  const negMeshRef = useRef<InstancedMesh>(null)

  const totalSites = plateChargeSites.length

  useEffect(() => {
    const posMesh = posMeshRef.current
    const negMesh = negMeshRef.current
    if (!posMesh || !negMesh) return

    let activeCount = 0
    for (let index = 0; index < totalSites; index += 1) {
      const siteFill = Math.min(1, Math.max(0, plateChargeFill - index))
      if (siteFill < 0.02) {
        _dummy.scale.set(0, 0, 0)
      } else {
        const scale = 0.82 + siteFill * 0.34
        _dummy.scale.set(scale, scale, scale)
        activeCount += 1
      }

      const site = plateChargeSites[index]
      // +q is driven toward the lower electrode; −q is driven toward the upper one.
      _dummy.position.set(site.x, bottomChargeY, site.z)
      _dummy.updateMatrix()
      posMesh.setMatrixAt(index, _dummy.matrix)

      _dummy.position.set(site.x, topChargeY, site.z)
      _dummy.updateMatrix()
      negMesh.setMatrixAt(index, _dummy.matrix)
    }

    posMesh.instanceMatrix.needsUpdate = true
    negMesh.instanceMatrix.needsUpdate = true

    const posMat = (Array.isArray(posMesh.material) ? posMesh.material[0] : posMesh.material) as MeshBasicMaterial
    const negMat = (Array.isArray(negMesh.material) ? negMesh.material[0] : negMesh.material) as MeshBasicMaterial
    const opacity = activeCount > 0 ? 0.12 + (activeCount / totalSites) * 0.82 : 0
    posMat.opacity = opacity
    negMat.opacity = opacity
  }, [plateChargeFill, plateChargeSites, topChargeY, bottomChargeY, totalSites])

  const geoDetail = getGeometryDetail()

  return (
    <>
      <instancedMesh
        ref={posMeshRef}
        args={[undefined, undefined, totalSites]}
        renderOrder={channelVisibility.particleRenderOrder}
      >
        <sphereGeometry args={[0.026, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshBasicMaterial color="#ff4f7b" transparent opacity={0} depthWrite={false} />
      </instancedMesh>
      <instancedMesh
        ref={negMeshRef}
        args={[undefined, undefined, totalSites]}
        renderOrder={channelVisibility.particleRenderOrder}
      >
        <sphereGeometry args={[0.026, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshBasicMaterial color="#5da8ff" transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </>
  )
})
