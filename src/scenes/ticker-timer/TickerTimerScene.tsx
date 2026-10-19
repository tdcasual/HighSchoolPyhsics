import { InteractiveCanvas } from "../../scene3d/InteractiveCanvas";
import { RangeField } from "../../ui/controls/RangeField";
import { SceneLayout } from "../../ui/layout/SceneLayout";
import { TickerTimerChart } from "./TickerTimerChart";
import { TickerTimerControls } from "./TickerTimerControls";
import { TickerTimerRig3D } from "./TickerTimerRig3D";
import { useTickerTimerSceneState } from "./useTickerTimerSceneState";
import {
  MAX_PLAYBACK_RATE,
  MIN_PLAYBACK_RATE,
} from "./useTickerTimerSceneState";
import "./ticker-timer.css";

export function TickerTimerScene() {
  const state = useTickerTimerSceneState();
  const animating = state.powered && !state.finished;

  return (
    <SceneLayout
      controls={<TickerTimerControls state={state} />}
      panelPlacement="default"
      auxiliaryPanelPlacement="after-sidebar"
      chartInitiallyCollapsed
      playbackInitiallyCollapsed
      dataOverlay={
        <div className="ticker-telemetry scene-core-summary-stack">
          <p>
            <span>计时器</span>
            <strong>{state.kindLabel}</strong>
          </p>
          <p>
            <span>电源</span>
            <strong>
              {state.powered ? "已通电" : "未通电"} · {state.voltageLabel}
            </strong>
          </p>
          <p>
            <span>打点周期 T</span>
            <strong>
              {state.periodLabel}（{state.frequencyLabel}）
            </strong>
          </p>
          <p>
            <span>实验状态</span>
            <strong>
              {state.finished
                ? "记录已结束 · 请重置"
                : state.released
                  ? "纸带运动中"
                  : state.powered
                    ? "已通电 · 待释放"
                    : "待通电"}
            </strong>
          </p>
          <p>
            <span>点迹</span>
            <strong>
              {state.dotCount} 个 · {state.qualityLabel}
            </strong>
          </p>
          <p>
            <span>纸带位移</span>
            <strong>{state.displacementLabel}</strong>
          </p>
          <p>
            <span>瞬时速度</span>
            <strong>{state.speedLabel}</strong>
          </p>
          <p>
            <span>逐差法加速度</span>
            <strong>{state.measuredAccelerationLabel}</strong>
          </p>
          <p>
            <span>纸带阻力</span>
            <strong>{state.frictionLabel}</strong>
          </p>
        </div>
      }
      chart={
        <TickerTimerChart
          dots={state.dots}
          speedSeriesMps={state.speedSeriesMps}
          instantaneousSpeedMps={state.instantaneousSpeedMps}
        />
      }
      chartVisible
      playbackControls={
        <RangeField
          id="ticker-playback-rate"
          label="播放速度"
          min={MIN_PLAYBACK_RATE}
          max={MAX_PLAYBACK_RATE}
          step={0.25}
          value={state.playbackRate}
          onChange={state.setPlaybackRate}
          unit="×"
          displayValue={`${state.playbackRate.toFixed(2)}×`}
          showMinMax
        />
      }
      playbackActions={[
        {
          key: "power",
          label: state.powered ? "断电" : "通电",
          onClick: state.togglePower,
          disabled: state.finished && !state.powered,
        },
        {
          key: "release",
          label: "释放纸带",
          onClick: state.release,
          disabled: !state.powered || state.released || state.finished,
        },
        {
          key: "reset",
          label: "重置",
          onClick: state.reset,
        },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [6.8, 5.2, 7.3], fov: 38 }}
          controls={{ target: [0, 0.75, 0], minDistance: 4.5, maxDistance: 18 }}
          frameloop={animating ? "always" : "demand"}
        >
          <TickerTimerRig3D
            kind={state.kind}
            powered={state.powered}
            phase01={state.phase01}
            printQuality={state.printQuality}
            displacementM={state.displacementM}
            dots={state.dots}
            showLabels={state.showLabels}
          />
        </InteractiveCanvas>
      }
    />
  );
}

export default TickerTimerScene;
