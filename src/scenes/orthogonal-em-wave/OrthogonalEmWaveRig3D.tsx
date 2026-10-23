import { useThree } from '@react-three/fiber'
import { Line } from '../../scene3d/ClassroomLine'
import { buildFieldSamples, type EmViewMode } from './model'
import type { OrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'
import { SceneLabel } from '../../scene3d/SceneLabel'
import { LabStage } from '../../scene3d/LabStage'
import { useSceneTheme } from '../../scene3d/useSceneTheme'

type Point = [number, number, number]
type Props = Pick<
  OrthogonalEmWaveSceneState,
  | 'amplitude'
  | 'wavelength'
  | 'speed'
  | 'direction'
  | 'viewMode'
  | 'elapsed'
  | 'readings'
  | 'showOrthogonality'
  | 'showProjectionMarks'
> & { compactDesktop: boolean }

const X_SCALE = 1.42
const FIELD_SCALE = 1.8
const xWorld = (x: number) => -5.7 + x * X_SCALE

function EArrow({ x, value, color }: { x: number; value: number; color: string }) {
  if (Math.abs(value) < 0.015) return null
  const sign = value > 0 ? 1 : -1
  const start: Point = [xWorld(x), 0, 0.05]
  const end: Point = [xWorld(x), value * FIELD_SCALE, 0.05]
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1.5} />
      <mesh position={end} rotation={[sign > 0 ? 0 : Math.PI, 0, 0]}>
        <coneGeometry args={[0.075, 0.2, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function BArrow({ x, value, color }: { x: number; value: number; color: string }) {
  if (Math.abs(value) < 0.015) return null
  const sign = value > 0 ? 1 : -1
  const start: Point = [xWorld(x), 0, 0]
  const end: Point = [xWorld(x), 0, value * FIELD_SCALE]
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1.5} />
      <mesh position={end} rotation={[sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.075, 0.2, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function ProjectionMark({ x, value, mode, color }: { x: number; value: number; mode: 'xy' | 'xz'; color: string }) {
  const glyph = value >= 0 ? '⊙' : '⊗'
  const position: Point = mode === 'xy' ? [xWorld(x), -1.95, 0.12] : [xWorld(x), 0.12, -1.95]
  return (
    <SceneLabel position={position} variant="text" color={color} size={16} weight={900} distanceFactor={8}>
      {glyph}
    </SceneLabel>
  )
}

function Axes({ color, mode }: { color: string; mode: EmViewMode }) {
  const showY = mode !== 'xz'
  const showZ = mode !== 'xy'
  return (
    <group>
      {mode !== 'yz' && (
        <>
          <Line
            points={[
              [xWorld(0), 0, 0],
              [xWorld(8.35), 0, 0],
            ]}
            color="#343a40"
            lineWidth={1.4}
          />
          <SceneLabel
            position={[xWorld(7.65), -0.7, 0]}
            variant="text"
            color="#343a40"
            size={11}
            weight={400}
            italic
            distanceFactor={8}
            testId="orthogonal-em-wave-axis-label"
          >
            x / m
          </SceneLabel>
        </>
      )}
      {showY && (
        <Line
          points={[
            [xWorld(0), -2.5, 0],
            [xWorld(0), 2.5, 0],
          ]}
          color={color}
          lineWidth={1.1}
        />
      )}
      {showZ && (
        <Line
          points={[
            [xWorld(0), 0, -2.5],
            [xWorld(0), 0, 2.5],
          ]}
          color={color}
          lineWidth={1.1}
        />
      )}
    </group>
  )
}

function OrthogonalityMarker({ x, color }: { x: number; color: string }) {
  return (
    <Line
      points={[
        [xWorld(x), 0, 0],
        [xWorld(x), 0.45, 0],
        [xWorld(x), 0.45, 0.45],
      ]}
      color={color}
      lineWidth={2.2}
    />
  )
}

export function OrthogonalEmWaveRig3D({
  amplitude,
  wavelength,
  speed,
  direction,
  viewMode,
  elapsed,
  readings,
  showOrthogonality,
  showProjectionMarks,
  compactDesktop,
}: Props) {
  const viewportWidth = useThree((state) => state.size.width)
  const isNarrow = viewportWidth < 500
  const { night: dark } = useSceneTheme()
  const eColor = dark ? '#ff6b7a' : '#e63946'
  const bColor = dark ? '#70b3dc' : '#457b9d'
  const textColor = dark ? '#e5edf3' : '#3b2e24'
  const axisColor = dark ? '#657483' : '#c7d0d6'
  const params = { amplitude, wavelength, speed, direction }
  const samples = buildFieldSamples(elapsed, params, 25)
  const ePath = samples.map(({ x, e }) => [xWorld(x), e * FIELD_SCALE, 0] as Point)
  const bPath = samples.map(({ x, b }) => [xWorld(x), 0, b * FIELD_SCALE] as Point)
  const arrowSamples = samples.filter((_, index) => index % 2 === 0)
  const title =
    viewMode === '3d'
      ? '电磁波：E、B、v 两两正交'
      : viewMode === 'xy'
        ? 'XY 侧视：电场 E 波形'
        : viewMode === 'xz'
          ? 'XZ 俯视：磁场 B 波形'
          : 'YZ 正视：波阵面与正交矢量'
  const projectionMode = viewMode === 'xy' || viewMode === 'xz' ? viewMode : null
  const titlePosition: Point =
    viewMode === 'xz'
      ? [xWorld(3), 0, -2.8]
      : viewMode === 'yz'
        ? [xWorld(4), 3.75, 1.4]
        : [xWorld(3), viewMode === '3d' && isNarrow ? 4.05 : 3.45, 0]
  const directionPosition: Point =
    viewMode === 'xz' ? [xWorld(5.5), 0, -2.4] : viewMode === 'yz' ? [xWorld(4), 3.15, 1.4] : [xWorld(5.5), 2.6, 0]
  const directionStartX = xWorld(direction === 'right' ? 7.45 : 8.05)
  const directionEndX = xWorld(direction === 'right' ? 8.05 : 7.45)
  const propagationLabel =
    viewMode === 'yz'
      ? direction === 'right'
        ? '传播朝向观察者'
        : '传播背离观察者'
      : `波沿 x 轴${direction === 'right' ? '向右' : '向左'}传播`
  return (
    <group data-rig-scene="orthogonal-em-wave">
      <LabStage ambient={[0.95, 0.75]} keyLight={{ position: [4, 6, 8], intensity: [0.7, 0.7] }} />
      <Axes color={axisColor} mode={viewMode} />

      {viewMode === 'yz' && (
        <>
          <mesh position={[xWorld(4), 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[4.8, 4.8]} />
            <meshBasicMaterial color={bColor} transparent opacity={0.08} side={2} />
          </mesh>
          <EArrow x={4} value={readings.probe.e} color={eColor} />
          <BArrow x={4} value={readings.probe.b} color={bColor} />
          <SceneLabel position={[xWorld(4), 2.15, 0]} variant="text" color={eColor} weight={900} distanceFactor={8}>
            Eᵧ
          </SceneLabel>
          <SceneLabel position={[xWorld(4), 0, 2.15]} variant="text" color={bColor} weight={900} distanceFactor={8}>
            B_z
          </SceneLabel>
          <SceneLabel
            position={[xWorld(4), -2.05, 0]}
            variant="text"
            color={bColor}
            size={16}
            weight={900}
            distanceFactor={8}
            testId="orthogonal-em-wave-direction-symbol"
          >
            {direction === 'right' ? '⊙ 朝向观察者' : '⊗ 背离观察者'}
          </SceneLabel>
        </>
      )}

      {viewMode === '3d' && (
        <>
          <Line points={ePath} color={eColor} lineWidth={2.2} />
          <Line points={bPath} color={bColor} lineWidth={2.2} />
          {arrowSamples.map((sample) => (
            <group key={'3d-' + sample.x}>
              <EArrow x={sample.x} value={sample.e} color={eColor} />
              <BArrow x={sample.x} value={sample.b} color={bColor} />
            </group>
          ))}
        </>
      )}
      {viewMode === 'xy' && (
        <>
          <Line points={ePath} color={eColor} lineWidth={2.8} />
          {samples.map((sample) => (
            <EArrow key={'e-' + sample.x} x={sample.x} value={sample.e} color={eColor} />
          ))}
          {showProjectionMarks &&
            samples
              .filter((_, index) => index % 2 === 0)
              .map((sample) => (
                <ProjectionMark key={'xy-' + sample.x} x={sample.x} value={sample.b} mode="xy" color={bColor} />
              ))}
        </>
      )}
      {viewMode === 'xz' && (
        <>
          <Line points={bPath} color={bColor} lineWidth={2.8} />
          {samples.map((sample) => (
            <BArrow key={'b-' + sample.x} x={sample.x} value={sample.b} color={bColor} />
          ))}
          {showProjectionMarks &&
            samples
              .filter((_, index) => index % 2 === 0)
              .map((sample) => (
                <ProjectionMark key={'xz-' + sample.x} x={sample.x} value={sample.e} mode="xz" color={eColor} />
              ))}
        </>
      )}
      {viewMode === '3d' && showOrthogonality && <OrthogonalityMarker x={4} color="#f4b942" />}

      {viewMode !== 'yz' && (
        <>
          <Line
            points={[
              [directionStartX, -2.55, 0],
              [directionEndX, -2.55, 0],
            ]}
            color="#343a40"
            lineWidth={1.8}
          />
          <mesh
            position={[directionEndX, -2.55, 0]}
            rotation={[0, 0, direction === 'right' ? -Math.PI / 2 : Math.PI / 2]}
          >
            <coneGeometry args={[0.09, 0.22, 8]} />
            <meshBasicMaterial color="#343a40" />
          </mesh>
        </>
      )}

      {!compactDesktop && (
        <SceneLabel
          position={titlePosition}
          variant="text"
          color={textColor}
          size={isNarrow ? 13 : 16}
          weight={900}
          distanceFactor={8}
          testId="orthogonal-em-wave-title"
        >
          {title}
        </SceneLabel>
      )}
      <SceneLabel position={directionPosition} variant="text" color={bColor} weight={800} distanceFactor={8}>
        {propagationLabel}
      </SceneLabel>
      {viewMode !== 'yz' && (
        <>
          <SceneLabel
            position={[xWorld(0.35), 2.65, 0]}
            variant="text"
            color={eColor}
            size={13}
            weight={900}
            distanceFactor={8}
            testId="orthogonal-em-wave-e-label"
          >
            E（电场）
          </SceneLabel>
          <SceneLabel
            position={[xWorld(0.35), 0, 1.75]}
            variant="text"
            color={bColor}
            size={13}
            weight={900}
            distanceFactor={8}
            testId="orthogonal-em-wave-b-label"
          >
            B（磁场）
          </SceneLabel>
        </>
      )}
      <SceneLabel
        position={[xWorld(4), -3.15, 0]}
        variant="text"
        color={textColor}
        size={10}
        weight={400}
        distanceFactor={8}
      >
        {projectionMode
          ? '实线：当前场分布 · 点 ⊙ / 叉 ⊗：垂直屏幕的矢量投影'
          : '红色 E 沿 y 振荡 · 蓝色 B 沿 z 振荡 · 黄色直角符表示正交关系'}
      </SceneLabel>
    </group>
  )
}
