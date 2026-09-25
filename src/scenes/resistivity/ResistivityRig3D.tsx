import { MeasuringToolsRig3D } from '../measuring-tools/MeasuringToolsRig3D'
import { CircuitAssembly } from './CircuitAssembly'
import type { CircuitPose, WireLink } from './circuitPose'
import type { ResistivityStage } from './state'

export function ResistivityRig3D({
  stage,
  gap,
  zero,
  wireSize,
  pose,
  wires,
}: {
  stage: ResistivityStage
  gap: number
  zero: number
  wireSize: number
  pose: CircuitPose
  wires: WireLink[]
}) {
  if (stage === 'diameter') {
    return (
      <MeasuringToolsRig3D
        tool="micrometer"
        divisions={20}
        measure="outer"
        caliperX={0}
        caliperExplode={0}
        caliperLocked={false}
        micGap={gap}
        micZero={zero}
        micExplode={0}
        micLocked={false}
        showWork
        workVisible
        objectSize={wireSize}
        showLabels={false}
      />
    )
  }
  return <CircuitAssembly pose={pose} wires={wires} />
}
