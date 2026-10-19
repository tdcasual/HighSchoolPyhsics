import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const FIXED_STEP_MS = FIXED_STEP_S * 1000;
const MAX_ACCUMULATED_MS = FIXED_STEP_MS * 20;
const STEP_EPSILON_MS = 0.001;
export const MIN_PLAYBACK_RATE = 0.25;
export const MAX_PLAYBACK_RATE = 2;
export const DEFAULT_PLAYBACK_RATE = 0.5;

type StateUpdater =
  TickerTimerState | ((previous: TickerTimerState) => TickerTimerState);

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
  const [simulation, setSimulation] = useState(() => rememberFields('ticker-timer', createTickerTimerState(), REMEMBERED_FIELDS));
  useRememberFields('ticker-timer', simulation, REMEMBERED_FIELDS)
  const [playbackRate, setPlaybackRateState] = useState(() => recall('ticker-timer.playbackRate', DEFAULT_PLAYBACK_RATE));
  const [showLabels, setShowLabels] = useState(() => recall('ticker-timer.showLabels', true));
  useRemember('ticker-timer', { playbackRate, showLabels })
  const simulationRef = useRef(simulation);
  const frameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const playbackRateRef = useRef(playbackRate);

  const resetAnimationClock = useCallback(() => {
    lastTimestampRef.current = null;
    accumulatedMsRef.current = 0;
  }, []);

  const commitSimulation = useCallback((updater: StateUpdater) => {
    setSimulation((previous) => {
      const next =
        typeof updater === "function"
          ? (updater as (prev: TickerTimerState) => TickerTimerState)(previous)
          : updater;
      simulationRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    simulationRef.current = simulation;
  }, [simulation]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const animating = simulation.powered && !simulation.finished;

  useEffect(() => {
    if (!animating || frameRef.current !== null) {
      return;
    }

    const tick = (timestampMs: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestampMs;
      } else {
        const elapsedMs = Math.max(0, timestampMs - lastTimestampRef.current);
        lastTimestampRef.current = timestampMs;
        const scaledElapsedMs = elapsedMs * playbackRateRef.current;
        accumulatedMsRef.current = Math.min(
          accumulatedMsRef.current + scaledElapsedMs,
          MAX_ACCUMULATED_MS,
        );

        let next = simulationRef.current;
        let advanced = false;
        while (accumulatedMsRef.current + STEP_EPSILON_MS >= FIXED_STEP_MS) {
          next = stepTickerTimerState(next, FIXED_STEP_S);
          accumulatedMsRef.current = Math.max(
            0,
            accumulatedMsRef.current - FIXED_STEP_MS,
          );
          advanced = true;
        }
        if (advanced) {
          simulationRef.current = next;
          setSimulation(next);
        }
      }

      const current = simulationRef.current;
      if (current.powered && !current.finished) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
        resetAnimationClock();
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      resetAnimationClock();
    };
  }, [animating, resetAnimationClock]);

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
