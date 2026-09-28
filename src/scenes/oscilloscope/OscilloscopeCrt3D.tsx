import { Line } from '@react-three/drei/core/Line'
import { useEffect, useMemo, useRef, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { buildBeamFlightTrailPoints, buildBeamPathPoints, deriveBeamPhase } from './beamPath'
import { buildCrtScreenGridSegments, mapDisplayPointToCrtScreen } from './screenGeometry'
import { BEAM_VISUAL_STYLE } from './beamVisual'

type OscilloscopeCrt3DProps = {
  beamX: number
  beamY: number
  timeCursor: number
  traceSegments: Array<Array<[number, number]>>
  running: boolean
}

const CRT_FOV_DEG = 34
const CRT_HORIZONTAL_BOUNDS = 11.5
const CRT_SCREEN_GRID = buildCrtScreenGridSegments()
const CRT_CAMERA_TARGET: [number, number, number] = [-1, 0, -0.42]

function CtrModel({ beamX, beamY, timeCursor, traceSegments, running }: OscilloscopeCrt3DProps) {
  const beamPoints = useMemo(() => buildBeamPathPoints(beamX, beamY), [beamX, beamY])
  const screenTraceSegments = useMemo(
    () => traceSegments.map((segment) => segment.map(mapDisplayPointToCrtScreen)),
    [traceSegments],
  )
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
        <meshStandardMaterial color="#12434a" emissive="#0b3d31" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>

      {CRT_SCREEN_GRID.map((points, index) => (
        <Line
          key={'crt-grid-' + index}
          points={points}
          color="#91c7ad"
          lineWidth={0.85}
          transparent
          opacity={0.32}
          depthTest={false}
        />
      ))}
      {screenTraceSegments.map((points, index) => (
        points.length >= 2 ? (
          <Line
            key={'crt-phosphor-trace-' + index}
            points={points}
            color="#baff63"
            lineWidth={2.2}
            transparent
            opacity={0.96}
            depthTest={false}
          />
        ) : null
      ))}

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

export function OscilloscopeCrt3D({ beamX, beamY, timeCursor, traceSegments, running }: OscilloscopeCrt3DProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(16 / 9)
  const distance = Math.max(
    7.2,
    (CRT_HORIZONTAL_BOUNDS / (2 * Math.tan((CRT_FOV_DEG * Math.PI) / 360) * Math.max(0.35, aspect))) * 1.1,
  )

  useEffect(() => {
    const surface = frameRef.current?.querySelector('.interactive-canvas-surface')
    if (!surface) return

    const updateAspect = () => {
      const { width, height } = surface.getBoundingClientRect()
      if (width > 0 && height > 0) setAspect(width / height)
    }
    updateAspect()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateAspect)
      return () => window.removeEventListener('resize', updateAspect)
    }
    const observer = new ResizeObserver(updateAspect)
    observer.observe(surface)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="h-full w-full">
      <InteractiveCanvas
        camera={{ position: [CRT_CAMERA_TARGET[0] - distance * 0.42, distance * 0.17, CRT_CAMERA_TARGET[2] + distance], fov: CRT_FOV_DEG }}
        controls={{ target: CRT_CAMERA_TARGET, minDistance: 3, maxDistance: Math.max(24, distance * 1.35) }}
        syncCamera
        adaptiveFraming={false}
        frameloop={running ? 'always' : 'demand'}
      >
        <CtrModel beamX={beamX} beamY={beamY} timeCursor={timeCursor} traceSegments={traceSegments} running={running} />
      </InteractiveCanvas>
    </div>
  )
}
