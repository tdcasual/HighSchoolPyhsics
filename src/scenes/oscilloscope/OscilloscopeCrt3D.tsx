import { Line } from '@react-three/drei/core/Line'
import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { buildBeamFlightTrailPoints, buildBeamPathPoints, deriveBeamPhase } from './beamPath'
import { BEAM_VISUAL_STYLE } from './beamVisual'

type OscilloscopeCrt3DProps = {
  beamX: number
  beamY: number
  timeCursor: number
  running: boolean
}

function CtrModel({ beamX, beamY, timeCursor, running }: OscilloscopeCrt3DProps) {
  const beamPoints = useMemo(() => buildBeamPathPoints(beamX, beamY), [beamX, beamY])
  const beamPhase = useMemo(() => deriveBeamPhase(timeCursor, running), [running, timeCursor])
  const flightTrailPoints = useMemo(
    () => buildBeamFlightTrailPoints(beamPoints, beamPhase, 14),
    [beamPhase, beamPoints],
  )
  const end = beamPoints[beamPoints.length - 1]
  const head = flightTrailPoints[flightTrailPoints.length - 1] ?? end

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 4, 8]} intensity={0.9} />
      <pointLight color="#a8f0ff" position={[3.2, 0, 0]} intensity={1.2} />

      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.1, 1.1, 8.6, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#b6dcff"
          transparent
          opacity={0.15}
          roughness={0.2}
          metalness={0}
          side={2}
          depthWrite={false}
          transmission={0.9}
        />
      </mesh>

      <mesh position={[3.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.97, 0.97, 0.08, 64]} />
        <meshStandardMaterial color="#88cde8" emissive="#79d2ce" emissiveIntensity={0.35} />
      </mesh>

      <mesh position={[-3.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.3, 0.9, 40]} />
        <meshStandardMaterial color="#dce8ef" metalness={0.25} roughness={0.45} />
      </mesh>

      <mesh position={[-2.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.85, 0.85, 0.09, 48]} />
        <meshStandardMaterial color="#4e8fc8" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[-2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.14, 24]} />
        <meshStandardMaterial color="#0f1419" />
      </mesh>

      <mesh position={[-1.3, 0.45, 0]}>
        <boxGeometry args={[1.5, 0.08, 0.75]} />
        <meshStandardMaterial color="#5c97c9" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[-1.3, -0.45, 0]}>
        <boxGeometry args={[1.5, 0.08, 0.75]} />
        <meshStandardMaterial color="#5c97c9" metalness={0.45} roughness={0.35} />
      </mesh>

      <mesh position={[0.55, 0, 0.45]}>
        <boxGeometry args={[1.3, 0.75, 0.08]} />
        <meshStandardMaterial color="#f7c548" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0.55, 0, -0.45]}>
        <boxGeometry args={[1.3, 0.75, 0.08]} />
        <meshStandardMaterial color="#f7c548" metalness={0.35} roughness={0.35} />
      </mesh>

      <Line
        points={beamPoints}
        color={BEAM_VISUAL_STYLE.pathColor}
        lineWidth={BEAM_VISUAL_STYLE.pathWidth}
        transparent
        opacity={0.55}
        depthTest={false}
      />
      <Line
        points={flightTrailPoints}
        color={BEAM_VISUAL_STYLE.trailColor}
        lineWidth={BEAM_VISUAL_STYLE.trailWidth}
        transparent
        opacity={0.95}
        depthTest={false}
      />
      <Line
        points={flightTrailPoints}
        color={BEAM_VISUAL_STYLE.trailHaloColor}
        lineWidth={BEAM_VISUAL_STYLE.haloWidth}
        transparent
        opacity={0.38}
        depthTest={false}
      />

      <mesh position={head}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#f7ffb3" />
      </mesh>

      <mesh position={end}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#dbff8d" />
      </mesh>

      <mesh position={[3.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.98, 0.03, 20, 80]} />
        <meshStandardMaterial color="#2f3e46" />
      </mesh>
      <mesh position={[-3.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.1, 0.03, 20, 80]} />
        <meshStandardMaterial color="#2f3e46" />
      </mesh>
    </group>
  )
}

export function OscilloscopeCrt3D({ beamX, beamY, timeCursor, running }: OscilloscopeCrt3DProps) {
  return (
    <InteractiveCanvas camera={{ position: [0, 1.25, 7.2], fov: 34 }}>
      <CtrModel beamX={beamX} beamY={beamY} timeCursor={timeCursor} running={running} />
    </InteractiveCanvas>
  )
}
