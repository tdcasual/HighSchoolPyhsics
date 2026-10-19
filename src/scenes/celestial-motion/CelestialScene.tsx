import { useEffect, useRef, useState, type RefObject } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { formatScientific } from '../../core/formatNumber'
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
import { CELESTIAL_CAMERA, celestialCamera, celestialPose, outerRadius } from './pose'
import { useCelestialMotionSceneState } from './useCelestialMotionSceneState'
import './celestial-motion.css'

type ViewportSize = { left: number; width: number; height: number }

function useViewportSize(ref: RefObject<HTMLDivElement | null>): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ left: 0, width: 1280, height: 720 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight
      setSize((previous) =>
        Math.abs(previous.left - rect.left) < 1 &&
        Math.abs(previous.width - width) < 1 &&
        Math.abs(previous.height - height) < 1
          ? previous
          : { left: rect.left, width, height },
      )
    }
    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref])
  return size
}

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
  const viewportSize = useViewportSize(viewportRef)
  const sidebarCollapsed = useAppStore((store) => store.sidebarCollapsed)
  const scenario = state.scenario
  const pose = celestialPose({
    scenario,
    showVectors: state.showVectors,
    showArea: state.showArea,
    showPlane: state.showPlane,
    corotate: state.corotate,
  })
  const outer = outerRadius(scenario)
  const compactViewport = viewportSize.width <= 767
  const sidebarWidth = sidebarCollapsed ? 44 : 320
  const safeLeft = compactViewport ? 12 : Math.max(12, sidebarWidth + 24 - viewportSize.left)
  const safeRight = Math.max(safeLeft + 1, viewportSize.width - (compactViewport ? 12 : 24))
  const safeAspect = (safeRight - safeLeft) / Math.max(1, viewportSize.height)
  const centerOffsetPixels = (safeLeft + safeRight) / 2 - viewportSize.width / 2
  const cameraFrame = celestialCamera(state.azimuthDeg, state.elevationDeg, outer, {
    aspect: safeAspect,
    centerOffsetPixels,
    viewportHeight: viewportSize.height,
  })
  const maxCameraDistance = Math.max(32, Math.ceil(cameraFrame.radius * 1.5))
  const currentRadius = scenario.mode === 'transfer' ? transferRadius(scenario) : scenario.r1
  const currentSpeed = scenario.mode === 'transfer' ? transferSpeed(scenario) : scenario.o1.v
  const currentOmega = scenario.mode === 'transfer' ? transferAngularSpeed(scenario) : scenario.o1.omega
  const currentPeriod = scenario.mode === 'transfer' ? scenario.transT : scenario.o1.T
  const currentAcceleration = scenario.mode === 'transfer' ? scenario.mu / currentRadius ** 2 : scenario.o1.a
  const transferProgress = Math.min(100, (scenario.time / scenario.transT) * 100)
  const ground = scenario.mode === 'synchronous' ? groundPoint(scenario.inclination, scenario.phase, scenario.time) : null
  const playLabel = state.running ? '暂停' : state.finished ? '再演示' : '开始'

  return (
    <SceneLayout
      controls={<CelestialControls state={state} scenario={scenario} />}
      dataOverlay={
        <div className="celestial-telemetry scene-core-summary-stack">
          <p><span>中心天体 / M</span><strong>{scenario.body.name} · {formatScientific(scenario.body.M, 4)} kg</strong></p>
          <p><span>R / 表面 g₀</span><strong>{(scenario.body.R / 1000).toFixed(0)} km / {scenario.surfaceG.toFixed(3)} m/s²</strong></p>
          <p><span>轨道半径 r</span><strong>{(currentRadius / 1000).toFixed(0)} km · {(currentRadius / scenario.body.R).toFixed(2)} R</strong></p>
          <p><span>速度 v</span><strong>{formatSpeed(currentSpeed)}</strong></p>
          <p><span>角速度 ω</span><strong>{formatScientific(currentOmega, 4)} rad/s</strong></p>
          <p><span>{scenario.mode === 'transfer' ? '转移时间' : '周期'}</span><strong>{formatDuration(currentPeriod)}</strong></p>
          <p><span>向心加速度</span><strong>{currentAcceleration.toFixed(3)} m/s²</strong></p>
          <p><span>结论</span><strong>{conclusion(scenario)}</strong></p>
          {scenario.mode === 'rendezvous' ? (
            <>
              <p><span>外轨 v₂ / T₂</span><strong>{formatSpeed(scenario.o2.v)} / {formatDuration(scenario.o2.T)}</strong></p>
              <p><span>会合周期</span><strong>{formatDuration(scenario.synodic)}</strong></p>
            </>
          ) : null}
          {scenario.mode === 'transfer' ? (
            <>
              <p><span>转移进度</span><strong>{transferProgress.toFixed(0)}%</strong></p>
              <p><span>两次点火 Δv</span><strong>{scenario.dv1.toFixed(0)} / {scenario.dv2.toFixed(0)} m/s</strong></p>
            </>
          ) : null}
          {ground ? (
            <p><span>星下点经 / 纬</span><strong>{(ground.longitude * 180 / Math.PI).toFixed(1)}° / {(ground.latitude * 180 / Math.PI).toFixed(1)}°</strong></p>
          ) : null}
          {scenario.mode === 'circular' ? (
            <p><span>表面 v₁ / 逃逸 v₂</span><strong>{formatSpeed(surfaceSpeeds(scenario.mu, scenario.body.R).v1)} / {formatSpeed(surfaceSpeeds(scenario.mu, scenario.body.R).v2)}</strong></p>
          ) : null}
          <details className="celestial-equations">
            <summary>计算关系</summary>
            <p>GM = g₀R² = {formatScientific(scenario.mu, 4)} m³/s²</p>
            <p>v = √(GM/r) · ω = √(GM/r³)</p>
            <p>r³/T² = GM/(4π²)</p>
          </details>
        </div>
      }
      chart={<CelestialChart scenario={scenario} />}
      chartVisible
      chartInitiallyCollapsed
      auxiliaryPanelPlacement="after-sidebar"
      playbackActions={[
        { key: 'play', label: playLabel, onClick: state.toggleRunning },
        { key: 'step', label: '单步', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <div ref={viewportRef} className="celestial-viewport">
        <InteractiveCanvas
          camera={{
            position: cameraFrame.position,
            fov: CELESTIAL_CAMERA.fov,
            near: CELESTIAL_CAMERA.near,
            far: CELESTIAL_CAMERA.far,
          }}
          syncCamera
          adaptiveFraming={false}
          controls={{
            target: cameraFrame.target,
            minDistance: CELESTIAL_CAMERA.minDistance,
            maxDistance: maxCameraDistance,
            minPolarAngle: CELESTIAL_CAMERA.minPolarAngle,
            maxPolarAngle: CELESTIAL_CAMERA.maxPolarAngle,
          }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CelestialRig3D pose={pose} night={theme === 'night'} />
        </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default CelestialScene
