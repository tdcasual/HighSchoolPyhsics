import { MAX_TAPE_M } from "./model";

/** Scene units per metre of measured paper travel. */
export const SCENE_SCALE = 4;
export const PUNCH_POINT_X = 0.8;
const TRAILING_TAPE_M = 0.5;

export const TAPE = {
  width: 0.38,
  thickness: 0.018,
  physicalLengthM: MAX_TAPE_M,
  trailingLengthM: TRAILING_TAPE_M,
  visibleLength: (MAX_TAPE_M + TRAILING_TAPE_M) * SCENE_SCALE,
  centerX:
    PUNCH_POINT_X + ((MAX_TAPE_M - TRAILING_TAPE_M) * SCENE_SCALE) / 2,
  y: 0.47,
};

export const EM_LAYOUT = {
  base: { size: [4.4, 0.22, 2.6] as const, position: [0, 0.11, 0] as const },
  fixBlock: {
    size: [0.35, 0.6, 0.8] as const,
    position: [-1.6, 0.25, -1.4] as const,
  },
  fixScrew: { position: [-1.6, 0.2, -1.7] as const },
  terminals: [
    { position: [-1.2, 0.43, -0.95] as const, polarity: "positive" as const },
    { position: [-0.5, 0.43, -0.95] as const, polarity: "negative" as const },
  ],
  coil: {
    position: [-0.85, 1, 0] as const,
    innerRadius: 0.2,
    outerRadius: 0.35,
    length: 0.72,
  },
  poleN: {
    position: [0.15, 1.25, 0] as const,
    size: [0.44, 0.2, 0.76] as const,
  },
  poleS: {
    position: [0.15, 0.73, 0] as const,
    size: [0.44, 0.2, 0.76] as const,
  },
  reed: { size: [2.4, 0.024, 0.22] as const, position: [-0.4, 1, 0] as const },
  needleLocal: { position: [1.2, -0.21, 0] as const, length: 0.46 },
  carbon: {
    position: [PUNCH_POINT_X + TAPE.width, TAPE.y + 0.0075, 0] as const,
    radius: TAPE.width,
  },
  carbonPin: {
    position: [PUNCH_POINT_X + TAPE.width, TAPE.y + 0.08, 0] as const,
  },
  guides: [
    { position: [PUNCH_POINT_X, 0.49, -0.95] as const },
    { position: [PUNCH_POINT_X, 0.49, 0.95] as const },
  ],
  pad: {
    size: [0.62, 0.035, 0.5] as const,
    position: [PUNCH_POINT_X, 0.44, 0] as const,
  },
} as const;

export const SPARK_LAYOUT = {
  box: { size: [1.6, 1.38, 2.6] as const, position: [-1.4, 0.81, 0] as const },
  /** Open cutaway frame keeps the tape, rotating powder disc, and needle visible. */
  head: { size: [2.2, 0.16, 2.5] as const, position: [1.05, 0.08, 0] as const },
  framePosts: [
    { position: [-0.05, 0.68, -1.18] as const, size: [0.12, 1.04, 0.12] as const },
    { position: [2.15, 0.68, -1.18] as const, size: [0.12, 1.04, 0.12] as const },
    { position: [-0.05, 0.68, 1.18] as const, size: [0.12, 1.04, 0.12] as const },
    { position: [2.15, 0.68, 1.18] as const, size: [0.12, 1.04, 0.12] as const },
  ],
  frameRails: [
    { position: [1.05, 1.2, -1.18] as const, size: [2.2, 0.1, 0.12] as const },
    { position: [1.05, 1.2, 1.18] as const, size: [2.2, 0.1, 0.12] as const },
    { position: [-0.05, 1.2, 0] as const, size: [0.12, 0.1, 2.5] as const },
    { position: [2.15, 1.2, 0] as const, size: [0.12, 0.1, 2.5] as const },
  ],
  disc: {
    position: [PUNCH_POINT_X + TAPE.width, TAPE.y + 0.02, 0] as const,
    radius: TAPE.width,
    rollingRadius: TAPE.width,
    thickness: 0.018,
  },
  discShaft: {
    position: [PUNCH_POINT_X + TAPE.width, 0.67, 0] as const,
  },
  pressBar: {
    position: [PUNCH_POINT_X + TAPE.width / 2, 0.78, 0] as const,
    size: [TAPE.width * 2, 0.08, 1.7] as const,
  },
  needle: { position: [PUNCH_POINT_X, 0.41, 0] as const },
  switch: { position: [-1.7, 1.64, -0.55] as const },
  lamp: { position: [-1.1, 1.62, -0.55] as const },
  sockets: [
    { position: [-0.49, 1.08, -0.67] as const, polarity: "negative" as const },
    { position: [-0.49, 1.08, 0.67] as const, polarity: "positive" as const },
  ],
  pcb: {
    position: [-1.45, 0.5, -0.25] as const,
    size: [0.7, 0.06, 0.95] as const,
  },
} as const;

export function tapeWorldX(
  dotPositionM: number,
  currentDisplacementM: number,
): number {
  return PUNCH_POINT_X + (currentDisplacementM - dotPositionM) * SCENE_SCALE;
}

export function sparkDiscRotationRad(displacementM: number): number {
  return displacementM / SPARK_LAYOUT.disc.rollingRadius;
}
