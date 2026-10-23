import { clockActions } from '../../simulation/clockActions'
import { DataRows } from '../../ui/panels/DataRows'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { boxAround } from '../../scene3d/orbitFraming'
import { SceneLayout } from '../../ui/layout/SceneLayout'
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
  const degrees = Math.abs((stringAngle(motionOf({ hooks, v0, dh, time: 0 }), x) * 180) / Math.PI)
  return `夹角 ${degrees.toFixed(1)}°`
}

export function CartScene() {
  const theme = useAppStore((store) => store.theme)
  const state = useCartVelocitySceneState()
  // Presets give the direction; the track (or the focused part's surroundings) is fitted to the free area.
  const view = cartView(state.view, state.focusPart)
  const closeUp = state.focusPart !== null || state.view === 'focus'
  const shot = closeUp
    ? {
        azimuth: view.azimuth,
        elevation: view.elevation,
        anchor: view.target,
        bounds: boxAround(view.target, [view.radius * 0.22, view.radius * 0.14, view.radius * 0.18]),
      }
    : { azimuth: view.azimuth, elevation: view.elevation }
  const pose = cartPose(state)
  const locked = state.stage === 'assemble'
  const graphFit = fit(state.points)

  return (
    <SceneLayout
      timeControl
      controls={<CartControls state={state} />}
      dataOverlay={
        <DataRows
          className="cart-telemetry"
          rows={[
            { label: '时间', value: <>{state.time.toFixed(2)} s</> },
            { label: '位移', value: <>{(pose.x * 100).toFixed(2)} cm</> },
            { label: '速度', value: <>{pose.v.toFixed(3)} m/s</> },
            { label: '打点', value: pose.dots.length },
            { label: '钩码', value: conditionLine(state.hooks, state.dh, pose.x, state.v0) },
          ]}
          note={
            <>
              {state.selected ? (
                <div className="cart-measurement-readout">
                  <strong>{state.selected.label} 点速度测量</strong>
                  <p>
                    <span>中间时刻 t</span>
                    <strong>{state.selected.t.toFixed(2)} s</strong>
                  </p>
                  <p>
                    <span>中央差分</span>
                    <strong>
                      ({state.selected.right} − {state.selected.left}) / Δt
                    </strong>
                  </p>
                  <p>
                    <span>位移 Δx</span>
                    <strong>{(state.selected.dx * 100).toFixed(2)} cm</strong>
                  </p>
                  <p>
                    <span>时间 Δt</span>
                    <strong>{state.selected.dt.toFixed(2)} s</strong>
                  </p>
                  <p>
                    <span>速度 v</span>
                    <strong>{state.selected.v.toFixed(3)} m/s</strong>
                  </p>
                </div>
              ) : null}
              {state.stage === 'graph' && graphFit ? (
                <div className="cart-measurement-readout">
                  <strong>v–t 线性拟合</strong>
                  <p>
                    <span>斜率 a</span>
                    <strong>{graphFit.a.toFixed(3)} m/s²</strong>
                  </p>
                  <p>
                    <span>截距 v₀</span>
                    <strong>{graphFit.v0.toFixed(3)} m/s</strong>
                  </p>
                </div>
              ) : null}
            </>
          }
        />
      }
      chart={
        <CartChart
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
        />
      }
      chartVisible
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        {
          playLabel: '开始实验',
          finished: state.time >= DURATION,
          finishedLabel: '再做一次',
          stepLabel: '单步',
          disabled: locked,
          onReset: state.reset,
        },
      )}
      viewport={
        <FittedCanvas
          shot={shot}
          refitKey={`${state.view}:${state.focusPart ?? ''}`}
          {...CART_CAMERA}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <CartRig3D pose={pose} skin={state.skin} night={theme === 'night'} />
        </FittedCanvas>
      }
    />
  )
}

export default CartScene
