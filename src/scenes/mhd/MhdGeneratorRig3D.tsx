import { Line } from '../../scene3d/ClassroomLine'
import { useMemo, type ReactNode } from 'react'
import { deriveMhdLayout, MHD_LAYOUT } from './layout'
import { deriveChannelVisibilityConfig, deriveMhdFlowAnimationScale } from './model'
import { getGeometryDetail } from '../../scene3d/canvasQuality'
import { SceneLabel } from '../../scene3d/SceneLabel'
import { ChargeCarriers, FlowMarkers, PlateCharges } from './MhdPlasma'

type MhdGeneratorRig3DProps = {
  plasmaVelocityMps: number
  running: boolean
  chargeSeparation: number
  driveRatio: number
  plasmaDensityRatio: number
  electrodeGapM: number
}

const channelVisibility = deriveChannelVisibilityConfig()

/** `fontSize` is in scene units (×64 px). */

/** `fontSize` is in scene units (×64 px). */
function MhdWorldLabel({ position, color, fontSize, children }: { position: [number, number, number]; color: string; fontSize: number; children: ReactNode }) {
  return <SceneLabel position={position} variant="text" color={color} size={Math.max(10, Math.round(fontSize * 64))} halo="dark" distanceFactor={8}>{children}</SceneLabel>
}


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
  electrodeGapM,
  plasmaVelocityMps,
}: MhdGeneratorRig3DProps) {
  const layout = useMemo(() => deriveMhdLayout(electrodeGapM), [electrodeGapM])
  const flowRibbonOpacity = running ? 0.48 : 0.26
  const innerFieldOpacity = 0.1 + 0.9 * chargeSeparation
  const magneticDeflectionOpacity = (0.2 + (1 - chargeSeparation) * 0.72) * Math.max(0.38, driveRatio)
  const topChargeY = layout.electrodes.topCenter[1] + layout.electrodes.size[1] / 2 + 0.024
  const bottomChargeY = layout.electrodes.bottomCenter[1] - layout.electrodes.size[1] / 2 - 0.024
  const flowRateScale = deriveMhdFlowAnimationScale(plasmaVelocityMps)
  const electricArrowLength = Math.min(0.14, layout.channel.size[1] * 0.18)
  const lorentzArrowLength = Math.min(0.26, layout.channel.size[1] * 0.62)
  const lorentzArrowHeadLength = Math.min(0.16, lorentzArrowLength * 0.48)
  const lorentzArrowHalf = lorentzArrowLength / 2

  const geoDetail = getGeometryDetail()

  return (
    <group>
      <ambientLight intensity={0.82} />
      <directionalLight position={[4.5, 5.5, 3]} intensity={1.15} />
      <pointLight position={[0, 0.2, 1.8]} intensity={0.72} color="#8ce6ff" />

      <mesh position={layout.magnets.northPosition}>
        <boxGeometry args={layout.magnets.size} />
        <meshStandardMaterial color="#c33232" metalness={0.18} roughness={0.5} />
      </mesh>
      <mesh position={layout.magnets.southPosition}>
        <boxGeometry args={layout.magnets.size} />
        <meshStandardMaterial color="#266eb5" metalness={0.2} roughness={0.45} />
      </mesh>

      <MhdWorldLabel
        position={[0, 0, layout.magnets.northPosition[2] + layout.magnets.size[2] / 2 + 0.012]}
        color="#ffffff"
        fontSize={0.28}


      >
        N
      </MhdWorldLabel>
      <MhdWorldLabel
        position={[0, 0, layout.magnets.southPosition[2] + layout.magnets.size[2] / 2 + 0.012]}
        color="#ffffff"
        fontSize={0.28}


      >
        S
      </MhdWorldLabel>

      <mesh
        position={layout.electrodes.topCenter}
        rotation={[0, layout.electrodes.topRotationY, 0]}
      >
        <boxGeometry args={layout.electrodes.size} />
        <meshStandardMaterial color="#d7cd9d" metalness={0.25} roughness={0.52} />
      </mesh>
      <mesh
        position={layout.electrodes.bottomCenter}
        rotation={[0, layout.electrodes.bottomRotationY, 0]}
      >
        <boxGeometry args={layout.electrodes.size} />
        <meshStandardMaterial color="#d7cd9d" metalness={0.25} roughness={0.52} />
      </mesh>
      <MhdWorldLabel position={[0, layout.electrodes.topCenter[1] + layout.electrodes.size[1] / 2 + 0.1, -0.5]} color="#2a2a2a" fontSize={0.2}  >
        A (−)
      </MhdWorldLabel>
      <MhdWorldLabel position={[0, layout.electrodes.bottomCenter[1] - layout.electrodes.size[1] / 2 - 0.1, 0]} color="#2a2a2a" fontSize={0.2}  >
        B (+)
      </MhdWorldLabel>

      <mesh position={layout.channel.center} renderOrder={channelVisibility.channelRenderOrder}>
        <boxGeometry args={layout.channel.size} />
        <meshStandardMaterial
          color="#7ddff6"
          transparent
          opacity={channelVisibility.fluidOpacity}
          roughness={0.22}
          metalness={0.02}
          depthWrite={channelVisibility.depthWrite}
        />
      </mesh>
      <mesh position={layout.channel.center} renderOrder={channelVisibility.channelRenderOrder + 1}>
        <boxGeometry args={layout.channel.size} />
        <meshBasicMaterial
          color="#a6efff"
          transparent
          opacity={channelVisibility.wireframeOpacity}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {layout.flow.lanes.map((lane, index) => (
        <Line
          key={`flow-ribbon-${index}`}
          points={[
            [layout.flow.startX - 0.18, 0, lane],
            [layout.flow.startX + layout.flow.spanX + 0.18, 0, lane],
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

      {layout.magneticField.xGuides.map((x, index) => (
        <group key={`e-field-${index}`}>
          <Line
            points={[
              [x, layout.magneticField.yStart, 0.18],
              [x, layout.magneticField.yEnd, 0.18],
            ]}
            color="#90f5ff"
            lineWidth={2.1}
            transparent
            opacity={innerFieldOpacity}
          />
          <mesh position={[x, layout.magneticField.yEnd - electricArrowLength / 2, 0.18]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.034, electricArrowLength, geoDetail.coneRadialSegments]} />
            <meshBasicMaterial color="#90f5ff" transparent opacity={innerFieldOpacity} />
          </mesh>
        </group>
      ))}

      <Line
        points={[
          [-0.54, lorentzArrowHalf, -0.22],
          [-0.54, -lorentzArrowHalf, -0.22],
        ]}
        color="#ffb066"
        lineWidth={2.4}
        transparent
        opacity={magneticDeflectionOpacity}
      />
      <mesh position={[-0.54, -lorentzArrowHalf + lorentzArrowHeadLength / 2, -0.22]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[Math.min(0.04, lorentzArrowHeadLength * 0.45), lorentzArrowHeadLength, geoDetail.coneRadialSegments]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={magneticDeflectionOpacity} />
      </mesh>
      <Line
        points={[
          [0.54, -lorentzArrowHalf, 0.22],
          [0.54, lorentzArrowHalf, 0.22],
        ]}
        color="#ffb066"
        lineWidth={2.4}
        transparent
        opacity={magneticDeflectionOpacity}
      />
      <mesh position={[0.54, lorentzArrowHalf - lorentzArrowHeadLength / 2, 0.22]}>
        <coneGeometry args={[Math.min(0.04, lorentzArrowHeadLength * 0.45), lorentzArrowHeadLength, geoDetail.coneRadialSegments]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={magneticDeflectionOpacity} />
      </mesh>
      <MhdWorldLabel position={[-0.84, 0, -0.22]} color="#ffb066" fontSize={0.1}>
        q+ · F<sub>B</sub> ↓
      </MhdWorldLabel>
      <MhdWorldLabel position={[0.5, 0, 0.22]} color="#ffb066" fontSize={0.1}>
        q− · F<sub>B</sub> ↑
      </MhdWorldLabel>

      <FlowMarkers running={running} flowRateScale={flowRateScale} />

      <ChargeCarriers
        running={running}
        plasmaDensityRatio={plasmaDensityRatio}
        chargeSeparation={chargeSeparation}
        driveRatio={driveRatio}
        flowRateScale={flowRateScale}
        electrodeGapM={electrodeGapM}
      />

      <PlateCharges
        chargeSeparation={chargeSeparation}
        topChargeY={topChargeY}
        bottomChargeY={bottomChargeY}
      />

      <MhdWorldLabel
        position={[-0.95, 0.12, 0.58]}
        color="#fff4b8"
        fontSize={0.16}


      >
        B
      </MhdWorldLabel>
      <MhdWorldLabel
        position={[-1.42, 0.38, 0]}
        color="#d62f93"
        fontSize={0.17}


      >
        v
      </MhdWorldLabel>
      <MhdWorldLabel
        position={[-0.8, 0.5, 0.2]}
        color="#abf6ff"
        fontSize={0.13}


      >
        E<sub>ind</sub> ↑
      </MhdWorldLabel>
      <Line points={layout.wires.top} color="#2a2a2a" lineWidth={2.2} />
      <Line points={layout.wires.bottom} color="#2a2a2a" lineWidth={2.2} />
      <mesh position={layout.load.bodyPosition}>
        <boxGeometry args={layout.load.bodySize} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.4} metalness={0.15} />
      </mesh>
      <Line points={[[2.18, -0.18, 0.72], [2.18, 0.18, 0.72]]} color="#e77b42" lineWidth={2} />
      <mesh position={[2.18, 0.18, 0.72]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.035, 0.12, geoDetail.coneRadialSegments]} />
        <meshBasicMaterial color="#e77b42" />
      </mesh>
      <MhdWorldLabel position={[2.08, 0.3, 0.72]} color="#b95a2a" fontSize={0.1} >
        I<sub>L</sub> ↑
      </MhdWorldLabel>
      <MhdWorldLabel position={[2.32, 0.12, 0.51]} color="#333333" fontSize={0.1}  >
        R<sub>L</sub>
      </MhdWorldLabel>
    </group>
  )
}
