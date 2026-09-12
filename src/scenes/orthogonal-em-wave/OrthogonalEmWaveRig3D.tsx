import { Line } from '@react-three/drei/core/Line'
import { Html } from '@react-three/drei/web/Html'
import type { ThemeMode } from '../../store/useAppStore'
import { buildFieldSamples, type EmViewMode } from './model'
import type { OrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'

type Point = [number, number, number]
type Props = Pick<OrthogonalEmWaveSceneState, 'amplitude' | 'wavelength' | 'speed' | 'direction' | 'viewMode' | 'elapsed' | 'readings' | 'showOrthogonality' | 'showProjectionMarks'> & { theme: ThemeMode }

const X_SCALE = 1.42
const FIELD_SCALE = 1.8
const xWorld = (x: number) => -5.7 + x * X_SCALE

function EArrow({ x, value, color }: { x: number; value: number; color: string }) {
  if (Math.abs(value) < 0.015) return null
  const sign = value > 0 ? 1 : -1
  const start: Point = [xWorld(x), 0, 0.05]
  const end: Point = [xWorld(x), value * FIELD_SCALE, 0.05]
  return <group><Line points={[start, end]} color={color} lineWidth={1.5} /><mesh position={end} rotation={[sign > 0 ? 0 : Math.PI, 0, 0]}><coneGeometry args={[0.075, 0.2, 8]} /><meshBasicMaterial color={color} /></mesh></group>
}

function BArrow({ x, value, color }: { x: number; value: number; color: string }) {
  if (Math.abs(value) < 0.015) return null
  const sign = value > 0 ? 1 : -1
  const start: Point = [xWorld(x), 0, 0]
  const end: Point = [xWorld(x), 0, value * FIELD_SCALE]
  return <group><Line points={[start, end]} color={color} lineWidth={1.5} /><mesh position={end} rotation={[sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0]}><coneGeometry args={[0.075, 0.2, 8]} /><meshBasicMaterial color={color} /></mesh></group>
}

function ProjectionMark({ x, value, mode, color }: { x: number; value: number; mode: 'xy' | 'xz'; color: string }) {
  const glyph = value >= 0 ? '⊙' : '⊗'
  const position: Point = mode === 'xy' ? [xWorld(x), -1.95, 0.12] : [xWorld(x), 0.12, -1.95]
  return <Html position={position} center distanceFactor={8}><span style={{ color, fontSize: '16px', fontWeight: 900 }}>{glyph}</span></Html>
}

function Axes({ color, mode }: { color: string; mode: EmViewMode }) {
  const showY = mode !== 'xz'
  const showZ = mode !== 'xy'
  return <group><Line points={[[xWorld(0), 0, 0], [xWorld(8.35), 0, 0]]} color="#343a40" lineWidth={1.4} />{showY && <Line points={[[xWorld(0), -2.5, 0], [xWorld(0), 2.5, 0]]} color={color} lineWidth={1.1} />}{showZ && <Line points={[[xWorld(0), 0, -2.5], [xWorld(0), 0, 2.5]]} color={color} lineWidth={1.1} />}<Html position={[xWorld(8.35), -0.35, 0]} center distanceFactor={8}><span style={{ color: '#343a40', fontSize: '11px', fontStyle: 'italic' }}>v / x</span></Html></group>
}

function OrthogonalityMarker({ x, color }: { x: number; color: string }) {
  return <Line points={[[xWorld(x), 0, 0], [xWorld(x), 0.45, 0], [xWorld(x), 0.45, 0.45]]} color={color} lineWidth={2.2} />
}

export function OrthogonalEmWaveRig3D({ amplitude, wavelength, speed, direction, viewMode, elapsed, readings, showOrthogonality, showProjectionMarks, theme }: Props) {
  const dark = theme === 'night'
  const eColor = dark ? '#ff6b7a' : '#e63946'
  const bColor = dark ? '#70b3dc' : '#457b9d'
  const textColor = dark ? '#e5edf3' : '#3b2e24'
  const axisColor = dark ? '#657483' : '#c7d0d6'
  const params = { amplitude, wavelength, speed, direction }
  const samples = buildFieldSamples(elapsed, params, 25)
  const ePath = samples.map(({ x, e }) => [xWorld(x), e * FIELD_SCALE, 0] as Point)
  const bPath = samples.map(({ x, b }) => [xWorld(x), 0, b * FIELD_SCALE] as Point)
  const title = viewMode === '3d' ? '电磁波：E ⟂ B ⟂ v' : viewMode === 'xy' ? 'XY 侧视：电场 E 波形' : viewMode === 'xz' ? 'XZ 俯视：磁场 B 波形' : 'YZ 正视：波阵面与正交矢量'
  const projectionMode = viewMode === 'xy' || viewMode === 'xz' ? viewMode : null
  return <group data-rig-scene="orthogonal-em-wave"><ambientLight intensity={dark ? 0.75 : 0.95} /><directionalLight position={[4, 6, 8]} intensity={0.7} /><color attach="background" args={[dark ? '#101823' : '#f8f9fa']} /><Axes color={axisColor} mode={viewMode} />
    {viewMode === 'yz' && <><mesh position={[xWorld(4), 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[4.8, 4.8]} /><meshBasicMaterial color={bColor} transparent opacity={0.08} side={2} /></mesh><Html position={[xWorld(4), 2.8, 0]} center distanceFactor={8}><span style={{ color: textColor, fontWeight: 900, whiteSpace: 'nowrap' }}>迎面波阵面（YZ）</span></Html><EArrow x={4} value={readings.probe.e} color={eColor} /><BArrow x={4} value={readings.probe.b} color={bColor} /></>}
    {viewMode === '3d' && <><Line points={ePath} color={eColor} lineWidth={2.2} /><Line points={bPath} color={bColor} lineWidth={2.2} />{samples.map((sample) => <group key={'3d-' + sample.x}><EArrow x={sample.x} value={sample.e} color={eColor} /><BArrow x={sample.x} value={sample.b} color={bColor} /></group>)}</>}
    {viewMode === 'xy' && <><Line points={ePath} color={eColor} lineWidth={2.8} />{samples.map((sample) => <EArrow key={'e-' + sample.x} x={sample.x} value={sample.e} color={eColor} />)}{showProjectionMarks && samples.filter((_, index) => index % 2 === 0).map((sample) => <ProjectionMark key={'xy-' + sample.x} x={sample.x} value={sample.b} mode="xy" color={bColor} />)}</>}
    {viewMode === 'xz' && <><Line points={bPath} color={bColor} lineWidth={2.8} />{samples.map((sample) => <BArrow key={'b-' + sample.x} x={sample.x} value={sample.b} color={bColor} />)}{showProjectionMarks && samples.filter((_, index) => index % 2 === 0).map((sample) => <ProjectionMark key={'xz-' + sample.x} x={sample.x} value={sample.e} mode="xz" color={eColor} />)}</>}
    {viewMode === '3d' && showOrthogonality && <OrthogonalityMarker x={4} color="#f4b942" />}
    <Line points={[[xWorld(direction === 'right' ? 7.45 : 8.05), -2.55, 0], [xWorld(direction === 'right' ? 8.05 : 7.45), -2.55, 0]]} color="#343a40" lineWidth={1.8} /><Html position={[xWorld(4), 3.1, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '17px', fontWeight: 900, whiteSpace: 'nowrap' }}>{title}</span></Html><Html position={[xWorld(6.5), 2.75, 0]} center distanceFactor={8}><span style={{ color: bColor, fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>波沿 x 轴{direction === 'right' ? '向右' : '向左'}传播</span></Html>{viewMode !== 'yz' && <><Html position={[xWorld(0.35), 2.65, 0]} center distanceFactor={8}><span style={{ color: eColor, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>E（电场）</span></Html><Html position={[xWorld(0.35), 0, 1.75]} center distanceFactor={8}><span style={{ color: bColor, fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>B（磁场）</span></Html></>}<Html position={[xWorld(4), -3.15, 0]} center distanceFactor={8}><span style={{ color: textColor, fontSize: '10px', whiteSpace: 'nowrap' }}>{projectionMode ? '实线：当前场分布 · 点 ⊙ / 叉 ⊗：垂直屏幕的矢量投影' : '红色 E 沿 y 振荡 · 蓝色 B 沿 z 振荡 · 黄色直角符表示正交关系'}</span></Html>
  </group>
}
