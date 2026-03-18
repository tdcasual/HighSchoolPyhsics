import type { ThemeMode } from '../../store/useAppStore'
import { getAlternatorPalette } from './palette'
import { ArcMagnet } from './components/ArcMagnet'
import { Brushes } from './components/Brushes'
import { ExternalCircuit } from './components/ExternalCircuit'
import { FieldArrows } from './components/FieldArrows'
import { RotorAssembly } from './components/RotorAssembly'

export const ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD = Math.PI / 2

type AlternatorRig3DProps = {
  angleRad: number
  meterNeedleAngleRad: number
  theme: ThemeMode
}

function AxisLine({ color }: { color: string }) {
  return (
    <group name="axis-line">
      {Array.from({ length: 18 }, (_, index) => (
        <mesh key={index} position={[0, 0, -9.6 + index * 1.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.55, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

export function AlternatorRig3D({
  angleRad,
  meterNeedleAngleRad,
  theme,
}: AlternatorRig3DProps) {
  const palette = getAlternatorPalette(theme)

  return (
    <group data-rig-scene="alternator">
      <ambientLight intensity={0.4} />
      <spotLight
        position={[15, 20, 10]}
        intensity={1}
        angle={Math.PI / 4}
        penumbra={0.5}
      />
      <directionalLight position={[-10, -5, -15]} intensity={0.5} color={palette.fillLight} />
      <color attach="background" args={[palette.background]} />

      <ArcMagnet polarity="N" position={[0, 0, -2.5]} color={palette.magnetNorth} labelColor={palette.label} />
      <ArcMagnet polarity="S" position={[0, 0, -2.5]} color={palette.magnetSouth} labelColor={palette.label} />
      <FieldArrows color={palette.field} />
      <RotorAssembly angleRad={angleRad + ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD} palette={palette} />
      <Brushes color={palette.brush} />
      <ExternalCircuit meterNeedleAngleRad={meterNeedleAngleRad} palette={palette} />
      <AxisLine color={palette.axis} />
    </group>
  )
}
