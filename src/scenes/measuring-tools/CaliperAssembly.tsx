import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import type { VernierDivisions } from './model'
import { FIXED_INNER_JAW, FIXED_OUTER_JAW, MOVING_INNER_JAW, MOVING_OUTER_JAW } from './instrumentGeometry'
import type { CaliperMeasure, CaliperPose } from './pose'
import { ScaleDecal } from './ScaleDecal'
import { MAIN_SCALE_SIZE, VERNIER_SCALE_SIZE, paintBrand, paintMainScale, paintVernier } from './scalePaint'

const STEEL = '#d3dadd'
const PLATE = '#c4ccd0'
const BRASS = '#c8a15a'

type CaliperAssemblyProps = {
  pose: CaliperPose
  divisions: VernierDivisions
  measure: CaliperMeasure
  workSize: number
  showWork: boolean
  showLabels: boolean
}

function Metal({ color, metalness = 0.85, roughness = 0.27 }: { color: string; metalness?: number; roughness?: number }) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
}

function Box({
  name,
  size,
  position,
  color,
  metalness,
  roughness,
}: {
  name?: string
  size: [number, number, number]
  position: [number, number, number]
  color: string
  metalness?: number
  roughness?: number
}) {
  return (
    <mesh name={name} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Metal color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function Jaw({ geometry }: { geometry: typeof FIXED_OUTER_JAW }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <Metal color={STEEL} />
    </mesh>
  )
}

function PartLabel({ position, children }: { position: [number, number, number]; children: string }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      <span className="measure-3d-label">{children}</span>
    </Html>
  )
}

function VernierDecal({ divisions }: { divisions: VernierDivisions }) {
  const paint = useMemo(() => paintVernier(divisions), [divisions])
  return (
    <ScaleDecal
      width={VERNIER_SCALE_SIZE.width}
      height={VERNIER_SCALE_SIZE.height}
      plane={VERNIER_SCALE_SIZE.plane}
      position={VERNIER_SCALE_SIZE.position}
      paint={paint}
    />
  )
}

function Workpiece({ measure, size }: { measure: CaliperMeasure; size: number }) {
  if (measure === 'inner') {
    return (
      <mesh position={[size / 2, 21, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[size / 2 + 2.2, 2.2, 12, 48]} />
        <Metal color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
    )
  }
  return (
    <mesh position={[size / 2, -(7 + size / 2), 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[size / 2, size / 2, 36, 48]} />
      <Metal color={BRASS} metalness={0.85} roughness={0.3} />
    </mesh>
  )
}

export function CaliperAssembly({ pose, divisions, measure, workSize, showWork, showLabels }: CaliperAssemblyProps) {
  return (
    <group name="caliper-root" rotation={[0, 0, pose.rootRotationZ]} position={pose.rootPosition}>
      <mesh name="caliper-beam" position={[96.5, 8, 0]} castShadow receiveShadow>
        <boxGeometry args={[237, 16, 3.5]} />
        <Metal color={STEEL} />
        <ScaleDecal
          width={MAIN_SCALE_SIZE.width}
          height={MAIN_SCALE_SIZE.height}
          plane={MAIN_SCALE_SIZE.plane}
          position={MAIN_SCALE_SIZE.position}
          paint={paintMainScale}
        />
        <ScaleDecal width={1024} height={96} plane={[44, 4.1]} position={[83.5, 4, 1.76]} paint={paintBrand} />
      </mesh>
      <Jaw geometry={FIXED_OUTER_JAW} />
      <Jaw geometry={FIXED_INNER_JAW} />
      <Box size={[8, 4, 1.75]} position={[-3, 18, 0.875]} color={STEEL} />
      <group name="caliper-frame" position={pose.frame}>
        <Box size={[62, 10, 1.25]} position={[27, 0, 2.375]} color={PLATE} metalness={0.72} roughness={0.36} />
        <Box size={[50, 4, 5.6]} position={[34, 18, 0.2]} color={PLATE} metalness={0.72} roughness={0.36} />
        <Box size={[62, 25, 1.25]} position={[27, 7.5, -2.375]} color={PLATE} metalness={0.72} roughness={0.36} />
        <Box size={[58, 5, 3.5]} position={[29, -2.5, 0]} color={PLATE} metalness={0.72} roughness={0.36} />
        <Jaw geometry={MOVING_OUTER_JAW} />
        <Jaw geometry={MOVING_INNER_JAW} />
        <VernierDecal divisions={divisions} />
        {Array.from({ length: 6 }, (_, index) => (
          <Box key={index} size={[1, 3.2, 4.2]} position={[47 + index * 1.8, -6.6, 0]} color="#8e999e" metalness={0.8} roughness={0.34} />
        ))}
        <group name="caliper-screw" position={pose.screw}>
          <mesh position={[0, 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.6, 1.6, 4, 24]} />
            <Metal color="#8e999e" metalness={0.8} roughness={0.34} />
          </mesh>
          <mesh position={[0, 5.6, 0]} rotation={[0, pose.screwHeadRotationY, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.3, 3.3, 3.2, 24]} />
            <Metal color="#6f7c82" metalness={0.6} roughness={0.45} />
          </mesh>
        </group>
        <Box name="caliper-rod" size={[165, 1.6, 0.9]} position={[132.5, 7.8, pose.rodZ]} color={STEEL} />
        {showLabels ? <PartLabel position={[22, -8, 4]}>游标尺</PartLabel> : null}
      </group>
      {showWork && !pose.showDepthWork ? (
        <group name="caliper-work" position={[0, 0, pose.workZ]}>
          <Workpiece measure={measure} size={workSize} />
        </group>
      ) : null}
      {showLabels ? <PartLabel position={[118, 20, 2]}>主尺</PartLabel> : null}
    </group>
  )
}

export function CaliperDepthWork({ pose, size, showWork }: { pose: CaliperPose; size: number; showWork: boolean }) {
  if (!showWork || !pose.showDepthWork) return null
  return (
    <group name="caliper-depth-work" position={pose.depthRoot}>
      <mesh position={[0, -size / 2, -8]} castShadow receiveShadow>
        <boxGeometry args={[60, size, 16]} />
        <Metal color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  )
}
