import { Arrow3D } from '../../scene3d/Arrow3D'
import { Line } from '../../scene3d/ClassroomLine'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import type { Vec3 } from '../../scene3d/orbitFraming'
import { diagramDepth, viewAngles, type CelestialPose, type SatellitePose } from './pose'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { SceneLabel } from '../../scene3d/SceneLabel'

const LAND: Array<number[] | 'all'> = [
  [13, 14],
  [7, 8, 9, 10, 12, 13, 14, 15, 27, 28, 29],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  [5, 6, 7, 8, 9, 10, 11, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33],
  [5, 6, 7, 8, 9, 10, 11, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
  [6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31],
  [7, 8, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29],
  [8, 9, 16, 17, 18, 19, 20, 21, 22, 25, 28],
  [10, 11, 12, 17, 18, 19, 20, 21, 28, 29],
  [10, 11, 12, 13, 19, 20, 21, 29, 30, 32],
  [11, 12, 13, 19, 20, 21, 22, 30, 31, 32],
  [11, 12, 19, 20, 21, 30, 31, 32],
  [11, 12, 19, 20, 31, 32],
  [11, 35],
  [],
  [11, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  'all',
  'all',
]

function BodySurface({ color, land, bodyId }: { color: string; land: string; bodyId: CelestialPose['bodyId'] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 360
    canvas.height = 180
    const context = canvas.getContext('2d')
    if (!context) return null
    context.fillStyle = color
    context.fillRect(0, 0, 360, 180)
    if (bodyId === 'earth') {
      context.fillStyle = land
      LAND.forEach((row, rowIndex) => {
        const y = rowIndex * 10
        if (row === 'all') {
          context.fillRect(0, y, 360, 10)
          return
        }
        row.forEach((column) => context.fillRect(column * 10, y, 10, 10))
      })
    } else {
      context.fillStyle = land
      context.beginPath()
      context.ellipse(120, 70, 46, 28, 0.4, 0, Math.PI * 2)
      context.ellipse(230, 110, 38, 22, -0.3, 0, Math.PI * 2)
      context.fill()
    }
    context.strokeStyle = 'rgba(255,255,255,0.72)'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(0, 90)
    context.lineTo(360, 90)
    context.stroke()
    context.strokeStyle = 'rgba(255,255,255,0.38)'
    context.lineWidth = 1
    for (let meridian = 0; meridian < 6; meridian += 1) {
      const x = (meridian / 6) * 360
      context.beginPath()
      context.moveTo(x, 8)
      context.lineTo(x, 172)
      context.stroke()
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    map.needsUpdate = true
    return map
  }, [bodyId, color, land])

  useEffect(() => () => texture?.dispose(), [texture])
  if (!texture) return <meshStandardMaterial color={color} roughness={0.68} />
  return (
    <meshStandardMaterial
      map={texture}
      color="#ffffff"
      roughness={0.68}
      metalness={0.04}
      emissive={bodyId === 'sun' ? color : '#000000'}
      emissiveIntensity={bodyId === 'sun' ? 0.35 : 0}
    />
  )
}

function alignX(direction: Vec3) {
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), new Vector3(...direction))
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w] as const
}

function splitByDepth(points: Vec3[], camera: Vector3) {
  const front: Vec3[][] = []
  const back: Vec3[][] = []
  let current: Vec3[] = []
  let behind = false
  const angles = viewAngles([camera.x, camera.y, camera.z])
  const behindOf = (point: Vec3) => diagramDepth(point, angles.azimuth, angles.elevation) > 0
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const isBehind = behindOf([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2])
    if (current.length === 0 || isBehind !== behind) {
      if (current.length > 1) (behind ? back : front).push(current)
      current = [start]
      behind = isBehind
    }
    current.push(end)
  }
  if (current.length > 1) (behind ? back : front).push(current)
  return { front, back }
}

function OrbitStroke({ points, color }: { points: Vec3[]; color: string }) {
  const camera = useThree((state) => state.camera)
  const [localCamera, setLocalCamera] = useState(() => new Vector3(0, 2, 8))
  const last = useRef(new Vector3())
  useFrame(() => {
    const next = camera.position
    if (next.distanceTo(last.current) < 0.04) return
    last.current.copy(next)
    setLocalCamera(next.clone())
  })
  const parts = useMemo(() => splitByDepth(points, localCamera), [points, localCamera])
  return (
    <group>
      {parts.back.map((segment, index) => (
        <Line
          key={`back-${index}`}
          points={segment}
          color={color}
          transparent
          opacity={0.28}
          dashed
          dashSize={0.16}
          gapSize={0.12}
          lineWidth={1}
        />
      ))}
      {parts.front.map((segment, index) => (
        <Line key={`front-${index}`} points={segment} color={color} lineWidth={1.5} />
      ))}
    </group>
  )
}

function satelliteMesh(satellite: SatellitePose) {
  return (
    <group key={satellite.id} name={satellite.id} position={satellite.position} quaternion={alignX(satellite.tangent)}>
      <mesh>
        <boxGeometry args={[0.22, 0.18, 0.16]} />
        <meshStandardMaterial color="#d6bd81" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh position={[-0.32, 0, 0]}>
        <boxGeometry args={[0.34, 0.16, 0.02]} />
        <meshStandardMaterial color="#447caa" />
      </mesh>
      <mesh position={[0.28, 0, 0]}>
        <boxGeometry args={[0.28, 0.16, 0.02]} />
        <meshStandardMaterial color="#447caa" />
      </mesh>
      <SceneLabel position={[0.35, 0.28, 0]} variant="text" color={satellite.color} center={false}>
        {satellite.label}
      </SceneLabel>
    </group>
  )
}

function vectorArrow(position: Vec3, direction: Vec3, length: number, color: string, name: string) {
  const unit = new Vector3(...direction).normalize()
  const tip: Vec3 = [
    position[0] + unit.x * (length + 0.07),
    position[1] + unit.y * (length + 0.07),
    position[2] + unit.z * (length + 0.07),
  ]
  return (
    <Arrow3D
      key={name}
      name={name}
      from={position}
      to={tip}
      color={color}
      headLength={0.14}
      headRadius={0.055}
      shaftRadius={0.0125}
      segments={8}
    />
  )
}

function AreaWedge({ points, color }: { points: Vec3[]; color: string }) {
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const vertices = new Float32Array((points.length + 1) * 3)
    points.forEach((point, index) => {
      vertices[(index + 1) * 3] = point[0]
      vertices[(index + 1) * 3 + 1] = point[1]
      vertices[(index + 1) * 3 + 2] = point[2]
    })
    const indices: number[] = []
    for (let index = 1; index < points.length; index += 1) indices.push(0, index, index + 1)
    geo.setAttribute('position', new BufferAttribute(vertices, 3))
    geo.setIndex(indices)
    return geo
  }, [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.18} side={DoubleSide} depthWrite={false} />
    </mesh>
  )
}

export function CelestialRig3D({ pose, night = false }: { pose: CelestialPose; night?: boolean }) {
  const ink = night ? '#dbe7f0' : '#15282e'
  return (
    <>
      <SceneBackdrop day="#e7eef0" night="#0b1020" />
      <hemisphereLight args={['#f4fbff', '#8ea0aa', 2.1]} />
      <directionalLight position={[6, 8, 4]} intensity={2.6} color="#fff8e8" />
      <directionalLight position={[-5, 2, -6]} intensity={0.7} color="#d7e8ff" />
      <group name="inertial" rotation={[0, pose.corotate ? -pose.spin : 0, 0]}>
        <group name="planet-spin" rotation={[0, pose.spin, 0]}>
          <mesh name="celestial-body" castShadow receiveShadow>
            <sphereGeometry args={[1, 48, 32]} />
            <BodySurface color={pose.bodyColor} land={pose.landColor} bodyId={pose.bodyId} />
          </mesh>
          {pose.station ? (
            <mesh name="ground-station" position={pose.station}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#0d5c63" />
            </mesh>
          ) : null}
        </group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.02, 0.01, 8, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
        </mesh>
        <mesh position={[0, 1.36, 0]} name="north-pole">
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={ink} />
        </mesh>
        <SceneLabel position={[0.12, 1.5, 0]} variant="text" color={ink} center={false}>
          N
        </SceneLabel>
        <SceneLabel position={[0, -1.35, 0]} variant="text" color={ink} size={14}>
          {pose.bodyId === 'moon' ? '月球' : pose.bodyId === 'sun' ? '太阳' : '地球'}
        </SceneLabel>
        <mesh>
          <cylinderGeometry args={[0.008, 0.008, 2.64, 8]} />
          <meshBasicMaterial color={ink} transparent opacity={0.45} />
        </mesh>
        {pose.showPlane ? (
          <group name="equator-plane">
            {[0.35, 0.68, 1].map((factor) => (
              <mesh key={factor} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[pose.planeRadius * factor, 0.008, 6, 80]} />
                <meshBasicMaterial color="#0d5c63" transparent opacity={0.35} />
              </mesh>
            ))}
          </group>
        ) : null}
        {pose.orbits.map((orbit) => (
          <group key={orbit.id} name={orbit.id}>
            <OrbitStroke points={orbit.points} color={orbit.color} />
          </group>
        ))}
        {pose.transfer ? (
          <group name="transfer-orbit">
            <OrbitStroke points={pose.transfer} color="#d9480f" />
          </group>
        ) : null}
        {pose.wedges.map((wedge, index) => (
          <AreaWedge key={index} points={wedge.points} color={wedge.color} />
        ))}
        {pose.periapsis ? (
          <group name="periapsis" position={pose.periapsis}>
            <mesh>
              <sphereGeometry args={[0.07, 14, 14]} />
              <meshBasicMaterial color="#0d5c63" />
            </mesh>
            <SceneLabel position={[0.16, -0.16, 0]} variant="text" color={ink} size={11} weight={400} center={false}>
              ① 加速点火
            </SceneLabel>
          </group>
        ) : null}
        {pose.apoapsis ? (
          <group name="apoapsis" position={pose.apoapsis}>
            <mesh>
              <sphereGeometry args={[0.07, 14, 14]} />
              <meshBasicMaterial color="#5dade2" />
            </mesh>
            <SceneLabel position={[0.16, -0.16, 0]} variant="text" color={ink} size={11} weight={400} center={false}>
              ② 再加速圆化
            </SceneLabel>
          </group>
        ) : null}
        {pose.subsatellite ? (
          <mesh name="subsatellite" position={pose.subsatellite}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color="#d9480f" />
          </mesh>
        ) : null}
        {pose.satellites.map((satellite) => satelliteMesh(satellite))}
        {pose.showVectors
          ? pose.satellites.flatMap((satellite) => {
              const inward: Vec3 = [-satellite.position[0], -satellite.position[1], -satellite.position[2]]
              const length = Math.hypot(...inward) || 1
              const gravity: Vec3 = [inward[0] / length, inward[1] / length, inward[2] / length]
              return [
                vectorArrow(satellite.position, satellite.tangent, 1.25, satellite.color, `${satellite.id}-velocity`),
                vectorArrow(satellite.position, gravity, 1.05, '#e74c3c', `${satellite.id}-gravity`),
              ]
            })
          : null}
      </group>
    </>
  )
}
