import { useEffect, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { orbitPosition } from '../../scene3d/orbitFraming'
import { CartChart } from './CartChart'
import { CartControls } from './CartControls'
import { CartRig3D } from './CartRig3D'
import { DURATION, fit, hookAcceleration, stringAngle } from './model'
import { CART_CAMERA, cartPose, cartView, motionOf } from './pose'
import { useCartVelocitySceneState } from './useCartVelocitySceneState'
import './cart-velocity.css'
import { useAppStore } from '../../store/useAppStore'

function conditionLine(hooks: number, dh: number, x: number, v0: number): string {
  if (hooks <= 0) return '不挂钩码'
  if (Math.abs(dh) < 0.0025) return `${hooks} 个 · ${hookAcceleration(hooks).toFixed(3)} m/s²`
  const degrees = Math.abs(stringAngle(motionOf({ hooks, v0, dh, time: 0 }), x) * 180 / Math.PI)
  return `夹角 ${degrees.toFixed(1)}°`
}

export function CartScene() {
  const theme = useAppStore((store) => store.theme)
  const state = useCartVelocitySceneState()
  const [compactViewport, setCompactViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 767,
  )
  useEffect(() => {
    const updateViewport = () => setCompactViewport(window.innerWidth <= 767)
    window.addEventListener('resize', updateViewport)
    updateViewport()
    return () => window.removeEventListener('resize', updateViewport)
  }, [])
  const view = cartView(state.view, state.focusPart, compactViewport)
  const pose = cartPose(state)
  const locked = state.stage === 'assemble'
  const playLabel = state.running ? '暂停' : state.time >= DURATION ? '再做一次' : '开始实验'
  const graphFit = fit(state.points)

  return (
    <SceneLayout
      controls={<CartControls state={state} />}
      dataOverlay={
        <div className="cart-telemetry scene-core-summary-stack">
          <p><span>时间</span><strong>{state.time.toFixed(2)} s</strong></p>
          <p><span>位移</span><strong>{(pose.x * 100).toFixed(2)} cm</strong></p>
          <p><span>速度</span><strong>{pose.v.toFixed(3)} m/s</strong></p>
          <p><span>打点</span><strong>{pose.dots.length}</strong></p>
          <p><span>钩码</span><strong>{conditionLine(state.hooks, state.dh, pose.x, state.v0)}</strong></p>
          {state.selected ? (
            <div className="cart-measurement-readout">
              <strong>{state.selected.label} 点速度测量</strong>
              <p><span>中间时刻 t</span><strong>{state.selected.t.toFixed(2)} s</strong></p>
              <p><span>中央差分</span><strong>({state.selected.right} − {state.selected.left}) / Δt</strong></p>
              <p><span>位移 Δx</span><strong>{(state.selected.dx * 100).toFixed(2)} cm</strong></p>
              <p><span>时间 Δt</span><strong>{state.selected.dt.toFixed(2)} s</strong></p>
              <p><span>速度 v</span><strong>{state.selected.v.toFixed(3)} m/s</strong></p>
            </div>
          ) : null}
          {state.stage === 'graph' && graphFit ? (
            <div className="cart-measurement-readout">
              <strong>v–t 线性拟合</strong>
              <p><span>斜率 a</span><strong>{graphFit.a.toFixed(3)} m/s²</strong></p>
              <p><span>截距 v₀</span><strong>{graphFit.v0.toFixed(3)} m/s</strong></p>
            </div>
          ) : null}
        </div>
      }
      chart={<CartChart
        points={state.points}
        runs={state.runs}
        group={state.group}
        selected={state.selected?.index ?? null}
        showFit={state.stage === 'graph' && state.showFit}
        showSlopeTriangle={state.stage === 'graph' && state.showSlopeTriangle}
        onSelectPoint={(index) => {
          state.selectPoint(index)
          state.setStage('measure')
        }}
      />}
      chartVisible
      playbackActions={[
        { key: 'play', label: playLabel, onClick: state.toggleRunning, disabled: locked },
        { key: 'step', label: '单步', onClick: state.step, disabled: locked },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: orbitPosition(view), fov: CART_CAMERA.fov, near: CART_CAMERA.near, far: CART_CAMERA.far }}
          adaptiveFraming={false}
          syncCamera
          controls={{
            target: view.target,
            minDistance: CART_CAMERA.minDistance,
            maxDistance: CART_CAMERA.maxDistance,
            minPolarAngle: CART_CAMERA.minPolarAngle,
            maxPolarAngle: CART_CAMERA.maxPolarAngle,
          }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CartRig3D pose={pose} skin={state.skin} night={theme === 'night'} />
        </InteractiveCanvas>
      }
    />
  )
}

export default CartScene
