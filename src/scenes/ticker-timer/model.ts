export type TimerKind = "electromagnetic" | "spark";
export type MotionMode = "rest" | "uniform" | "accelerate";

export type TapeDot = {
  index: number;
  timeS: number;
  positionM: number;
  smeared: boolean;
};

export type PrintQuality = "missed" | "clear" | "smeared";

export type TickerTimerConfig = {
  kind: TimerKind;
  motionMode: MotionMode;
  frequencyHz: number;
  voltageV: number;
  initialSpeedMps: number;
  driveAccelerationMps2: number;
  massKg: number;
};

export type TickerTimerState = TickerTimerConfig & {
  powered: boolean;
  released: boolean;
  finished: boolean;
  elapsedTimeS: number;
  powerOnTimeS: number | null;
  releaseTimeS: number | null;
  /** Last set of marks produced before the timer was switched off. */
  dotHistory: TapeDot[];
};

export type TapeSpeedSample = {
  /** Time relative to tape release, at the midpoint of the measured interval. */
  timeS: number;
  speedMps: number;
};

export type TapeAnalysis = {
  periodS: number;
  frictionForceN: number;
  frictionAccelerationMps2: number;
  effectiveAccelerationMps2: number;
  displacementM: number;
  speedMps: number;
  speedSeriesMps: TapeSpeedSample[];
  dots: TapeDot[];
  dotCount: number;
  latestIntervalM: number | null;
  instantaneousSpeedMps: number | null;
  measuredAccelerationMps2: number | null;
  printQuality: PrintQuality;
  voltageLabel: string;
};

export const MAINS_FREQUENCY_HZ = 50;
export const DEFAULT_PERIOD_S = 0.02;
export const DEFAULT_MASS_KG = 0.2;
/** A longer strip gives a readable 50–80 point run at the standard 50 Hz. */
export const MAX_TAPE_M = 1.2;
export const MAX_DOTS = 240;
export const FIXED_STEP_S = 1 / 200;

/** J0203 / JY38-84: working drag ≤ 3 gf. Spark discharge is contactless. */
export const FRICTION_FORCE_N: Record<TimerKind, number> = {
  electromagnetic: 0.0294,
  spark: 0.002,
};

export const TIMER_KIND_LABELS: Record<TimerKind, string> = {
  electromagnetic: "电磁打点计时器",
  spark: "电火花打点计时器",
};

export const MOTION_MODE_LABELS: Record<MotionMode, string> = {
  rest: "静止叠点",
  uniform: "匀速拉动",
  accelerate: "匀加速运动",
};

export const DEFAULT_CONFIG: TickerTimerConfig = {
  kind: "electromagnetic",
  motionMode: "accelerate",
  frequencyHz: MAINS_FREQUENCY_HZ,
  voltageV: 6,
  initialSpeedMps: 0.2,
  driveAccelerationMps2: 1,
  massKg: DEFAULT_MASS_KG,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function derivePeriodS(frequencyHz: number): number {
  if (!(frequencyHz > 0) || !Number.isFinite(frequencyHz)) {
    return DEFAULT_PERIOD_S;
  }
  return 1 / frequencyHz;
}

export function deriveFrictionForceN(kind: TimerKind): number {
  return FRICTION_FORCE_N[kind];
}

export function derivePrintQuality(
  kind: TimerKind,
  voltageV: number,
): PrintQuality {
  if (kind === "spark") {
    return "clear";
  }
  if (voltageV < 4) {
    return "missed";
  }
  if (voltageV > 7.5) {
    return "smeared";
  }
  return "clear";
}

export function deriveEffectiveAccelerationMps2(
  config: TickerTimerConfig,
): number {
  if (config.motionMode === "rest" || config.motionMode === "uniform") {
    return 0;
  }
  const frictionA =
    deriveFrictionForceN(config.kind) / Math.max(0.05, config.massKg);
  return Math.max(0, config.driveAccelerationMps2 - frictionA);
}

export function displacementAtTimeS(
  state: TickerTimerState,
  timeS: number,
): number {
  if (
    state.motionMode === "rest" ||
    state.releaseTimeS === null ||
    timeS < state.releaseTimeS
  ) {
    return 0;
  }

  const tau = timeS - state.releaseTimeS;
  const acceleration = deriveEffectiveAccelerationMps2(state);
  const speed0 =
    state.motionMode === "uniform"
      ? state.initialSpeedMps
      : state.initialSpeedMps;
  const displacement = speed0 * tau + 0.5 * acceleration * tau * tau;
  return clamp(displacement, 0, MAX_TAPE_M);
}

export function speedAtTimeS(state: TickerTimerState, timeS: number): number {
  if (
    state.motionMode === "rest" ||
    state.releaseTimeS === null ||
    timeS < state.releaseTimeS
  ) {
    return 0;
  }
  if (state.motionMode === "uniform") {
    return state.initialSpeedMps;
  }
  const tau = timeS - state.releaseTimeS;
  return Math.max(
    0,
    state.initialSpeedMps + deriveEffectiveAccelerationMps2(state) * tau,
  );
}

function shouldStampDot(quality: PrintQuality, index: number): boolean {
  if (quality === "missed") {
    return index % 3 !== 2;
  }
  return true;
}

function deriveLiveTapeDots(state: TickerTimerState): TapeDot[] {
  if (state.powerOnTimeS === null) {
    return [];
  }

  const periodS = derivePeriodS(state.frequencyHz);
  const quality = derivePrintQuality(state.kind, state.voltageV);
  const available = Math.max(0, state.elapsedTimeS - state.powerOnTimeS);
  const stampCount = Math.min(
    MAX_DOTS,
    Math.floor(available / periodS + 1e-9) + 1,
  );
  const dots: TapeDot[] = [];

  for (let index = 0; index < stampCount; index += 1) {
    if (!shouldStampDot(quality, index)) {
      continue;
    }
    const timeS = state.powerOnTimeS + index * periodS;
    dots.push({
      index,
      timeS,
      positionM: displacementAtTimeS(state, timeS),
      smeared: quality === "smeared",
    });
  }

  return dots;
}

export function deriveTapeDots(state: TickerTimerState): TapeDot[] {
  if (!state.powered) {
    return [...state.dotHistory];
  }
  return deriveLiveTapeDots(state);
}

function movingDots(dots: ReadonlyArray<TapeDot>): TapeDot[] {
  const firstMoving = dots.findIndex((dot) => dot.positionM > 1e-4);
  if (firstMoving <= 0) {
    return [...dots];
  }
  return dots.slice(firstMoving - 1);
}

export function deriveInstantaneousSpeedMps(
  dots: ReadonlyArray<TapeDot>,
  periodS: number,
): number | null {
  const series = deriveTapeSpeedSeries(dots, periodS);
  return series.length > 0 ? series[series.length - 1].speedMps : null;
}

function trimTerminalPlateau(dots: ReadonlyArray<TapeDot>): TapeDot[] {
  const usable = movingDots(dots);
  let lastChangingIndex = usable.length - 1;
  while (
    lastChangingIndex > 0 &&
    Math.abs(
      usable[lastChangingIndex].positionM -
        usable[lastChangingIndex - 1].positionM,
    ) < 1e-9
  ) {
    lastChangingIndex -= 1;
  }
  return usable.slice(0, lastChangingIndex + 1);
}

export function deriveTapeSpeedSeries(
  dots: ReadonlyArray<TapeDot>,
  periodS: number,
  timeOriginS = 0,
): TapeSpeedSample[] {
  const usable = trimTerminalPlateau(dots);
  if (usable.length < 3 || !(periodS > 0)) {
    return [];
  }

  const samples: TapeSpeedSample[] = [];
  for (let index = 1; index < usable.length - 1; index += 1) {
    const previous = usable[index - 1];
    const next = usable[index + 1];
    const dt = next.timeS - previous.timeS;
    if (dt > 0) {
      samples.push({
        timeS: Math.max(0, (previous.timeS + next.timeS) / 2 - timeOriginS),
        speedMps: Math.max(0, (next.positionM - previous.positionM) / dt),
      });
    }
  }
  return samples;
}

export function deriveMeasuredAccelerationMps2(
  dots: ReadonlyArray<TapeDot>,
  periodS: number,
): number | null {
  const usable = trimTerminalPlateau(dots);
  if (usable.length < 7 || !(periodS > 0)) {
    return null;
  }

  const intervals: number[] = [];
  for (let index = 1; index < usable.length; index += 1) {
    const elapsedBetweenDotsS = usable[index].timeS - usable[index - 1].timeS;
    if (Math.abs(elapsedBetweenDotsS - periodS) > Math.max(1e-9, periodS * 1e-6)) {
      return null;
    }
    intervals.push(usable[index].positionM - usable[index - 1].positionM);
  }
  if (intervals.length < 6) {
    return null;
  }

  const firstThree = intervals[0] + intervals[1] + intervals[2];
  const nextThree = intervals[3] + intervals[4] + intervals[5];
  return (nextThree - firstThree) / (9 * periodS * periodS);
}

export function deriveTapeAnalysis(state: TickerTimerState): TapeAnalysis {
  const periodS = derivePeriodS(state.frequencyHz);
  const frictionForceN = deriveFrictionForceN(state.kind);
  const frictionAccelerationMps2 =
    frictionForceN / Math.max(0.05, state.massKg);
  const effectiveAccelerationMps2 = deriveEffectiveAccelerationMps2(state);
  const displacementM = displacementAtTimeS(state, state.elapsedTimeS);
  const speedMps = speedAtTimeS(state, state.elapsedTimeS);
  const dots = deriveTapeDots(state);
  const usableDots = trimTerminalPlateau(dots);
  const latestIntervalM =
    usableDots.length >= 2
      ? usableDots[usableDots.length - 1].positionM -
        usableDots[usableDots.length - 2].positionM
      : null;
  const printQuality = derivePrintQuality(state.kind, state.voltageV);
  const speedSeriesMps = deriveTapeSpeedSeries(dots, periodS, state.releaseTimeS ?? dots[0]?.timeS ?? 0);

  return {
    periodS,
    frictionForceN,
    frictionAccelerationMps2,
    effectiveAccelerationMps2,
    displacementM,
    speedMps,
    speedSeriesMps,
    dots,
    dotCount: dots.length,
    latestIntervalM,
    instantaneousSpeedMps: deriveInstantaneousSpeedMps(dots, periodS),
    measuredAccelerationMps2: deriveMeasuredAccelerationMps2(dots, periodS),
    printQuality,
    voltageLabel:
      state.kind === "spark" ? "220 V AC" : `${state.voltageV.toFixed(1)} V AC`,
  };
}

export function createTickerTimerState(
  overrides: Partial<TickerTimerState> = {},
): TickerTimerState {
  return {
    ...DEFAULT_CONFIG,
    powered: false,
    released: false,
    finished: false,
    elapsedTimeS: 0,
    powerOnTimeS: null,
    releaseTimeS: null,
    dotHistory: [],
    ...overrides,
  };
}

export function resetTickerTimerState(
  previous?: Partial<TickerTimerConfig>,
): TickerTimerState {
  return createTickerTimerState({
    kind: previous?.kind ?? DEFAULT_CONFIG.kind,
    motionMode: previous?.motionMode ?? DEFAULT_CONFIG.motionMode,
    frequencyHz: previous?.frequencyHz ?? DEFAULT_CONFIG.frequencyHz,
    voltageV: previous?.voltageV ?? DEFAULT_CONFIG.voltageV,
    initialSpeedMps:
      previous?.initialSpeedMps ?? DEFAULT_CONFIG.initialSpeedMps,
    driveAccelerationMps2:
      previous?.driveAccelerationMps2 ?? DEFAULT_CONFIG.driveAccelerationMps2,
    massKg: previous?.massKg ?? DEFAULT_CONFIG.massKg,
  });
}

export function stepTickerTimerState(
  state: TickerTimerState,
  dt: number,
): TickerTimerState {
  if (!state.powered || state.finished || dt <= 0) {
    return state;
  }

  const elapsedTimeS = state.elapsedTimeS + dt;
  const displacementM = displacementAtTimeS(
    { ...state, elapsedTimeS },
    elapsedTimeS,
  );
  const periodS = derivePeriodS(state.frequencyHz);
  const pulseLimitReached =
    state.powerOnTimeS !== null &&
    elapsedTimeS - state.powerOnTimeS >= (MAX_DOTS - 1) * periodS - 1e-9;
  const tapeEndReached =
    state.released && displacementM >= MAX_TAPE_M - 1e-6;
  const finished = pulseLimitReached || tapeEndReached;

  return {
    ...state,
    elapsedTimeS,
    finished,
  };
}

export function togglePowered(state: TickerTimerState): TickerTimerState {
  if (!state.powered && state.finished) {
    return state;
  }
  if (state.powered) {
    return {
      ...state,
      powered: false,
      dotHistory: deriveLiveTapeDots(state),
    };
  }
  return {
    ...state,
    powered: true,
    powerOnTimeS: state.powerOnTimeS ?? state.elapsedTimeS,
  };
}

export function releaseTape(state: TickerTimerState): TickerTimerState {
  if (!state.powered || state.released || state.finished) {
    return state;
  }
  return {
    ...state,
    released: true,
    releaseTimeS: state.releaseTimeS ?? state.elapsedTimeS,
  };
}

export function formatPeriodLabel(periodS: number): string {
  return `${periodS.toFixed(3)} s`;
}

export function formatFrequencyLabel(frequencyHz: number): string {
  return `${frequencyHz.toFixed(0)} Hz`;
}

export function formatDisplacementLabel(displacementM: number): string {
  return `${(displacementM * 100).toFixed(2)} cm`;
}

export function formatSpeedLabel(speedMps: number | null): string {
  if (speedMps === null) {
    return "—";
  }
  return `${speedMps.toFixed(3)} m/s`;
}

export function formatAccelerationLabel(
  accelerationMps2: number | null,
): string {
  if (accelerationMps2 === null) {
    return "—";
  }
  return `${accelerationMps2.toFixed(2)} m/s²`;
}

export function formatForceLabel(forceN: number): string {
  return `${(forceN * 1000).toFixed(1)} mN`;
}

export function formatQualityLabel(quality: PrintQuality): string {
  if (quality === "missed") {
    return "漏点（电压偏低）";
  }
  if (quality === "smeared") {
    return "拖尾（针过长/电压偏高）";
  }
  return "点迹清晰";
}

export function punchPhase01(
  elapsedTimeS: number,
  frequencyHz: number,
): number {
  const periodS = derivePeriodS(frequencyHz);
  if (!(periodS > 0)) {
    return 0;
  }
  const wrapped = elapsedTimeS / periodS;
  return wrapped - Math.floor(wrapped);
}
