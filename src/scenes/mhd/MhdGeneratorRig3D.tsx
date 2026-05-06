import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei/core/Line'
import { Text } from '@react-three/drei/core/Text'
import { memo, useEffect, useMemo, useRef } from 'react'
import type { Group, InstancedMesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { Object3D } from 'three'
import { MHD_LAYOUT } from './layout'
import { deriveChannelVisibilityConfig } from './model'
import { getGeometryDetail, resolvePerformanceProfile } from '../../scene3d/canvasQuality'

type MhdGeneratorRig3DProps = {
  running: boolean
  chargeSeparation: number
  driveRatio: number
  plasmaDensityRatio: number
}

const channelVisibility = deriveChannelVisibilityConfig()

const FlowMarkers = memo(function FlowMarkers({ running }: { running: boolean }) {
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])
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
      phaseRef.current = (phaseRef.current + delta * 0.36) % 1
    }

    markers.forEach((_, idx) => {
      const group = groupRefs.current[idx]
      if (!group) return

      const marker = markers[idx]
      const progress = (marker.i / markersPerLane + phaseRef.current) % 1
      const x = MHD_LAYOUT.flow.startX + progress * MHD_LAYOUT.flow.spanX
      const pulse = 0.55 + 0.45 * Math.sin((phaseRef.current * 2 + marker.i * 0.11 + marker.laneIndex * 0.17) * Math.PI * 2)

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
    <group key={`flow-${index}`} ref={(el) => { groupRefs.current[index] = el }}>
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

const _dummy = new Object3D()

const ChargeCarriers = memo(function ChargeCarriers({
  running,
  plasmaDensityRatio,
  chargeSeparation,
  driveRatio,
}: {
  running: boolean
  plasmaDensityRatio: number
  chargeSeparation: number
  driveRatio: number
}) {
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])
  const chargeSeparationRef = useRef(chargeSeparation)
  useEffect(() => { chargeSeparationRef.current = chargeSeparation }, [chargeSeparation])
  const driveRatioRef = useRef(driveRatio)
  useEffect(() => { driveRatioRef.current = driveRatio }, [driveRatio])

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
      phaseRef.current = (phaseRef.current + delta * 0.36) % 1
    }

    const cs = chargeSeparationRef.current
    const dr = driveRatioRef.current
    const transientDeflectionY = (0.14 + 0.26 * dr) * (1 - cs)
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
      const jitter = (((carrier.i + carrier.laneIndex * 2) % 7) - 3) * 0.009
      const zOffset = (((carrier.laneIndex + carrier.i) % 5) - 2) * 0.009

      _dummy.position.set(x, jitter + transientDeflectionY * progress, carrier.lane + zOffset - 0.06)
      _dummy.updateMatrix()
      posMesh.setMatrixAt(idx, _dummy.matrix)

      _dummy.position.set(x, jitter - transientDeflectionY * progress, carrier.lane + zOffset + 0.06)
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

const PlateCharges = memo(function PlateCharges({
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
      _dummy.position.set(site.x, topChargeY, site.z)
      _dummy.updateMatrix()
      posMesh.setMatrixAt(index, _dummy.matrix)

      _dummy.position.set(site.x, bottomChargeY, site.z)
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

const magneticGuides = MHD_LAYOUT.magneticField.xGuides.map((x) => ({
  shaft: [
    [x, 0, MHD_LAYOUT.magneticField.zStart] as [number, number, number],
    [x, 0, MHD_LAYOUT.magneticField.zEnd] as [number, number, number],
  ],
  tip: [x, 0, MHD_LAYOUT.magneticField.zEnd] as [number, number, number],
}))

export function MhdGeneratorRig3D({
  running,
  chargeSeparation,
  driveRatio,
  plasmaDensityRatio,
}: MhdGeneratorRig3DProps) {
  const flowRibbonOpacity = running ? 0.48 : 0.26
  const innerFieldOpacity = 0.1 + 0.9 * chargeSeparation
  const magneticDeflectionOpacity = (0.2 + (1 - chargeSeparation) * 0.72) * Math.max(0.38, driveRatio)
  const topChargeY = MHD_LAYOUT.electrodes.topCenter[1] + MHD_LAYOUT.electrodes.size[1] / 2 + 0.024
  const bottomChargeY = MHD_LAYOUT.electrodes.bottomCenter[1] - MHD_LAYOUT.electrodes.size[1] / 2 - 0.024

  const geoDetail = getGeometryDetail()

  return (
    <group>
      <ambientLight intensity={0.82} />
      <directionalLight position={[4.5, 5.5, 3]} intensity={1.15} />
      <pointLight position={[0, 0.2, 1.8]} intensity={0.72} color="#8ce6ff" />

      <mesh position={MHD_LAYOUT.magnets.northPosition}>
        <boxGeometry args={MHD_LAYOUT.magnets.size} />
        <meshStandardMaterial color="#c33232" metalness={0.18} roughness={0.5} />
      </mesh>
      <mesh position={MHD_LAYOUT.magnets.southPosition}>
        <boxGeometry args={MHD_LAYOUT.magnets.size} />
        <meshStandardMaterial color="#266eb5" metalness={0.2} roughness={0.45} />
      </mesh>

      <Text
        position={[0, 0.62, MHD_LAYOUT.magnets.northPosition[2]]}
        color="#ffffff"
        fontSize={0.28}
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>
      <Text
        position={[0, 0.62, MHD_LAYOUT.magnets.southPosition[2]]}
        color="#ffffff"
        fontSize={0.28}
        anchorX="center"
        anchorY="middle"
      >
        S
      </Text>

      <mesh
        position={MHD_LAYOUT.electrodes.topCenter}
        rotation={[0, MHD_LAYOUT.electrodes.topRotationY, 0]}
      >
        <boxGeometry args={MHD_LAYOUT.electrodes.size} />
        <meshStandardMaterial color="#d7cd9d" metalness={0.25} roughness={0.52} />
      </mesh>
      <mesh
        position={MHD_LAYOUT.electrodes.bottomCenter}
        rotation={[0, MHD_LAYOUT.electrodes.bottomRotationY, 0]}
      >
        <boxGeometry args={MHD_LAYOUT.electrodes.size} />
        <meshStandardMaterial color="#d7cd9d" metalness={0.25} roughness={0.52} />
      </mesh>
      <Text position={[0, 0.49, 0]} color="#2a2a2a" fontSize={0.2} anchorX="center" anchorY="middle">
        A
      </Text>
      <Text position={[0, -0.49, 0]} color="#2a2a2a" fontSize={0.2} anchorX="center" anchorY="middle">
        B
      </Text>

      <mesh position={MHD_LAYOUT.channel.center} renderOrder={channelVisibility.channelRenderOrder}>
        <boxGeometry args={MHD_LAYOUT.channel.size} />
        <meshStandardMaterial
          color="#7ddff6"
          transparent
          opacity={channelVisibility.fluidOpacity}
          roughness={0.22}
          metalness={0.02}
          depthWrite={channelVisibility.depthWrite}
        />
      </mesh>
      <mesh position={MHD_LAYOUT.channel.center} renderOrder={channelVisibility.channelRenderOrder + 1}>
        <boxGeometry args={MHD_LAYOUT.channel.size} />
        <meshBasicMaterial
          color="#a6efff"
          transparent
          opacity={channelVisibility.wireframeOpacity}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {MHD_LAYOUT.flow.lanes.map((lane, index) => (
        <Line
          key={`flow-ribbon-${index}`}
          points={[
            [MHD_LAYOUT.flow.startX - 0.18, 0, lane],
            [MHD_LAYOUT.flow.startX + MHD_LAYOUT.flow.spanX + 0.18, 0, lane],
          ]}
          color="#ff9ed6"
          lineWidth={3.8}
          transparent
          opacity={flowRibbonOpacity}
        />
      ))}

      {magneticGuides.map((guide, index) => (
        <group key={`b-guide-${index}`}>
          <Line
            points={guide.shaft}
            color="#fff090"
            lineWidth={2.6}
            transparent
            opacity={0.9}
          />
          <mesh position={guide.tip} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.045, 0.18, geoDetail.coneRadialSegments]} />
            <meshBasicMaterial color="#fff090" />
          </mesh>
        </group>
      ))}

      {MHD_LAYOUT.magneticField.xGuides.map((x, index) => (
        <group key={`e-field-${index}`}>
          <Line
            points={[
              [x, MHD_LAYOUT.electrodes.topCenter[1] - 0.05, 0.18],
              [x, MHD_LAYOUT.electrodes.bottomCenter[1] + 0.05, 0.18],
            ]}
            color="#90f5ff"
            lineWidth={2.1}
            transparent
            opacity={innerFieldOpacity}
          />
          <mesh position={[x, MHD_LAYOUT.electrodes.bottomCenter[1] + 0.05, 0.18]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.034, 0.14, geoDetail.coneRadialSegments]} />
            <meshBasicMaterial color="#90f5ff" transparent opacity={innerFieldOpacity} />
          </mesh>
        </group>
      ))}

      <Line
        points={[
          [-0.54, -0.02, -0.22],
          [-0.54, 0.24, -0.22],
        ]}
        color="#ffb066"
        lineWidth={2.4}
        transparent
        opacity={magneticDeflectionOpacity}
      />
      <mesh position={[-0.54, 0.24, -0.22]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.04, 0.16, geoDetail.coneRadialSegments]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={magneticDeflectionOpacity} />
      </mesh>
      <Line
        points={[
          [0.54, 0.02, 0.22],
          [0.54, -0.24, 0.22],
        ]}
        color="#ffb066"
        lineWidth={2.4}
        transparent
        opacity={magneticDeflectionOpacity}
      />
      <mesh position={[0.54, -0.24, 0.22]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.04, 0.16, geoDetail.coneRadialSegments]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={magneticDeflectionOpacity} />
      </mesh>

      <FlowMarkers running={running} />

      <ChargeCarriers
        running={running}
        plasmaDensityRatio={plasmaDensityRatio}
        chargeSeparation={chargeSeparation}
        driveRatio={driveRatio}
      />

      <PlateCharges
        chargeSeparation={chargeSeparation}
        topChargeY={topChargeY}
        bottomChargeY={bottomChargeY}
      />

      <Text
        position={[-0.95, 0.66, 0.08]}
        color="#fff4b8"
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
      >
        B
      </Text>
      <Text
        position={[-1.2, -0.64, -0.8]}
        color="#ff9ad7"
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
      >
        v
      </Text>
      <Text
        position={[1, 0.04, 0.24]}
        color="#abf6ff"
        fontSize={0.13}
        anchorX="center"
        anchorY="middle"
      >
        E_y
      </Text>
      <Text position={[1.02, topChargeY + 0.08, 0.02]} color="#ff7b99" fontSize={0.14} anchorX="center">
        +
      </Text>
      <Text
        position={[1.02, bottomChargeY - 0.08, 0.02]}
        color="#63a9ff"
        fontSize={0.14}
        anchorX="center"
      >
        -
      </Text>

      <Line points={MHD_LAYOUT.wires.top} color="#2a2a2a" lineWidth={2.2} />
      <Line points={MHD_LAYOUT.wires.bottom} color="#2a2a2a" lineWidth={2.2} />
      <mesh position={MHD_LAYOUT.load.bodyPosition}>
        <boxGeometry args={MHD_LAYOUT.load.bodySize} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.4} metalness={0.15} />
      </mesh>
    </group>
  )
}
