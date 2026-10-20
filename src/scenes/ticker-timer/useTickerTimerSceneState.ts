import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from "react";
import { useAnimatedState } from "../../simulation/useAnimatedState";
import { useFixedStepper } from "../../simulation/useFixedStepper";
import {
  FIXED_STEP_S,
  createTickerTimerState,
  deriveTapeAnalysis,
  formatAccelerationLabel,
  formatDisplacementLabel,
  formatForceLabel,
  formatFrequencyLabel,
  formatPeriodLabel,
  formatQualityLabel,
  formatSpeedLabel,
  MOTION_MODE_LABELS,
  punchPhase01,
  releaseTape,
  resetTickerTimerState,
  stepTickerTimerState,
  TIMER_KIND_LABELS,
  togglePowered,
  type MotionMode,
  type TimerKind,
  type TickerTimerState,
} from "./model";

/** At most 20 fixed steps per frame, so a slow machine falls behind instead of jumping. */
const MAX_FRAME_S = FIXED_STEP_S * 20;
export const MIN_PLAYBACK_RATE = 0.25;
export const MAX_PLAYBACK_RATE = 2;
export const DEFAULT_PLAYBACK_RATE = 0.5;


export type TickerTimerSceneState = TickerTimerState &
  ReturnType<typeof deriveTapeAnalysis> & {
    kindLabel: string;
    motionLabel: string;
    periodLabel: string;
    frequencyLabel: string;
    displacementLabel: string;
    speedLabel: string;
    measuredAccelerationLabel: string;
    frictionLabel: string;
    qualityLabel: string;
    phase01: number;
    playbackRate: number;
    showLabels: boolean;
    setKind: (value: TimerKind) => void;
    setMotionMode: (value: MotionMode) => void;
    setFrequencyHz: (value: number) => void;
    setVoltageV: (value: number) => void;
    setInitialSpeedMps: (value: number) => void;
    setDriveAccelerationMps2: (value: number) => void;
    setShowLabels: (value: boolean) => void;
    setPlaybackRate: (value: number) => void;
    togglePower: () => void;
    release: () => void;
    reset: () => void;
  };

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['kind', 'motionMode', 'frequencyHz', 'voltageV', 'initialSpeedMps', 'driveAccelerationMps2', 'massKg'] as const

export function useTickerTimerSceneState(): TickerTimerSceneState {
  const [playbackRate, setPlaybackRateState] = useState(() => recall('ticker-timer.playbackRate', DEFAULT_PLAYBACK_RATE));
  const [showLabels, setShowLabels] = useState(() => recall('ticker-timer.showLabels', true));
  useRemember('ticker-timer', { playbackRate, showLabels })
  // The tape is punched in fixed steps; this scene has its own 播放速度 instead of the shell's.
  const { stepper, resetCarry } = useFixedStepper(stepTickerTimerState, FIXED_STEP_S);
  const { state: simulation, commit: commitSimulation } = useAnimatedState<TickerTimerState>(
    () => rememberFields('ticker-timer', createTickerTimerState(), REMEMBERED_FIELDS),
    stepper,
    (state) => state.powered && !state.finished,
    { honourPlaybackRate: false, timeScale: playbackRate, maxFrameSeconds: MAX_FRAME_S },
  );
  useRememberFields('ticker-timer', simulation, REMEMBERED_FIELDS)
  const resetAnimationClock = resetCarry;

  const analysis = useMemo(() => deriveTapeAnalysis(simulation), [simulation]);

  return {
    ...simulation,
    ...analysis,
    kindLabel: TIMER_KIND_LABELS[simulation.kind],
    motionLabel: MOTION_MODE_LABELS[simulation.motionMode],
    periodLabel: formatPeriodLabel(analysis.periodS),
    frequencyLabel: formatFrequencyLabel(simulation.frequencyHz),
    displacementLabel: formatDisplacementLabel(analysis.displacementM),
    speedLabel: formatSpeedLabel(analysis.instantaneousSpeedMps),
    measuredAccelerationLabel: formatAccelerationLabel(
      analysis.measuredAccelerationMps2,
    ),
    frictionLabel: formatForceLabel(analysis.frictionForceN),
    qualityLabel: formatQualityLabel(analysis.printQuality),
    phase01: punchPhase01(simulation.elapsedTimeS, simulation.frequencyHz),
    playbackRate,
    showLabels,
    setKind: (kind) =>
      commitSimulation((previous) =>
        resetTickerTimerState({ ...previous, kind }),
      ),
    setMotionMode: (motionMode) =>
      commitSimulation((previous) =>
        resetTickerTimerState({ ...previous, motionMode }),
      ),
    setFrequencyHz: (frequencyHz) =>
      commitSimulation((previous) => ({ ...previous, frequencyHz })),
    setVoltageV: (voltageV) =>
      commitSimulation((previous) => ({ ...previous, voltageV })),
    setInitialSpeedMps: (initialSpeedMps) =>
      commitSimulation((previous) => ({ ...previous, initialSpeedMps })),
    setDriveAccelerationMps2: (driveAccelerationMps2) =>
      commitSimulation((previous) => ({ ...previous, driveAccelerationMps2 })),
    setShowLabels,
    setPlaybackRate: (value) => {
      const next = Math.min(
        MAX_PLAYBACK_RATE,
        Math.max(MIN_PLAYBACK_RATE, value),
      );
      setPlaybackRateState(next);
    },
    togglePower: () => {
      resetAnimationClock();
      commitSimulation((previous) => togglePowered(previous));
    },
    release: () => {
      resetAnimationClock();
      commitSimulation((previous) => releaseTape(previous));
    },
    reset: () => {
      resetAnimationClock();
      commitSimulation((previous) => resetTickerTimerState(previous));
      setPlaybackRateState(DEFAULT_PLAYBACK_RATE);
    },
  };
}
