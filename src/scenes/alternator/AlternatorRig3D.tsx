import { ArcMagnet } from './components/ArcMagnet'
import { BearingMount } from './components/BearingMount'
import { Brushes } from './components/Brushes'
import { ExternalCircuit } from './components/ExternalCircuit'
import { FieldArrows } from './components/FieldArrows'
import { RotorAssembly } from './components/RotorAssembly'

type AlternatorRig3DProps = {
  angleRad: number
  meterNeedleAngleRad: number
}

export function AlternatorRig3D({
  angleRad,
  meterNeedleAngleRad,
}: AlternatorRig3DProps) {
  return (
    <group data-rig-scene="alternator">
      <ambientLight intensity={0.58} />
      <directionalLight position={[-3, 5, 6]} intensity={1.28} />
      <pointLight position={[2, 2.2, 4]} intensity={0.3} color="#ffffff" />
      <color attach="background" args={['#101317']} />

      {/* Fixed stator components */}
      <ArcMagnet polarity="S" position={[-2.5, 0, 0]} />
      <ArcMagnet polarity="N" position={[2.5, 0, 0]} />
      <BearingMount position={[0, 0, -2.5]} />
      <BearingMount position={[0, 0, 2.8]} />
      <FieldArrows />
      <Brushes />
      <ExternalCircuit meterNeedleAngleRad={meterNeedleAngleRad} />

      {/* Rotating rotor */}
      <RotorAssembly angleRad={angleRad} />
    </group>
  )
}
