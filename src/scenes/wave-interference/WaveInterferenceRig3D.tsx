import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei/core/Line'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Plane, Vector2, Vector3 } from 'three'
import type { Mesh, ShaderMaterial } from 'three'
import {
  waveVertexShader,
  waveFragmentShader,
} from './shaders'
import {
  buildHyperbolaPoints,
  calcWaveDisplacement,
  createObserverBuffer,
  GRID_SIZE,
  ringPush,
  type ObserverBuffer,
  type Vec2,
  type WaveParams,
} from './model'

type RigProps = WaveParams & {
  isPlaying: boolean
  playSpeed: number
  observerBuffer: ObserverBuffer | null
  setSource1: (v: Vec2) => void
  setSource2: (v: Vec2) => void
  setObserverBuffer: (b: ObserverBuffer | null) => void
  showConstructive: boolean
  showDestructive: boolean
  _tickSyncRef: { current: () => void }
}

const HALF_GRID = GRID_SIZE / 2
const DRAG_LIMIT = HALF_GRID - 0.2
const DIR_LIGHT_POS: [number, number, number] = [5, 10, 5]

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

const dragPlane = new Plane(new Vector3(0, 1, 0), 0)
const dragHitPoint = new Vector3()

/* ─── Wave Surface (ShaderMaterial) ─── */

const WaveSurface = memo(function WaveSurface({
  source1, source2, wavelength1, wavelength2,
  amplitude1, amplitude2, phaseDiff, waveSpeed,
  isPlaying, playSpeed,
}: WaveParams & { isPlaying: boolean; playSpeed: number }) {
  const matRef = useRef<ShaderMaterial>(null)
  const timeRef = useRef(0)
  const isPlayingRef = useRef(isPlaying)
  const playSpeedRef = useRef(playSpeed)
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { playSpeedRef.current = playSpeed }, [playSpeed])

  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uSource1: { value: new Vector2(source1.x, source1.z) },
    uSource2: { value: new Vector2(source2.x, source2.z) },
    uWavelength1: { value: wavelength1 },
    uWavelength2: { value: wavelength2 },
    uAmplitude1: { value: amplitude1 },
    uAmplitude2: { value: amplitude2 },
    uPhaseDiff: { value: phaseDiff },
    uWaveSpeed: { value: waveSpeed },
  }))

  useEffect(() => {
    const u = matRef.current?.uniforms
    if (!u) return
    ;(u.uSource1.value as Vector2).set(source1.x, source1.z)
    ;(u.uSource2.value as Vector2).set(source2.x, source2.z)
    u.uWavelength1.value = wavelength1
    u.uWavelength2.value = wavelength2
    u.uAmplitude1.value = amplitude1
    u.uAmplitude2.value = amplitude2
    u.uPhaseDiff.value = phaseDiff
    u.uWaveSpeed.value = waveSpeed
  }, [source1, source2, wavelength1, wavelength2, amplitude1, amplitude2, phaseDiff, waveSpeed])

  useFrame((_, delta) => {
    if (isPlayingRef.current) {
      timeRef.current += delta * playSpeedRef.current
      const mat = matRef.current
      if (mat) mat.uniforms.uTime.value = timeRef.current
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[GRID_SIZE, GRID_SIZE, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        uniforms={uniforms}
        side={2}
      />
    </mesh>
  )
})

/* ─── Wave Source (draggable sphere) ─── */

const WaveSource = memo(function WaveSource({
  position, color,
  onDrag,
}: {
  position: Vec2
  color: string
  label: string
  onDrag: (v: Vec2) => void
}) {
  const [dragging, setDragging] = useState(false)

  const capturePointer = (e: ThreeEvent<PointerEvent>) => {
    const t = e.nativeEvent.target
    if (t instanceof Element) t.setPointerCapture(e.pointerId)
  }
  const releasePointer = (e: ThreeEvent<PointerEvent>) => {
    const t = e.nativeEvent.target
    if (t instanceof Element) t.releasePointerCapture(e.pointerId)
  }

  const applyDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!e.ray.intersectPlane(dragPlane, dragHitPoint)) return
    onDrag({
      x: Number(clamp(dragHitPoint.x, -DRAG_LIMIT, DRAG_LIMIT).toFixed(2)),
      z: Number(clamp(dragHitPoint.z, -DRAG_LIMIT, DRAG_LIMIT).toFixed(2)),
    })
  }

  return (
    <group position={[position.x, 0, position.z]}>
      {/* visible sphere */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dragging ? 0.7 : 0.4}
        />
      </mesh>

      {/* hit area */}
      <mesh
        position={[0, 0.08, 0]}
        onPointerDown={(e) => {
          e.stopPropagation()
          capturePointer(e)
          setDragging(true)
          applyDrag(e)
        }}
        onPointerMove={(e) => {
          if (!dragging) return
          e.stopPropagation()
          applyDrag(e)
        }}
        onPointerUp={(e) => {
          if (!dragging) return
          e.stopPropagation()
          releasePointer(e)
          setDragging(false)
        }}
        onPointerCancel={() => setDragging(false)}
      >
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.1, 0.12, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={2} />
      </mesh>
    </group>
  )
})

/* ─── Observer Point (draggable marker) ─── */

function ObserverPoint({
  observerBuffer, waveSpeed, wavelength1, wavelength2,
  amplitude1, amplitude2, phaseDiff, source1, source2,
  isPlaying, playSpeed, setObserverBuffer, tickSyncRef,
}: {
  observerBuffer: ObserverBuffer
  waveSpeed: number
  wavelength1: number
  wavelength2: number
  amplitude1: number
  amplitude2: number
  phaseDiff: number
  source1: Vec2
  source2: Vec2
  isPlaying: boolean
  playSpeed: number
  setObserverBuffer: (b: ObserverBuffer | null) => void
  tickSyncRef: { current: () => void }
}) {
  const timeRef = useRef(0)
  const headMeshRef = useRef<Mesh>(null)
  const [dragging, setDragging] = useState(false)
  const isPlayingRef = useRef(isPlaying)
  const playSpeedRef = useRef(playSpeed)
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { playSpeedRef.current = playSpeed }, [playSpeed])

  const paramsRef = useRef({ wavelength1, wavelength2, amplitude1, amplitude2, phaseDiff, source1, source2, waveSpeed })
  useEffect(() => {
    paramsRef.current = { wavelength1, wavelength2, amplitude1, amplitude2, phaseDiff, source1, source2, waveSpeed }
  }, [wavelength1, wavelength2, amplitude1, amplitude2, phaseDiff, source1, source2, waveSpeed])

  const bufferRef = useRef(observerBuffer)
  useEffect(() => { bufferRef.current = observerBuffer }, [observerBuffer])

  const setObserverBufferRef = useRef(setObserverBuffer)
  useEffect(() => { setObserverBufferRef.current = setObserverBuffer }, [setObserverBuffer])

  useFrame((_, delta) => {
    if (isPlayingRef.current) {
      timeRef.current += delta * playSpeedRef.current
    }
    const buf = bufferRef.current
    const p = paramsRef.current
    const t = timeRef.current

    const y1 = calcWaveDisplacement(buf, p.source1, t, p.wavelength1, p.amplitude1, 0)
    const y2 = calcWaveDisplacement(buf, p.source2, t, p.wavelength2, p.amplitude2, p.phaseDiff)
    const yTotal = y1 + y2

    ringPush(buf, yTotal, y1, y2)
    if (headMeshRef.current) {
      headMeshRef.current.position.y = 1 + yTotal * 3
    }

    // Throttled React sync
    tickSyncRef.current()
  })

  const capturePointer = (e: ThreeEvent<PointerEvent>) => {
    const t = e.nativeEvent.target
    if (t instanceof Element) t.setPointerCapture(e.pointerId)
  }
  const releasePointer = (e: ThreeEvent<PointerEvent>) => {
    const t = e.nativeEvent.target
    if (t instanceof Element) t.releasePointerCapture(e.pointerId)
  }

  const applyDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!e.ray.intersectPlane(dragPlane, dragHitPoint)) return
    const nx = Number(clamp(dragHitPoint.x, -DRAG_LIMIT, DRAG_LIMIT).toFixed(2))
    const nz = Number(clamp(dragHitPoint.z, -DRAG_LIMIT, DRAG_LIMIT).toFixed(2))
    setObserverBufferRef.current(createObserverBuffer(nx, nz))
  }

  return (
    <group position={[observerBuffer.x, 0, observerBuffer.z]}>
      {/* vertical pole */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 12]} />
        <meshBasicMaterial color="#8b5cf6" />
      </mesh>

      {/* head sphere */}
      <mesh ref={headMeshRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#8b5cf6" />
      </mesh>

      {/* ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.18, 0.3, 24]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.9} side={2} />
      </mesh>

      {/* center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.6} side={2} />
      </mesh>

      {/* hit area for dragging */}
      <mesh
        position={[0, 0.25, 0]}
        onPointerDown={(e) => {
          e.stopPropagation()
          capturePointer(e)
          setDragging(true)
        }}
        onPointerMove={(e) => {
          if (!dragging) return
          e.stopPropagation()
          applyDrag(e)
        }}
        onPointerUp={(e) => {
          if (!dragging) return
          e.stopPropagation()
          releasePointer(e)
          setDragging(false)
        }}
        onPointerCancel={() => setDragging(false)}
      >
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ─── Interference Lines (hyperbolas via drei Line) ─── */

const InterferenceLines = memo(function InterferenceLines({
  source1, source2, wavelength1, wavelength2,
  showConstructive, showDestructive,
}: {
  source1: Vec2
  source2: Vec2
  wavelength1: number
  wavelength2: number
  showConstructive: boolean
  showDestructive: boolean
}) {
  const d = Math.sqrt((source2.x - source1.x) ** 2 + (source2.z - source1.z) ** 2)
  const avgLambda = (wavelength1 + wavelength2) / 2

  const constructivePts = useMemo(() => {
    if (!showConstructive) return []
    const result: Array<[number, number, number][]> = []
    for (let n = 0; n * avgLambda < d; n++) {
      const pts = buildHyperbolaPoints(source1, source2, (n * avgLambda) / 2)
      if (pts.length >= 2) result.push(pts)
    }
    return result
  }, [source1, source2, avgLambda, d, showConstructive])

  const destructivePts = useMemo(() => {
    if (!showDestructive) return []
    const result: Array<[number, number, number][]> = []
    for (let n = 0; (n + 0.5) * avgLambda < d; n++) {
      const pts = buildHyperbolaPoints(source1, source2, ((n + 0.5) * avgLambda) / 2)
      if (pts.length >= 2) result.push(pts)
    }
    return result
  }, [source1, source2, avgLambda, d, showDestructive])

  return (
    <group>
      {constructivePts.map((pts, i) => (
        <Line key={`c-${i}`} points={pts} color="#ef4444" lineWidth={1.5} transparent opacity={0.5} />
      ))}
      {destructivePts.map((pts, i) => (
        <Line key={`d-${i}`} points={pts} color="#3b82f6" lineWidth={1.5} transparent opacity={0.5} />
      ))}
    </group>
  )
})

/* ─── Wave surface click → place observer ─── */

const WaveSurfaceClickPlane = memo(function WaveSurfaceClickPlane({ setObserverBuffer }: { setObserverBuffer: (b: ObserverBuffer | null) => void }) {
  return (
    <mesh
      position={[0, -0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        if (!e.nativeEvent.shiftKey) return
        e.stopPropagation()
        const x = clamp(e.point.x, -DRAG_LIMIT, DRAG_LIMIT)
        const z = clamp(e.point.z, -DRAG_LIMIT, DRAG_LIMIT)
        setObserverBuffer(createObserverBuffer(Number(x.toFixed(2)), Number(z.toFixed(2))))
      }}
    >
      <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
})

/* ─── Main Rig ─── */

export const WaveInterferenceRig3D = memo(function WaveInterferenceRig3D(props: RigProps) {
  const {
    source1, source2, wavelength1, wavelength2,
    amplitude1, amplitude2, phaseDiff, waveSpeed,
    isPlaying, playSpeed, observerBuffer,
    setSource1, setSource2, setObserverBuffer,
    showConstructive, showDestructive,
    _tickSyncRef,
  } = props

  return (
    <group>
      <ambientLight intensity={1.5} />
      <directionalLight position={DIR_LIGHT_POS} intensity={1} />

      <gridHelper args={[GRID_SIZE, 20, '#cbd5e1', '#e2e8f0']} />

      <WaveSurface
        source1={source1} source2={source2}
        wavelength1={wavelength1} wavelength2={wavelength2}
        amplitude1={amplitude1} amplitude2={amplitude2}
        phaseDiff={phaseDiff} waveSpeed={waveSpeed}
        isPlaying={isPlaying} playSpeed={playSpeed}
      />

      <WaveSource
        position={source1} color="#ef4444" label="S₁"
        onDrag={setSource1}
      />
      <WaveSource
        position={source2} color="#3b82f6" label="S₂"
        onDrag={setSource2}
      />

      {observerBuffer && (
        <ObserverPoint
          observerBuffer={observerBuffer}
          waveSpeed={waveSpeed}
          wavelength1={wavelength1} wavelength2={wavelength2}
          amplitude1={amplitude1} amplitude2={amplitude2}
          phaseDiff={phaseDiff}
          source1={source1} source2={source2}
          isPlaying={isPlaying} playSpeed={playSpeed}
          setObserverBuffer={setObserverBuffer}
          tickSyncRef={_tickSyncRef}
        />
      )}

      <InterferenceLines
        source1={source1} source2={source2}
        wavelength1={wavelength1} wavelength2={wavelength2}
        showConstructive={showConstructive}
        showDestructive={showDestructive}
      />

      <WaveSurfaceClickPlane setObserverBuffer={setObserverBuffer} />
    </group>
  )
})
