import { CaliperAssembly, CaliperDepthWork } from './CaliperAssembly'
import { MicrometerAssembly } from './MicrometerAssembly'
import type { VernierDivisions } from './model'
import { caliperPose, micrometerPose, type CaliperMeasure, type InstrumentTool, type ViewPreset } from './pose'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { StudioEnvironment } from '../../scene3d/StudioEnvironment'

type StageCommon = {
  night?: boolean
  showWork: boolean
  showLabels: boolean
  viewPreset?: ViewPreset
  /** Specimen size in mm. */
  workSize: number
  onInstrumentDragChange?: (dragging: boolean) => void
}

export type CaliperStageProps = StageCommon & {
  divisions: VernierDivisions
  measure: CaliperMeasure
  caliperX: number
  caliperExplode: number
  caliperLocked: boolean
  onCaliperXChange?: (value: number) => void
}

export type MicrometerStageProps = StageCommon & {
  micGap: number
  micZero: number
  micExplode: number
  micLocked: boolean
  /** Overrides the default rule (shown while showWork and larger than 0.2 mm). */
  workVisible?: boolean
  onMicGapChange?: (value: number) => void
}

function StageLights({ tool }: { tool: InstrumentTool }) {
  const sun = tool === 'caliper' ? [60, 260, 180] : [40, 180, 120]
  const shadow = tool === 'caliper' ? 190 : 90
  return (
    <>
      <StudioEnvironment intensity={0.45} />
      <hemisphereLight args={['#ffffff', '#8b9a98', 0.45]} />
      <directionalLight
        position={sun as [number, number, number]}
        intensity={1.7}
        color="#fff6e8"
        castShadow={false} // Avoid the oversized hard silhouette shadow on the long caliper.
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-shadow}
        shadow-camera-right={shadow}
        shadow-camera-top={shadow}
        shadow-camera-bottom={-shadow}
        shadow-camera-near={1}
        shadow-camera-far={tool === 'caliper' ? 9000 : 5000}
      />
      <directionalLight position={[-sun[0], sun[1] * 0.6, -sun[2]]} intensity={0.55} color="#e6f1ff" />
    </>
  )
}

/** Backdrop, ground fog and lights sized for one instrument. */
export function InstrumentBackdrop({ tool }: { tool: InstrumentTool }) {
  return (
    <>
      <SceneBackdrop day="#e3e9ec" fog={tool === 'caliper' ? [950, 2600] : [420, 1300]} />
      <StageLights tool={tool} />
    </>
  )
}

export function CaliperStage(props: CaliperStageProps) {
  const night = props.night ?? false
  const pose = caliperPose({
    x: props.caliperX,
    exploded: props.caliperExplode,
    locked: props.caliperLocked,
    mode: props.measure,
  })
  return (
    <>
      <CaliperAssembly
        pose={pose}
        divisions={props.divisions}
        measure={props.measure}
        workSize={props.workSize}
        showWork={props.showWork}
        showLabels={props.showLabels}
        viewPreset={props.viewPreset}
        locked={props.caliperLocked}
        onCaliperXChange={props.onCaliperXChange}
        onInstrumentDragChange={props.onInstrumentDragChange}
      />
      <CaliperDepthWork pose={pose} size={props.workSize} showWork={props.showWork} />
      {/* Unlit and not tone-mapped, like the clear colour, so the fog fades it into the
          backdrop without a horizon line when the camera looks up at the instrument. */}
      <mesh name="caliper-ground" rotation={[-Math.PI / 2, 0, 0]} position={[95, pose.groundY, 0]}>
        <planeGeometry args={[7000, 7000]} />
        <meshBasicMaterial color={night ? '#1f262e' : '#d6dfe2'} toneMapped={false} />
      </mesh>
    </>
  )
}

export function MicrometerStage(props: MicrometerStageProps) {
  const night = props.night ?? false
  const pose = micrometerPose({
    gap: props.micGap,
    zero: props.micZero,
    exploded: props.micExplode,
    locked: props.micLocked,
  })
  return (
    <>
      <MicrometerAssembly
        pose={pose}
        gap={props.micGap}
        showWork={props.workVisible ?? (props.showWork && props.workSize > 0.2)}
        workSize={props.workSize}
        showLabels={props.showLabels}
        viewPreset={props.viewPreset}
        locked={props.micLocked}
        onMicGapChange={props.onMicGapChange}
        onInstrumentDragChange={props.onInstrumentDragChange}
      />
      <mesh name="micrometer-ground" rotation={[-Math.PI / 2, 0, 0]} position={[30, -34, 0]}>
        <planeGeometry args={[4000, 4000]} />
        <meshBasicMaterial color={night ? '#1b2129' : '#dbe3e6'} toneMapped={false} />
      </mesh>
    </>
  )
}
