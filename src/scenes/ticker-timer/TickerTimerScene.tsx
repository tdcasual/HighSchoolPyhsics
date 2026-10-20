import { DataRows } from '../../ui/panels/DataRows'
import { FittedCanvas } from "../../scene3d/FittedCanvas";
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
      chartInitiallyCollapsed
      dataOverlay={
        <DataRows
          className="ticker-telemetry"
          rows={[
            { label: '状态', value: state.finished
                ? "记录已结束 · 请重置"
                : state.released
                  ? "纸带运动中"
                  : state.powered
                    ? "已通电 · 待释放"
                    : "待通电" },
            { label: '点迹', value: <>{state.dotCount} 个 · {state.qualityLabel}</> },
            { label: '纸带位移', value: state.displacementLabel },
            { label: '瞬时速度', value: state.speedLabel },
            { label: '逐差法加速度', value: state.measuredAccelerationLabel, answer: true },
          ]}
        />
      }
      notes={
        <p>
          {state.kindLabel}：{state.powered ? '已通电' : '未通电'} · {state.voltageLabel}，打点周期 T = {state.periodLabel}（{state.frequencyLabel}）；纸带阻力 {state.frictionLabel}。
        </p>
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
        <FittedCanvas
          shot={{ from: [6.8, 5.2, 7.3], to: [0, 0.75, 0] }}
          fov={38}
          minDistance={4.5}
          maxDistance={18}
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
        </FittedCanvas>
      }
    />
  );
}

export default TickerTimerScene;
