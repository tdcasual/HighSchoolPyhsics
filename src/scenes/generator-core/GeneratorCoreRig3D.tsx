import { Line } from '../../scene3d/ClassroomLine'
import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import { deriveGeneratorReadings } from './model'
import { SceneLabel } from '../../scene3d/SceneLabel'
import { LabStage } from '../../scene3d/LabStage'
import { useSceneTheme } from '../../scene3d/useSceneTheme'

type Props = { angleRad: number; running: boolean }

function Arrow({
  start,
  end,
  color,
  width = 2,
}: {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  width?: number
}) {
  const direction = useMemo(
    () => [end[0] - start[0], end[1] - start[1], end[2] - start[2]] as [number, number, number],
    [end, start],
  )
  const orientation = useMemo(() => {
    const vector = new Vector3(...direction)
    if (vector.lengthSq() < 1e-9) return new Quaternion()
    return new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), vector.normalize())
  }, [direction])
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={width} />
      <mesh position={end} quaternion={orientation}>
        <coneGeometry args={[0.12, 0.34, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function FieldLines({ dark }: { dark: boolean }) {
  const lines = useMemo(() => Array.from({ length: 5 }, (_, index) => -2 + index), [])
  return (
    <group>
      {lines.map((y) => (
        <Arrow
          key={`field-${y}`}
          start={[-3.9, y, -1.8]}
          end={[3.9, y, -1.8]}
          color={dark ? '#78b7d8' : '#457b9d'}
          width={1.2}
        />
      ))}
      {lines.map((y) => (
        <Arrow
          key={`field-back-${y}`}
          start={[-3.9, y, 1.8]}
          end={[3.9, y, 1.8]}
          color={dark ? '#78b7d8' : '#457b9d'}
          width={1.2}
        />
      ))}
    </group>
  )
}

export function GeneratorCoreRig3D({ angleRad, running }: Props) {
  const { night: dark } = useSceneTheme()
  const textColor = dark ? '#e4edf4' : '#3b2e24'
  const readings = deriveGeneratorReadings(angleRad)
  const coilPoints: Array<[number, number, number]> = [
    [0, -1.55, -1.05],
    [0, 1.55, -1.05],
    [0, 1.55, 1.05],
    [0, -1.55, 1.05],
    [0, -1.55, -1.05],
  ]
  const currentColor =
    readings.emfNormalized > 0.08 ? '#e63946' : readings.emfNormalized < -0.08 ? '#3b82c4' : '#7d8790'
  const currentIsVisible = Math.abs(readings.emfNormalized) >= 0.08
  const velocityStart: [number, number, number] = [Math.sin(angleRad) * 1.05, 0, Math.cos(angleRad) * 1.05]
  const velocityEnd: [number, number, number] = [
    velocityStart[0] + readings.velocityVector[0] * 0.9,
    0,
    velocityStart[2] + readings.velocityVector[2] * 0.9,
  ]
  return (
    <group data-rig-scene="generator-core">
      <LabStage
        background={['#edf1ee', '#101823']}
        ambient={[0.9, 0.7]}
        keyLight={{ position: [6, 9, 8], intensity: [0.85, 1.1] }}
      />
      <mesh position={[-5, 0, 0]}>
        <boxGeometry args={[1.25, 5.2, 4.8]} />
        <meshStandardMaterial color="#e63946" roughness={0.38} metalness={0.12} />
      </mesh>
      <mesh position={[5, 0, 0]}>
        <boxGeometry args={[1.25, 5.2, 4.8]} />
        <meshStandardMaterial color="#2d6db5" roughness={0.38} metalness={0.12} />
      </mesh>
      <SceneLabel position={[-5, 0, 2.48]} color="#ffffff" variant="text" size={11} halo="dark" distanceFactor={8}>
        N
      </SceneLabel>
      <SceneLabel position={[5, 0, 2.48]} color="#ffffff" variant="text" size={11} halo="dark" distanceFactor={8}>
        S
      </SceneLabel>
      <FieldLines dark={dark} />
      <Line
        points={[
          [-3.8, 0, 0],
          [3.8, 0, 0],
        ]}
        color={dark ? '#a8b9c8' : '#788a92'}
        lineWidth={1}
        dashed
        dashSize={0.12}
        gapSize={0.1}
      />
      <group rotation={[0, angleRad, 0]}>
        <Line points={coilPoints} color="#f4a261" lineWidth={running ? 3.2 : 2.4} />
        <mesh position={[0, 1.55, -1.05]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#ffd166" />
        </mesh>
        {currentIsVisible && (
          <>
            <Arrow
              start={[0, readings.emfNormalized > 0 ? 0.58 : -0.58, 1.05]}
              end={[0, readings.emfNormalized > 0 ? -0.58 : 0.58, 1.05]}
              color={currentColor}
              width={2.1}
            />
            <Arrow
              start={[0, readings.emfNormalized > 0 ? -0.58 : 0.58, -1.05]}
              end={[0, readings.emfNormalized > 0 ? 0.58 : -0.58, -1.05]}
              color={currentColor}
              width={2.1}
            />
          </>
        )}
      </group>
      <Arrow
        start={[0, 0, 0]}
        end={[readings.normalVector[0] * 2.3, 0, readings.normalVector[2] * 2.3]}
        color="#9c27b0"
        width={2.5}
      />
      <Arrow start={velocityStart} end={velocityEnd} color="#f4c542" width={2.5} />
      <SceneLabel
        position={[readings.normalVector[0] * 2.4, 0.25, readings.normalVector[2] * 2.4]}
        color="#9c27b0"
        variant="text"
        size={11}
        halo="dark"
        distanceFactor={8}
      >
        法向量 n
      </SceneLabel>
      <SceneLabel
        position={[velocityEnd[0] + 0.12, 0.3, velocityEnd[2] + 0.12]}
        color="#c08500"
        variant="text"
        size={11}
        halo="dark"
        distanceFactor={8}
      >
        速度 v
      </SceneLabel>
      <SceneLabel position={[0, -2.95, 0]} color={currentColor} variant="text" size={11} halo="dark" distanceFactor={8}>
        {readings.currentDirection === '换向瞬间' ? '电流换向' : `电流 ${readings.currentDirection}`}
      </SceneLabel>
      <SceneLabel position={[0, -2.42, 0]} color={textColor} variant="text" size={11} halo="dark" distanceFactor={8}>
        旋转轴 O
      </SceneLabel>
      <SceneLabel
        position={[0, 2.58, -1.8]}
        color={dark ? '#9ed7f0' : '#457b9d'}
        variant="text"
        size={11}
        halo="dark"
        distanceFactor={8}
      >
        B
      </SceneLabel>
    </group>
  )
}
