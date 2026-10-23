import { SceneLabel } from '../../scene3d/SceneLabel'
import { useMemo } from 'react'
import { CALIPER_RANGE_MM, type VernierDivisions } from './model'
import { createAxisDragHandlers } from './axisDrag'
import { FIXED_INNER_JAW, FIXED_OUTER_JAW, MOVING_INNER_JAW, MOVING_OUTER_JAW } from './instrumentGeometry'
import { CALIPER_INNER_CONTACT_Y, type CaliperMeasure, type CaliperPose, type ViewPreset } from './pose'
import { ScaleDecal } from './ScaleDecal'
import { MAIN_SCALE_SIZE, VERNIER_SCALE_SIZE, paintMainScale, paintVernier } from './scalePaint'

const STEEL = '#c3cbcf'
const PLATE = '#b8c1c6'
const BRASS = '#c8a15a'

type CaliperAssemblyProps = {
  pose: CaliperPose
  divisions: VernierDivisions
  measure: CaliperMeasure
  workSize: number
  showWork: boolean
  showLabels: boolean
  viewPreset?: ViewPreset
  locked?: boolean
  onCaliperXChange?: (value: number) => void
  onInstrumentDragChange?: (dragging: boolean) => void
}

function Metal({
  color,
  metalness = 0.85,
  roughness = 0.27,
}: {
  color: string
  metalness?: number
  roughness?: number
}) {
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
      <Metal color={STEEL} metalness={0.6} roughness={0.36} />
    </mesh>
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
      <mesh position={[size / 2, CALIPER_INNER_CONTACT_Y, 0]} castShadow receiveShadow>
        <torusGeometry args={[size / 2 + 2.2, 2.2, 12, 48]} />
        <Metal color={BRASS} metalness={0.32} roughness={0.55} />
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

export function CaliperAssembly({
  pose,
  divisions,
  measure,
  workSize,
  showWork,
  showLabels,
  viewPreset = 'home',
  locked = false,
  onCaliperXChange,
  onInstrumentDragChange,
}: CaliperAssemblyProps) {
  const dragHandlers = onCaliperXChange
    ? createAxisDragHandlers({
        value: pose.frame[0],
        min: 0,
        max: CALIPER_RANGE_MM,
        locked,
        onValueChange: onCaliperXChange,
        onDraggingChange: onInstrumentDragChange,
        onLockedAttempt: () => onCaliperXChange(pose.frame[0]),
      })
    : {}

  return (
    <group name="caliper-root" rotation={[0, 0, pose.rootRotationZ]} position={pose.rootPosition}>
      <mesh name="caliper-beam" position={[96.5, 8, 0]} castShadow receiveShadow>
        <boxGeometry args={[237, 16, 3.5]} />
        <Metal color={STEEL} metalness={0.55} roughness={0.42} />
        <ScaleDecal
          width={MAIN_SCALE_SIZE.width}
          height={MAIN_SCALE_SIZE.height}
          plane={MAIN_SCALE_SIZE.plane}
          position={MAIN_SCALE_SIZE.position}
          paint={paintMainScale}
        />
      </mesh>
      <Jaw geometry={FIXED_OUTER_JAW} />
      <Jaw geometry={FIXED_INNER_JAW} />
      <Box size={[8, 4, 1.6]} position={[-3, 18, 0.875]} color={STEEL} metalness={0.6} roughness={0.36} />
      <group name="caliper-frame" position={pose.frame} {...dragHandlers}>
        <Box size={[62, 10, 1.25]} position={[27, 0, 2.375]} color={PLATE} metalness={0.5} roughness={0.44} />
        <Box size={[50, 4, 5.6]} position={[34, 18, 0.2]} color={PLATE} metalness={0.72} roughness={0.36} />
        <Box size={[62, 25, 1.25]} position={[27, 7.5, -2.375]} color={PLATE} metalness={0.5} roughness={0.44} />
        <Box size={[58, 5, 3.5]} position={[29, -2.5, 0]} color={PLATE} metalness={0.72} roughness={0.36} />
        <Jaw geometry={MOVING_OUTER_JAW} />
        <Jaw geometry={MOVING_INNER_JAW} />
        <VernierDecal divisions={divisions} />
        {Array.from({ length: 6 }, (_, index) => (
          <Box
            key={index}
            size={[1, 3.2, 4.2]}
            position={[47 + index * 1.8, -6.6, 0]}
            color="#8e999e"
            metalness={0.8}
            roughness={0.34}
          />
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
        {showLabels ? (
          <SceneLabel position={viewPreset === 'focus' ? [6, -12, 4] : [8, -42, 4]}>游标尺</SceneLabel>
        ) : null}
        {showLabels && measure === 'inner' ? (
          <SceneLabel position={[0, viewPreset === 'focus' ? 29 : 50, 4]}>移动内爪</SceneLabel>
        ) : null}
        {showLabels && measure === 'outer' && viewPreset !== 'focus' ? (
          <SceneLabel position={[24, -16, 4]}>移动外爪</SceneLabel>
        ) : null}
        {showLabels && measure === 'depth' ? <SceneLabel position={[180, 14, pose.rodZ]}>深度尺</SceneLabel> : null}
      </group>
      {showWork && !pose.showDepthWork ? (
        <group name="caliper-work" position={[0, 0, pose.workZ]}>
          <Workpiece measure={measure} size={workSize} />
        </group>
      ) : null}
      {showLabels ? (
        <SceneLabel position={viewPreset === 'focus' ? [pose.frame[0] - 8, 24, 4] : [200, 26, 2]}>主尺</SceneLabel>
      ) : null}
      {showLabels && measure === 'inner' ? (
        <SceneLabel position={[0, viewPreset === 'focus' ? 29 : 39, 4]}>固定内爪</SceneLabel>
      ) : null}
      {showLabels && measure === 'outer' && viewPreset !== 'focus' ? (
        <SceneLabel position={[-24, -16, 4]}>固定外爪</SceneLabel>
      ) : null}
    </group>
  )
}

export function CaliperDepthWork({ pose, size, showWork }: { pose: CaliperPose; size: number; showWork: boolean }) {
  if (!showWork || !pose.showDepthWork) return null
  return (
    <group name="caliper-depth-work" position={pose.depthRoot}>
      <mesh name="depth-work-left-wall" position={[-18, -size / 2, -8]} castShadow receiveShadow>
        <boxGeometry args={[24, size, 16]} />
        <Metal color={BRASS} metalness={0.68} roughness={0.42} />
      </mesh>
      <mesh name="depth-work-right-wall" position={[18, -size / 2, -8]} castShadow receiveShadow>
        <boxGeometry args={[24, size, 16]} />
        <Metal color={BRASS} metalness={0.68} roughness={0.42} />
      </mesh>
      <mesh name="depth-work-bottom" position={[0, -size + 0.3, -8]} castShadow receiveShadow>
        <boxGeometry args={[60, 0.8, 16]} />
        <Metal color={BRASS} metalness={0.68} roughness={0.42} />
      </mesh>
    </group>
  )
}
