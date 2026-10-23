import type { PrintQuality, TapeDot, TimerKind } from './model'
import { TICKER_CANDY as C } from './palette'
import { NO_FIT } from '../../scene3d/FitBounds'
import { ElectromagneticTimer } from './ElectromagneticTimer'
import { SparkTimer } from './SparkTimer'
import { PaperTape } from './TickerTimerParts'

type TickerTimerRig3DProps = {
  kind: TimerKind
  powered: boolean
  phase01: number
  printQuality: PrintQuality
  displacementM: number
  dots: TapeDot[]
  showLabels: boolean
}

export function TickerTimerRig3D({
  kind,
  powered,
  phase01,
  printQuality,
  displacementM,
  dots,
  showLabels,
}: TickerTimerRig3DProps) {
  return (
    <group data-rig-scene="ticker-timer">
      <color attach="background" args={[C.sky]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#ffffff', '#cbd4d4', 0.45]} />
      <directionalLight position={[6, 9, 7]} intensity={1.1} castShadow />
      <directionalLight position={[-5, 4, -4]} intensity={0.35} color={C.fillLight} />

      <mesh position={[0, -0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={NO_FIT}>
        <planeGeometry args={[24, 24]} />
        <shadowMaterial transparent opacity={0.14} />
      </mesh>

      {kind === 'electromagnetic' ? (
        <ElectromagneticTimer powered={powered} phase01={phase01} showLabels={showLabels} />
      ) : (
        <SparkTimer powered={powered} phase01={phase01} displacementM={displacementM} showLabels={showLabels} />
      )}
      <PaperTape displacementM={displacementM} dots={dots} printQuality={printQuality} />
    </group>
  )
}
