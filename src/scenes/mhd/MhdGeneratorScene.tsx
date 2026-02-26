import { Line } from '@react-three/drei/core/Line'
import { Text } from '@react-three/drei/core/Text'
import { useEffect, useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { MHD_LAYOUT } from './layout'
import {
  deriveChannelVisibilityConfig,
  deriveChargeSeparation,
  deriveMhdReadings,
  derivePolarizationTarget,
} from './model'
import { MhdControls } from './MhdControls'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import './mhd.css'

type MhdGenerator3DProps = {
  phase: number
  running: boolean
  chargeSeparation: number
  driveRatio: number
  plasmaDensityRatio: number
}

function MhdGenerator3D({
  phase,
  running,
  chargeSeparation,
  driveRatio,
  plasmaDensityRatio,
}: MhdGenerator3DProps) {
  const flowMarkers = useMemo(() => {
    const markers: Array<{ x: number; z: number; pulse: number }> = []
    const markerCount = 10

    MHD_LAYOUT.flow.lanes.forEach((lane, laneIndex) => {
      for (let i = 0; i < markerCount; i += 1) {
        const progress = (i / markerCount + phase) % 1
        markers.push({
          x: MHD_LAYOUT.flow.startX + progress * MHD_LAYOUT.flow.spanX,
          z: lane,
          pulse:
            0.55 +
            0.45 *
              Math.sin((phase * 2 + i * 0.11 + laneIndex * 0.17) * Math.PI * 2),
        })
      }
    })

    return markers
  }, [phase])

  const chargeCarriers = useMemo(() => {
    const carriers: Array<{ x: number; z: number; progress: number; jitter: number }> = []
    const carrierCount = Math.max(4, Math.round(5 + plasmaDensityRatio * 6))

    MHD_LAYOUT.flow.lanes.forEach((lane, laneIndex) => {
      for (let i = 0; i < carrierCount; i += 1) {
        const progress = (i / carrierCount + phase * 0.86) % 1
        carriers.push({
          x: MHD_LAYOUT.flow.startX + progress * MHD_LAYOUT.flow.spanX,
          z: lane + (((laneIndex + i) % 5) - 2) * 0.009,
          progress,
          jitter: (((i + laneIndex * 2) % 7) - 3) * 0.009,
        })
      }
    })

    return carriers
  }, [phase, plasmaDensityRatio])

  const magneticGuides = useMemo(
    () =>
      MHD_LAYOUT.magneticField.xGuides.map((x) => ({
        shaft: [
          [x, 0, MHD_LAYOUT.magneticField.zStart] as [number, number, number],
          [x, 0, MHD_LAYOUT.magneticField.zEnd] as [number, number, number],
        ] as [number, number, number][],
        tip: [x, 0, MHD_LAYOUT.magneticField.zEnd] as [number, number, number],
      })),
    [],
  )

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
  const channelVisibility = useMemo(() => deriveChannelVisibilityConfig(), [])

  const flowRibbonOpacity = running ? 0.48 : 0.26
  const transientDeflectionY = (0.14 + 0.26 * driveRatio) * (1 - chargeSeparation)
  const carrierOpacity = 0.35 + 0.55 * Math.max(chargeSeparation, driveRatio * 0.4)
  const plateChargeFill = chargeSeparation * plateChargeSites.length
  const innerFieldOpacity = 0.1 + 0.9 * chargeSeparation
  const magneticDeflectionOpacity = (0.2 + (1 - chargeSeparation) * 0.72) * Math.max(0.38, driveRatio)
  const topChargeY = MHD_LAYOUT.electrodes.topCenter[1] + MHD_LAYOUT.electrodes.size[1] / 2 + 0.024
  const bottomChargeY =
    MHD_LAYOUT.electrodes.bottomCenter[1] - MHD_LAYOUT.electrodes.size[1] / 2 - 0.024

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
            <coneGeometry args={[0.045, 0.18, 14]} />
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
            <coneGeometry args={[0.034, 0.14, 12]} />
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
        <coneGeometry args={[0.04, 0.16, 12]} />
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
        <coneGeometry args={[0.04, 0.16, 12]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={magneticDeflectionOpacity} />
      </mesh>

      {flowMarkers.map((arrow, index) => (
        <group key={`flow-${index}`} position={[arrow.x, 0, arrow.z]}>
          <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.34, 14]} />
            <meshBasicMaterial
              color="#ff84c8"
              transparent
              opacity={(running ? 0.45 : 0.25) + arrow.pulse * 0.5}
            />
          </mesh>
          <mesh position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.08, 0.24, 18]} />
            <meshBasicMaterial
              color="#ff5ea8"
              transparent
              opacity={(running ? 0.48 : 0.26) + arrow.pulse * 0.42}
            />
          </mesh>
        </group>
      ))}

      {chargeCarriers.map((carrier, index) => (
        <group key={`carrier-${index}`}>
          <mesh
            position={[
              carrier.x,
              carrier.jitter + transientDeflectionY * carrier.progress,
              carrier.z - 0.06,
            ]}
            renderOrder={channelVisibility.particleRenderOrder}
          >
            <sphereGeometry args={[0.03, 14, 14]} />
            <meshStandardMaterial
              color="#ff6f91"
              emissive="#ff2f65"
              emissiveIntensity={0.35 + chargeSeparation * 0.95}
              transparent
              opacity={carrierOpacity}
              depthWrite={false}
            />
          </mesh>
          <mesh
            position={[
              carrier.x,
              carrier.jitter - transientDeflectionY * carrier.progress,
              carrier.z + 0.06,
            ]}
            renderOrder={channelVisibility.particleRenderOrder}
          >
            <sphereGeometry args={[0.03, 14, 14]} />
            <meshStandardMaterial
              color="#6db5ff"
              emissive="#2a74ff"
              emissiveIntensity={0.35 + chargeSeparation * 0.95}
              transparent
              opacity={carrierOpacity}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {plateChargeSites.map((site, index) => (
        <group key={`plate-charge-${index}`}>
          {(() => {
            const siteFill = Math.min(1, Math.max(0, plateChargeFill - index))
            if (siteFill < 0.02) {
              return null
            }
            const scale = 0.82 + siteFill * 0.34
            const opacity = 0.12 + siteFill * 0.82
            return (
              <>
                <mesh
                  position={[site.x, topChargeY, site.z]}
                  scale={[scale, scale, scale]}
                  renderOrder={channelVisibility.particleRenderOrder}
                >
                  <sphereGeometry args={[0.026, 12, 12]} />
                  <meshBasicMaterial
                    color="#ff4f7b"
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                  />
                </mesh>
                <mesh
                  position={[site.x, bottomChargeY, site.z]}
                  scale={[scale, scale, scale]}
                  renderOrder={channelVisibility.particleRenderOrder}
                >
                  <sphereGeometry args={[0.026, 12, 12]} />
                  <meshBasicMaterial
                    color="#5da8ff"
                    transparent
                    opacity={opacity}
                    depthWrite={false}
                  />
                </mesh>
              </>
            )
          })()}
        </group>
      ))}

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

export function MhdGeneratorScene() {
  const [magneticFieldT, setMagneticFieldT] = useState(1.5)
  const [plasmaVelocityMps, setPlasmaVelocityMps] = useState(2000)
  const [plasmaDensityRatio, setPlasmaDensityRatio] = useState(1)
  const [electrodeGapM, setElectrodeGapM] = useState(0.4)
  const [conductivitySPerM, setConductivitySPerM] = useState(18)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [chargeSeparation, setChargeSeparation] = useState(0)

  const driveRatio = useMemo(
    () =>
      derivePolarizationTarget({
        magneticFieldT,
        plasmaVelocityMps,
      }),
    [magneticFieldT, plasmaVelocityMps],
  )

  useEffect(() => {
    if (!running) {
      return
    }

    let frameId = 0
    let previous = performance.now()

    const frame = (now: number) => {
      const deltaS = Math.min(0.05, (now - previous) / 1000)
      previous = now
      setPhase((value) => (value + deltaS * 0.36) % 1)
      setChargeSeparation((value) =>
        deriveChargeSeparation({
          previous: value,
          deltaS,
          running: true,
          responseTimeS: 0.9,
          targetWhenRunning: driveRatio,
        }),
      )
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [driveRatio, running])

  const readings = useMemo(
    () =>
      deriveMhdReadings({
        magneticFieldT,
        plasmaVelocityMps,
        electrodeGapM,
        conductivitySPerM: conductivitySPerM * plasmaDensityRatio,
      }),
    [conductivitySPerM, electrodeGapM, magneticFieldT, plasmaDensityRatio, plasmaVelocityMps],
  )

  const voltageDisplayV = Math.abs(readings.outputVoltageV)

  const reset = () => {
    setRunning(false)
    setPhase(0)
    setChargeSeparation(0)
  }

  return (
    <SceneLayout
      controls={
        <MhdControls
          magneticFieldT={magneticFieldT}
          onMagneticFieldChange={setMagneticFieldT}
          plasmaVelocityMps={plasmaVelocityMps}
          onPlasmaVelocityChange={setPlasmaVelocityMps}
          plasmaDensityRatio={plasmaDensityRatio}
          onPlasmaDensityChange={setPlasmaDensityRatio}
          electrodeGapM={electrodeGapM}
          onElectrodeGapChange={setElectrodeGapM}
          conductivitySPerM={conductivitySPerM}
          onConductivityChange={setConductivitySPerM}
          running={running}
          onToggleRunning={() => setRunning((value) => !value)}
          onReset={reset}
          voltageDisplayV={voltageDisplayV}
        />
      }
      viewport={
        <InteractiveCanvas camera={{ position: [0, 1.8, 6.8], fov: 39 }}>
          <MhdGenerator3D
            phase={phase}
            running={running}
            chargeSeparation={chargeSeparation}
            driveRatio={driveRatio}
            plasmaDensityRatio={plasmaDensityRatio}
          />
        </InteractiveCanvas>
      }
    />
  )
}
