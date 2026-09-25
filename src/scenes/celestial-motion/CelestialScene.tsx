import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
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
} from './model'
import { CELESTIAL_CAMERA, celestialCameraPosition, celestialPose, outerRadius } from './pose'
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
  const state = useCelestialMotionSceneState()
  const scenario = state.scenario
  const pose = celestialPose({
    scenario,
    showVectors: state.showVectors,
    showArea: state.showArea,
    showPlane: state.showPlane,
    corotate: state.corotate,
  })
  const outer = outerRadius(scenario)
  const radiusText = scenario.mode === 'synchronous' || scenario.mode === 'circular'
    ? `${scenario.q1.toFixed(2)} R`
    : `${scenario.q1.toFixed(2)} / ${scenario.q2.toFixed(2)} R`
  const playLabel = state.running ? '暂停' : state.finished ? '再演示' : '开始'

  return (
    <SceneLayout
      controls={<CelestialControls state={state} scenario={scenario} />}
      dataOverlay={
        <div className="celestial-telemetry scene-core-summary-stack">
          <p><span>天体</span><strong>{scenario.body.name}</strong></p>
          <p><span>轨道</span><strong>{radiusText}</strong></p>
          <p><span>速度</span><strong>{formatSpeed(scenario.mode === 'transfer' ? scenario.vp : scenario.o1.v)}</strong></p>
          <p><span>周期</span><strong>{formatDuration(scenario.mode === 'transfer' ? scenario.transT : scenario.o1.T)}</strong></p>
          <p><span>结论</span><strong>{conclusion(scenario)}</strong></p>
        </div>
      }
      chart={<CelestialChart scenario={scenario} />}
      chartVisible
      playbackActions={[
        { key: 'play', label: playLabel, onClick: state.toggleRunning },
        { key: 'step', label: '单步', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          key={`${state.view}-${state.azimuthDeg}-${state.elevationDeg}-${state.mode}`}
          camera={{
            position: celestialCameraPosition(state.azimuthDeg, state.elevationDeg, outer),
            fov: CELESTIAL_CAMERA.fov,
            near: CELESTIAL_CAMERA.near,
            far: CELESTIAL_CAMERA.far,
          }}
          adaptiveFraming={false}
          controls={{
            target: [0, 0, 0],
            minDistance: CELESTIAL_CAMERA.minDistance,
            maxDistance: CELESTIAL_CAMERA.maxDistance,
            minPolarAngle: CELESTIAL_CAMERA.minPolarAngle,
            maxPolarAngle: CELESTIAL_CAMERA.maxPolarAngle,
          }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CelestialRig3D pose={pose} />
        </InteractiveCanvas>
      }
    />
  )
}

export default CelestialScene
