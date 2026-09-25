import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { orbitPosition } from '../measuring-tools/pose'
import { CartChart } from './CartChart'
import { CartControls } from './CartControls'
import { CartRig3D } from './CartRig3D'
import { DURATION, hookAcceleration, stringAngle } from './model'
import { CART_CAMERA, cartPose, cartView, motionOf } from './pose'
import { useCartVelocitySceneState } from './useCartVelocitySceneState'
import './cart-velocity.css'

function conditionLine(hooks: number, dh: number, x: number, v0: number): string {
  if (hooks <= 0) return '不挂钩码'
  if (Math.abs(dh) < 0.0025) return `${hooks} 个 · ${hookAcceleration(hooks).toFixed(3)} m/s²`
  const degrees = Math.abs(stringAngle(motionOf({ hooks, v0, dh, time: 0 }), x) * 180 / Math.PI)
  return `夹角 ${degrees.toFixed(1)}°`
}

export function CartScene() {
  const state = useCartVelocitySceneState()
  const view = cartView(state.view)
  const pose = cartPose(state)
  const locked = state.stage === 'assemble' && state.assembly < 5
  const playLabel = state.running ? '暂停' : state.time >= DURATION ? '再做一次' : '开始实验'

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
        </div>
      }
      chart={<CartChart points={state.points} runs={state.runs} group={state.group} selected={state.selected?.index ?? null} />}
      chartVisible
      playbackActions={[
        { key: 'play', label: playLabel, onClick: state.toggleRunning, disabled: locked },
        { key: 'step', label: '单步', onClick: state.step, disabled: locked },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          key={state.view}
          camera={{ position: orbitPosition(view), fov: CART_CAMERA.fov, near: CART_CAMERA.near, far: CART_CAMERA.far }}
          adaptiveFraming={false}
          controls={{
            target: view.target,
            minDistance: CART_CAMERA.minDistance,
            maxDistance: CART_CAMERA.maxDistance,
            minPolarAngle: CART_CAMERA.minPolarAngle,
            maxPolarAngle: CART_CAMERA.maxPolarAngle,
          }}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CartRig3D pose={pose} skin={state.skin} />
        </InteractiveCanvas>
      }
    />
  )
}

export default CartScene
