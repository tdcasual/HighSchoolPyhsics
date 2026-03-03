import { Line } from '@react-three/drei/core/Line'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { LatheGeometry } from 'three'
import {
  buildLatheProfile,
  buildPotentialCurveGeometryPoints,
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
  return chargeSign > 0 ? '#ffcc00' : '#36a7ff'
}

function resolveSurfaceColor(chargeSign: 1 | -1): string {
  return chargeSign > 0 ? '#1695ff' : '#ff6b7e'
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

  const latheGeometry = useMemo(
    () => new LatheGeometry(latheProfile, LATHE_RADIAL_SEGMENTS, 0, POTENTIAL_SURFACE_FULL_ANGLE),
    [latheProfile],
  )

  useEffect(() => () => latheGeometry.dispose(), [latheGeometry])

  useEffect(() => {
    latheGeometry.setDrawRange(
      0,
      resolveLatheDrawCount(sweepAngle, {
        radialSegments: LATHE_RADIAL_SEGMENTS,
        profilePointCount: latheProfile.length,
      }),
    )
  }, [latheGeometry, latheProfile.length, sweepAngle])

  useFrame((_, delta) => {
    if (!rotationInProgress) {
      return
    }

    const nextSweepAngle = Math.min(POTENTIAL_SURFACE_FULL_ANGLE, sweepAngle + delta * 2.3)
    if (nextSweepAngle !== sweepAngle) {
      onSweepAngleChange(nextSweepAngle)
    }
    if (nextSweepAngle >= POTENTIAL_SURFACE_FULL_ANGLE) {
      onRotationComplete()
    }
  })

  return (
    <group>
      <ambientLight intensity={0.76} />
      <directionalLight position={[4.5, 6.2, 5.2]} intensity={1.02} />
      <pointLight position={[0, 8, 0]} intensity={0.46} color="#d8edff" />

      <axesHelper args={[13]} />
      <gridHelper args={[40, 40, '#4f5a66', '#3f4852']} />

      <mesh position={[0, 0, 0]} onClick={onChargeClick}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshPhongMaterial color={chargeColor} emissive={chargeColor} emissiveIntensity={0.42} />
      </mesh>

      {sliceVisible ? (
        <Line points={curvePoints} color="#4ce37f" lineWidth={2.4} transparent opacity={0.95} />
      ) : null}

      {surfaceVisible ? (
        <mesh geometry={latheGeometry} rotation={[0, 0, 0]}>
          <meshPhongMaterial
            color={surfaceColor}
            side={2}
            transparent
            opacity={0.62}
            shininess={56}
          />
        </mesh>
      ) : null}
    </group>
  )
}
