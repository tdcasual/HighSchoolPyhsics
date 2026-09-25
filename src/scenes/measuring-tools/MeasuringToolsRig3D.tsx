import { CaliperAssembly, CaliperDepthWork } from './CaliperAssembly'
import { MicrometerAssembly } from './MicrometerAssembly'
import type { VernierDivisions } from './model'
import { caliperPose, micrometerPose, type CaliperMeasure, type InstrumentTool } from './pose'

export type MeasuringToolsRigProps = {
  tool: InstrumentTool
  divisions: VernierDivisions
  measure: CaliperMeasure
  caliperX: number
  caliperExplode: number
  caliperLocked: boolean
  micGap: number
  micZero: number
  micExplode: number
  micLocked: boolean
  showWork: boolean
  showLabels: boolean
  objectSize?: number
  workVisible?: boolean
}

function StageLights({ tool }: { tool: InstrumentTool }) {
  const sun = tool === 'caliper' ? [60, 260, 180] : [40, 180, 120]
  const shadow = tool === 'caliper' ? 190 : 90
  return (
    <>
      <hemisphereLight args={['#ffffff', '#8b9a98', 0.75]} />
      <directionalLight
        position={sun as [number, number, number]}
        intensity={2.1}
        color="#fff6e8"
        castShadow
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

export function MeasuringToolsRig3D(props: MeasuringToolsRigProps) {
  const workSize = props.objectSize ?? Math.max(1, props.tool === 'caliper' ? props.caliperX : props.micGap)
  return (
    <group>
      <color attach="background" args={['#e7eef0']} />
      <fog attach="fog" args={props.tool === 'caliper' ? ['#e2e9eb', 950, 2600] : ['#e2e9eb', 420, 1300]} />
      <StageLights tool={props.tool} />
      {props.tool === 'caliper' ? (
        <CaliperStage {...props} workSize={workSize} />
      ) : (
        <MicrometerStage {...props} workSize={workSize} />
      )}
    </group>
  )
}

export function CaliperStage(props: MeasuringToolsRigProps & { workSize: number }) {
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
      />
      <CaliperDepthWork pose={pose} size={props.workSize} showWork={props.showWork} />
      <mesh name="caliper-ground" rotation={[-Math.PI / 2, 0, 0]} position={[95, pose.groundY, 0]} receiveShadow>
        <planeGeometry args={[7000, 7000]} />
        <meshStandardMaterial color="#d9e3e1" roughness={0.95} metalness={0} />
      </mesh>
    </>
  )
}

function MicrometerStage(props: MeasuringToolsRigProps & { workSize: number }) {
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
        showWork={props.workVisible ?? (props.showWork && props.micGap > 0.2)}
        workSize={props.workSize}
        showLabels={props.showLabels}
      />
      <mesh name="micrometer-ground" rotation={[-Math.PI / 2, 0, 0]} position={[30, -34, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color="#d9e3e1" roughness={0.95} metalness={0} />
      </mesh>
    </>
  )
}
