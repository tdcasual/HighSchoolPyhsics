/** Scene units follow the audited classroom model. The punch point is near x=0.8. */

/** Scene units per metre of tape. Keep this as the single display scale. */
export const SCENE_SCALE = 8;

export const TABLE = {
  size: [16, 0.08, 14] as const,
  position: [0, -0.1, 0] as const,
};

export const TAPE = {
  width: 0.38,
  thickness: 0.018,
  physicalLengthM: 1.2,
  visibleLength: 11,
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
  carbon: { position: [1.3, 0.4775, 0] as const, radius: 0.72 },
  carbonPin: { position: [1.3, 0.55, 0] as const },
  guides: [
    { position: [0.8, 0.49, -0.95] as const },
    { position: [0.8, 0.49, 0.95] as const },
  ],
  pressFrame: { position: [0.8, 0.57, 0] as const, outer: 0.6, inner: 0.5 },
  pad: { size: [0.62, 0.035, 0.5] as const, position: [0.8, 0.44, 0] as const },
} as const;

export const SPARK_LAYOUT = {
  box: { size: [1.6, 1.38, 2.6] as const, position: [-1.4, 0.81, 0] as const },
  head: { size: [2.2, 0.66, 2.5] as const, position: [1.05, 0.39, 0] as const },
  disc: { position: [0.8, 0.58, 0] as const, radius: 0.68, thickness: 0.018 },
  discShaft: { position: [0.8, 0.62, 0] as const },
  pressBar: {
    position: [0.8, 0.78, 0] as const,
    size: [0.16, 0.08, 1.7] as const,
  },
  needle: { position: [0.8, 0.41, 0] as const },
  switch: { position: [-1.7, 1.64, -0.55] as const },
  lamp: { position: [-1.1, 1.62, -0.55] as const },
  sockets: [
    { position: [-0.49, 1.08, -0.67] as const, polarity: "negative" as const },
    { position: [-0.49, 1.08, 0.67] as const, polarity: "positive" as const },
  ],
  transformer: { position: [-1.35, 0.72, 0.35] as const },
  pcb: {
    position: [-1.45, 0.5, -0.25] as const,
    size: [0.7, 0.06, 0.95] as const,
  },
} as const;

export const CART = {
  size: [0.22, 0.08, 0.42] as const,
  y: 0.48,
};

export function tapeWorldX(
  dotPositionM: number,
  currentDisplacementM: number,
): number {
  return (currentDisplacementM - dotPositionM) * SCENE_SCALE;
}
