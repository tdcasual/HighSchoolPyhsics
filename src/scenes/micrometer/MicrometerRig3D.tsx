import {
  InstrumentBackdrop,
  MicrometerStage,
  type MicrometerStageProps,
} from '../../instruments/measuring/InstrumentStages'

export function MicrometerRig3D(props: MicrometerStageProps) {
  return (
    <group>
      <InstrumentBackdrop tool="micrometer" />
      <MicrometerStage {...props} />
    </group>
  )
}
