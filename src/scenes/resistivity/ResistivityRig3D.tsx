import { InstrumentBackdrop, MicrometerStage } from '../../instruments/measuring/InstrumentStages'
import { CircuitAssembly } from './CircuitAssembly'
import type { CircuitPose, WireLink } from './circuitPose'
import type { ElementKind } from './model'
import type { ResistivityStage } from './state'

export function ResistivityRig3D({
  stage,
  gap,
  zero,
  wireSize,
  pose,
  wires,
  onMicGapChange,
  onInstrumentDragChange,
  elementKind,
  elementPower,
  elementVoltage = 0,
  ivMode,
  ammeterRange,
  voltmeterRange,
  ammeterDivision = 0.02,
  voltmeterDivision = 0.1,
}: {
  stage: ResistivityStage
  gap: number
  zero: number
  wireSize: number
  pose: CircuitPose
  wires: WireLink[]
  onMicGapChange?: (value: number) => void
  onInstrumentDragChange?: (dragging: boolean) => void
  elementKind: ElementKind
  elementPower: number
  elementVoltage?: number
  ivMode: boolean
  ammeterRange: number
  voltmeterRange: number
  ammeterDivision?: number
  voltmeterDivision?: number
}) {
  if (stage === 'diameter') {
    return (
      <group>
        <InstrumentBackdrop tool="micrometer" />
        <MicrometerStage
          micGap={gap}
          micZero={zero}
          micExplode={0}
          micLocked={false}
          showWork
          workVisible
          workSize={wireSize}
          showLabels={false}
          onMicGapChange={onMicGapChange}
          onInstrumentDragChange={onInstrumentDragChange}
        />
      </group>
    )
  }
  return (
    <CircuitAssembly
      pose={pose}
      wires={wires}
      elementKind={elementKind}
      elementPower={elementPower}
      elementVoltage={elementVoltage}
      ivMode={ivMode}
      ammeterRange={ammeterRange}
      voltmeterRange={voltmeterRange}
      ammeterDivision={ammeterDivision}
      voltmeterDivision={voltmeterDivision}
    />
  )
}
