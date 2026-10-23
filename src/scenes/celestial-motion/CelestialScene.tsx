import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useRef } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useFittedOrbitCamera } from '../../scene3d/useFittedOrbitCamera'
import { useAppStore } from '../../store/useAppStore'
import { formatScientific } from '../../ui/formatNumber'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CelestialChart } from './CelestialChart'
import { CelestialControls } from './CelestialControls'
import { CelestialRig3D } from './CelestialRig3D'
import {
  formatDuration,
  formatSpeed,
  groundPoint,
  isStationary,
  surfaceSpeeds,
  transferAngularSpeed,
  transferRadius,
  transferSpeed,
} from './model'
import { CELESTIAL_CAMERA, celestialPose, celestialView, outerRadius } from './pose'
import { useCelestialMotionSceneState } from './useCelestialMotionSceneState'
import './celestial-motion.css'

function conclusion(scenario: ReturnType<typeof useCelestialMotionSceneState>['scenario']) {
  if (scenario.mode === 'synchronous') {
    if (isStationary(scenario)) return '静止卫星'
    const point = groundPoint(scenario.inclination, scenario.phase, scenario.time)
    const latitude = (point.latitude * 180) / Math.PI
    const hemisphere = latitude >= 0 ? '北纬' : '南纬'
    return `${hemisphere} ${Math.abs(latitude).toFixed(1)}°`
  }
  if (scenario.mode === 'transfer') {
    return `进度 ${Math.min(100, (scenario.time / scenario.transT) * 100).toFixed(0)}%`
  }
  if (scenario.mode === 'rendezvous') {
    let relative = (scenario.phase + (scenario.o2.omega - scenario.o1.omega) * scenario.time) % (2 * Math.PI)
    if (relative < 0) relative += 2 * Math.PI
    return `相位差 ${((relative * 180) / Math.PI).toFixed(0)}°`
  }
  return `v₁ ${formatSpeed(surfaceSpeeds(scenario.mu, scenario.body.R).v1)}`
}

export function CelestialScene() {
  const theme = useAppStore((store) => store.theme)
  const state = useCelestialMotionSceneState()
  const viewportRef = useRef<HTMLDivElement>(null)
  const scenario = state.scenario
  const pose = celestialPose({
    scenario,
    showVectors: state.showVectors,
    showArea: state.showArea,
    showPlane: state.showPlane,
    corotate: state.corotate,
  })
  const outer = outerRadius(scenario)
  // Fit the orbits into the largest free area once per view or scenario; panel changes only cover it.
  const camera = useFittedOrbitCamera(
    viewportRef,
    `${state.azimuthDeg}:${state.elevationDeg}:${scenario.mode}:${outer.toFixed(3)}`,
    CELESTIAL_CAMERA,
    (area) => celestialView(state.azimuthDeg, state.elevationDeg, outer, area),
  )
  const currentRadius = scenario.mode === 'transfer' ? transferRadius(scenario) : scenario.r1
  const currentSpeed = scenario.mode === 'transfer' ? transferSpeed(scenario) : scenario.o1.v
  const currentOmega = scenario.mode === 'transfer' ? transferAngularSpeed(scenario) : scenario.o1.omega
  const currentPeriod = scenario.mode === 'transfer' ? scenario.transT : scenario.o1.T
  const currentAcceleration = scenario.mode === 'transfer' ? scenario.mu / currentRadius ** 2 : scenario.o1.a
  const transferProgress = Math.min(100, (scenario.time / scenario.transT) * 100)
  const ground =
    scenario.mode === 'synchronous' ? groundPoint(scenario.inclination, scenario.phase, scenario.time) : null

  return (
    <SceneLayout
      timeControl
      controls={<CelestialControls state={state} scenario={scenario} />}
      dataOverlay={
        <DataRows
          className="celestial-telemetry"
          rows={[
            {
              label: '轨道半径 r',
              value: (
                <>
                  {(currentRadius / 1000).toFixed(0)} km · {(currentRadius / scenario.body.R).toFixed(2)} R
                </>
              ),
            },
            { label: '速度 v', value: formatSpeed(currentSpeed), answer: true },
            {
              label: scenario.mode === 'transfer' ? '转移时间' : '周期',
              value: formatDuration(currentPeriod),
              answer: true,
            },
            scenario.mode === 'rendezvous'
              ? { label: '会合周期', value: formatDuration(scenario.synodic), answer: true }
              : { label: '向心加速度', value: <>{currentAcceleration.toFixed(3)} m/s²</>, answer: true },
            {
              label: '表面 v₁ / 逃逸 v₂',
              value: (
                <>
                  {formatSpeed(surfaceSpeeds(scenario.mu, scenario.body.R).v1)} /{' '}
                  {formatSpeed(surfaceSpeeds(scenario.mu, scenario.body.R).v2)}
                </>
              ),
              answer: true,
              when: scenario.mode === 'circular',
            },
            {
              label: '进度 · 点火 Δv',
              value: (
                <>
                  {transferProgress.toFixed(0)}% · {scenario.dv1.toFixed(0)} / {scenario.dv2.toFixed(0)} m/s
                </>
              ),
              when: scenario.mode === 'transfer',
            },
            {
              label: '星下点经 / 纬',
              value: ground ? (
                <>
                  {((ground.longitude * 180) / Math.PI).toFixed(1)}° / {((ground.latitude * 180) / Math.PI).toFixed(1)}°
                  {isStationary(scenario) ? ' · 静止卫星' : ''}
                </>
              ) : null,
              when: scenario.mode === 'synchronous' && Boolean(ground),
            },
            {
              label: '结论',
              value: conclusion(scenario),
              when: !['circular', 'transfer'].includes(scenario.mode) && !(scenario.mode === 'synchronous' && ground),
            },
          ]}
        />
      }
      notes={
        <>
          <p>
            中心天体：{scenario.body.name}，M = {formatScientific(scenario.body.M, 4)} kg，R ={' '}
            {(scenario.body.R / 1000).toFixed(0)} km，表面 g₀ = {scenario.surfaceG.toFixed(3)} m/s²。
          </p>
          <p>
            当前角速度 ω = {formatScientific(currentOmega, 4)} rad/s
            {scenario.mode === 'rendezvous'
              ? `；外轨 v₂ = ${formatSpeed(scenario.o2.v)}，T₂ = ${formatDuration(scenario.o2.T)}`
              : ''}
            。
          </p>
          <p>GM = g₀R² = {formatScientific(scenario.mu, 4)} m³/s²；v = √(GM/r)，ω = √(GM/r³)；r³/T² = GM/(4π²)。</p>
        </>
      }
      chart={<CelestialChart scenario={scenario} />}
      chartVisible
      chartInitiallyCollapsed
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        { playLabel: '开始', finished: state.finished, stepLabel: '单步', onReset: state.reset },
      )}
      viewport={
        <div ref={viewportRef} className="celestial-viewport">
          <InteractiveCanvas {...camera.canvasProps} frameloop={state.running ? 'always' : 'demand'}>
            <CelestialRig3D pose={pose} night={theme === 'night'} />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default CelestialScene
