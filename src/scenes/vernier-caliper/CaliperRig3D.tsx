import { CaliperStage, InstrumentBackdrop, type CaliperStageProps } from '../../instruments/measuring/InstrumentStages'

export function CaliperRig3D(props: CaliperStageProps) {
  return (
    <group>
      <InstrumentBackdrop tool="caliper" />
      <CaliperStage {...props} />
    </group>
  )
}
