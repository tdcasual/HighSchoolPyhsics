import { Line } from '../../scene3d/ClassroomLine'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { DoubleSide, LatheGeometry } from 'three'
import {
  buildLatheProfile,
  buildPotentialCurveGeometryPoints,
  POTENTIAL_DISPLAY_LIMIT,
  POTENTIAL_SURFACE_FULL_ANGLE,
  resolveLatheDrawCount,
  type PotentialSlicePoint,
} from './model'

type PotentialEnergyRig3DProps = {
  chargeSign: 1 | -1
  sliceVisible: boolean
  surfaceVisible: boolean
  rotationInProgress: boolean
  sweepAngle: number
  onSweepAngleChange: (nextAngle: number) => void
  onRotationComplete: () => void
  onChargeClick: () => void
  slicePoints: ReadonlyArray<PotentialSlicePoint>
}

function resolveChargeColor(chargeSign: 1 | -1): string {
  return chargeSign > 0 ? '#ef3340' : '#3f7eb5'
}

function resolveSurfaceColor(chargeSign: 1 | -1): string {
  return chargeSign > 0 ? '#ef3340' : '#3f7eb5'
}

const LATHE_RADIAL_SEGMENTS = 96

export function PotentialEnergyRig3D({
  chargeSign,
  sliceVisible,
  surfaceVisible,
  rotationInProgress,
  sweepAngle,
  onSweepAngleChange,
  onRotationComplete,
  onChargeClick,
  slicePoints,
}: PotentialEnergyRig3DProps) {
  const curvePoints = useMemo(() => buildPotentialCurveGeometryPoints(slicePoints), [slicePoints])
  const latheProfile = useMemo(() => buildLatheProfile(slicePoints), [slicePoints])
  const chargeColor = resolveChargeColor(chargeSign)
  const surfaceColor = resolveSurfaceColor(chargeSign)
  const chargeHeight = chargeSign * (POTENTIAL_DISPLAY_LIMIT + 0.8)
  const axisLength = POTENTIAL_DISPLAY_LIMIT + 2

  const latheGeometry = useMemo(
    () => new LatheGeometry(latheProfile, LATHE_RADIAL_SEGMENTS, 0, POTENTIAL_SURFACE_FULL_ANGLE),
    [latheProfile],
  )

  useEffect(() => () => latheGeometry.dispose(), [latheGeometry])

  const sweepAngleRef = useRef(sweepAngle)
  const rotationInProgressRef = useRef(rotationInProgress)
  const geometryRef = useRef(latheGeometry)
  const lastReactUpdateRef = useRef(0)
  const completionSentRef = useRef(false)

  useLayoutEffect(() => {
    const justStarted = rotationInProgress && !rotationInProgressRef.current
    const geometryChanged = geometryRef.current !== latheGeometry

    if (justStarted) {
      sweepAngleRef.current = sweepAngle
      completionSentRef.current = false
    } else if (!rotationInProgress) {
      sweepAngleRef.current = sweepAngle
    }

    if (!rotationInProgress || justStarted || geometryChanged) {
      latheGeometry.setDrawRange(
        0,
        resolveLatheDrawCount(sweepAngleRef.current, {
          radialSegments: LATHE_RADIAL_SEGMENTS,
          profilePointCount: latheProfile.length,
        }),
      )
    }

    rotationInProgressRef.current = rotationInProgress
    geometryRef.current = latheGeometry
  }, [latheGeometry, latheProfile.length, rotationInProgress, sweepAngle])

  useFrame((_, delta) => {
    if (!rotationInProgress || completionSentRef.current) {
      return
    }

    const nextSweepAngle = Math.min(POTENTIAL_SURFACE_FULL_ANGLE, sweepAngleRef.current + delta * 2.3)
    if (nextSweepAngle <= sweepAngleRef.current) {
      return
    }

    latheGeometry.setDrawRange(
      0,
      resolveLatheDrawCount(nextSweepAngle, {
        radialSegments: LATHE_RADIAL_SEGMENTS,
        profilePointCount: latheProfile.length,
      }),
    )
    sweepAngleRef.current = nextSweepAngle

    if (nextSweepAngle >= POTENTIAL_SURFACE_FULL_ANGLE) {
      sweepAngleRef.current = POTENTIAL_SURFACE_FULL_ANGLE
      completionSentRef.current = true
      onSweepAngleChange(POTENTIAL_SURFACE_FULL_ANGLE)
      onRotationComplete()
      return
    }

    // Throttle React state updates to ~10 Hz to avoid per-frame re-renders.
    const now = performance.now()
    if (now - lastReactUpdateRef.current > 100) {
      lastReactUpdateRef.current = now
      onSweepAngleChange(nextSweepAngle)
    }
  })

  return (
    <group>
      <ambientLight intensity={0.76} />
      <directionalLight position={[4.5, 6.2, 5.2]} intensity={1.02} />
      <pointLight position={[0, 8, 0]} intensity={0.46} color="#d8edff" />

      <axesHelper args={[axisLength]} />
      <gridHelper args={[axisLength * 2, 40, '#4f5a66', '#3f4852']} />
      <mesh position={[0, chargeHeight, 0]} onClick={onChargeClick}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshPhongMaterial color={chargeColor} emissive={chargeColor} emissiveIntensity={0.42} />
      </mesh>
      {sliceVisible ? <Line points={curvePoints} color="#4ce37f" lineWidth={2.4} transparent opacity={0.95} /> : null}

      {surfaceVisible ? (
        <mesh geometry={latheGeometry} rotation={[0, 0, 0]}>
          <meshPhongMaterial color={surfaceColor} side={DoubleSide} transparent opacity={0.62} shininess={56} />
        </mesh>
      ) : null}
    </group>
  )
}
