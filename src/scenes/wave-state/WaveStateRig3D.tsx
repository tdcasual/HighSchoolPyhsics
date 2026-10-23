import { Arrow3D } from '../../scene3d/Arrow3D'
import type { ReactElement } from 'react'
import { Line } from '../../scene3d/ClassroomLine'
import { WAVE_DOMAIN_LENGTH, buildWavePoints, type WaveParticle } from './model'
import type { WaveStateSceneState } from './useWaveStateSceneState'
import { SceneLabel } from '../../scene3d/SceneLabel'
import { LabStage } from '../../scene3d/LabStage'
import { useSceneTheme } from '../../scene3d/useSceneTheme'
type Point = [number, number, number]
type Props = Pick<
  WaveStateSceneState,
  | 'amplitude'
  | 'wavelength'
  | 'period'
  | 'direction'
  | 'startDirection'
  | 'probeX'
  | 'elapsed'
  | 'readings'
  | 'showGhost'
  | 'showVelocity'
  | 'showAcceleration'
>
const X_SCALE = 1.42,
  Y_SCALE = 0.022
const xWorld = (x: number) => -5.7 + x * X_SCALE
const yWorld = (y: number) => y * Y_SCALE
function Arrow({
  particle,
  color,
  kind,
}: {
  particle: WaveParticle
  color: string
  kind: 'velocity' | 'acceleration'
}) {
  const value = kind === 'velocity' ? particle.velocity : particle.acceleration
  if (Math.abs(value) < 0.0001) return null
  const sign = value > 0 ? 1 : -1,
    x = xWorld(particle.x),
    start: Point = [x, yWorld(particle.y), 0.18],
    end: Point = [x, yWorld(particle.y) + sign * 0.42, 0.18]
  // The head is centred on `end`.
  return (
    <Arrow3D
      from={start}
      to={[x, end[1] + sign * 0.09, 0.18]}
      color={color}
      headLength={0.18}
      headRadius={0.07}
      lineWidth={1.5}
      segments={8}
    />
  )
}
function Axis({ color }: { color: string }) {
  const grid: ReactElement[] = []
  for (let y = -2; y <= 2; y += 1)
    grid.push(
      <Line
        key={'h-' + y}
        points={[
          [xWorld(0), y * 0.72, -0.1],
          [xWorld(WAVE_DOMAIN_LENGTH), y * 0.72, -0.1],
        ]}
        color={color}
        lineWidth={0.6}
        transparent
        opacity={0.38}
      />,
    )
  return (
    <group>
      {grid}
      <Line
        points={[
          [xWorld(0), 0, 0],
          [xWorld(WAVE_DOMAIN_LENGTH + 0.25), 0, 0],
        ]}
        color="#343a40"
        lineWidth={1.4}
      />
      <Line
        points={[
          [xWorld(0), -2.4, 0],
          [xWorld(0), 2.4, 0],
        ]}
        color="#343a40"
        lineWidth={1.4}
      />
    </group>
  )
}
export function WaveStateRig3D({
  amplitude,
  wavelength,
  period,
  elapsed,
  readings,
  direction,
  startDirection,
  probeX,
  showGhost,
  showVelocity,
  showAcceleration,
}: Props) {
  const { night: dark } = useSceneTheme(),
    waveColor = dark ? '#70b3dc' : '#457b9d',
    futureColor = dark ? '#a8b5bf' : '#adb5bd',
    gridColor = dark ? '#657483' : '#c7d0d6',
    textColor = dark ? '#e5edf3' : '#3b2e24'
  const params = { amplitude, wavelength, period, direction, startDirection }
  const wavePath = buildWavePoints(elapsed, params, 161).map(([x, y]) => [xWorld(x), yWorld(y), 0.1] as Point)
  const future = buildWavePoints(elapsed + period * 0.04, params, 161).map(
    ([x, y]) => [xWorld(x), yWorld(y), 0.08] as Point,
  )
  const arrowStart = xWorld(direction === 'right' ? 6.8 : 7.7),
    arrowEnd = xWorld(direction === 'right' ? 7.7 : 6.8)
  const frontAtEnd = direction === 'right' ? readings.wavefrontX >= WAVE_DOMAIN_LENGTH : readings.wavefrontX <= 0
  const frontNearSource =
    direction === 'right' ? readings.wavefrontX < 0.45 : readings.wavefrontX > WAVE_DOMAIN_LENGTH - 0.45
  const probeIsInteger = Math.abs(probeX - Math.round(probeX)) < 0.0001
  const probePoint: Point = [xWorld(readings.probe.x), yWorld(readings.probe.y), 0.27]
  return (
    <group data-rig-scene="wave-state">
      <LabStage ambient={[0.95, 0.75]} />
      <Axis color={gridColor} />
      <Line points={wavePath} color={waveColor} lineWidth={2.8} />
      {showGhost && (
        <Line points={future} color={futureColor} lineWidth={1.5} dashed dashScale={3} dashSize={0.08} gapSize={0.06} />
      )}
      {readings.particles.map((particle) => {
        const point: Point = [xWorld(particle.x), yWorld(particle.y), 0.25],
          probe = Math.abs(particle.x - probeX) < 0.0001
        return (
          <group key={particle.x}>
            <Line
              points={[
                [xWorld(particle.x), -2.15, 0],
                [xWorld(particle.x), 2.15, 0],
              ]}
              color={probe ? '#ffd166' : gridColor}
              lineWidth={probe ? 1.05 : 0.45}
              transparent
              opacity={probe ? 0.55 : 0.22}
              dashed={probe}
            />
            <mesh position={point}>
              <sphereGeometry args={[probe ? 0.105 : 0.075, 14, 14]} />
              <meshStandardMaterial
                color={probe ? '#ffd166' : '#343a40'}
                emissive={probe ? '#ffd166' : '#343a40'}
                emissiveIntensity={probe ? 0.42 : 0.08}
              />
            </mesh>
            {showVelocity && <Arrow particle={particle} color="#2a9d8f" kind="velocity" />}
            {showAcceleration && <Arrow particle={particle} color="#e63946" kind="acceleration" />}
          </group>
        )
      })}
      {!probeIsInteger && (
        <group>
          <Line
            points={[
              [xWorld(probeX), -2.15, 0],
              [xWorld(probeX), 2.15, 0],
            ]}
            color="#ffd166"
            lineWidth={1.05}
            transparent
            opacity={0.55}
            dashed
          />
          <mesh position={probePoint}>
            <sphereGeometry args={[0.105, 14, 14]} />
            <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.42} />
          </mesh>
          {showVelocity && <Arrow particle={readings.probe} color="#2a9d8f" kind="velocity" />}
          {showAcceleration && <Arrow particle={readings.probe} color="#e63946" kind="acceleration" />}
        </group>
      )}
      {!frontAtEnd && (
        <>
          <Line
            points={[
              [xWorld(readings.wavefrontX), -2.15, 0.16],
              [xWorld(readings.wavefrontX), 2.15, 0.16],
            ]}
            color="#f4a261"
            lineWidth={1.5}
            dashed
          />
          {!frontNearSource && (
            <SceneLabel
              position={[xWorld(readings.wavefrontX), 2.1, 0.16]}
              variant="text"
              color="#d87928"
              size={10}
              weight={800}
              distanceFactor={8}
            >
              波前
            </SceneLabel>
          )}
        </>
      )}
      <Line
        points={[
          [arrowStart, 3.0, 0],
          [arrowEnd, 3.0, 0],
        ]}
        color="#457b9d"
        lineWidth={1.8}
      />
      <mesh position={[arrowEnd, 3.0, 0]} rotation={[0, 0, direction === 'right' ? -Math.PI / 2 : Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.22, 8]} />
        <meshBasicMaterial color="#457b9d" />
      </mesh>
      <SceneLabel
        position={[xWorld(4), 3.45, 0]}
        variant="text"
        color={textColor}
        size={15}
        weight={900}
        distanceFactor={8}
        testId="wave-state-title"
      >
        机械波：波前传播与质点起振
      </SceneLabel>
      <SceneLabel
        position={[xWorld(direction === 'right' ? 1.2 : 6.8), 2.75, 0.18]}
        variant="text"
        color="#e76f51"
        size={11}
        weight={800}
        distanceFactor={8}
        testId="wave-state-source-label"
      >
        振源 S · {startDirection === 'up' ? '↑' : '↓'}
      </SceneLabel>
      <SceneLabel
        position={[xWorld(probeX), -2.65, 0]}
        variant="text"
        color="#ffd166"
        size={11}
        weight={800}
        distanceFactor={8}
      >
        P
      </SceneLabel>
      <SceneLabel
        position={[xWorld(0.7), 2.35, 0]}
        variant="text"
        color={textColor}
        size={11}
        distanceFactor={8}
        testId="wave-state-y-label"
      >
        y / cm
      </SceneLabel>
      <SceneLabel
        position={[xWorld(7.25), -0.35, 0]}
        variant="text"
        color={textColor}
        size={11}
        weight={400}
        italic
        distanceFactor={8}
        testId="wave-state-x-label"
      >
        x / m
      </SceneLabel>
      <SceneLabel
        position={[xWorld(4), -3.12, 0]}
        variant="text"
        color={textColor}
        size={10}
        weight={400}
        distanceFactor={8}
      >
        {showGhost ? '实线：当前波形 · 虚线：Δt=0.04T 后的波形' : '波前后方的介质质点尚未起振；传播方向沿 x 轴'}
      </SceneLabel>
    </group>
  )
}
