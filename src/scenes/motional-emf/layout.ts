export type Vec3 = [number, number, number]

const leftX = -1.3
const rightX = 1.3
const rodY = -0.45
const rodZ = 0
const meterCenter: Vec3 = [0, 0.55, -4.2]
const meterBodySize: Vec3 = [3.1, 3.25, 0.72]
const meterTerminalSpread = 0.84
const meterTerminalY = meterCenter[1] - 1.42
const restLeftContact: Vec3 = [leftX, rodY, rodZ]
const restRightContact: Vec3 = [rightX, rodY, rodZ]
const terminalLeft: Vec3 = [meterCenter[0] - meterTerminalSpread, meterTerminalY, meterCenter[2]]
const terminalRight: Vec3 = [meterCenter[0] + meterTerminalSpread, meterTerminalY, meterCenter[2]]

export const MOTIONAL_EMF_LAYOUT = {
  motion: {
    travelDistance: 2.2,
  },
  rod: {
    center: [0, rodY, rodZ] as Vec3,
    size: [2.7, 0.18, 0.18] as Vec3,
    restLeftContact,
    restRightContact,
  },
  field: {
    center: [0, 0.2, 0] as Vec3,
    size: [4.2, 2.4, 4.8] as Vec3,
    lineXs: [-1.6, 0, 1.6] as number[],
    lineZs: [-2, -1.2, -0.4, 0.4, 1.2, 2] as number[],
    lineLengthY: 3.3,
    lineRadius: 0.022,
    arrowHeadRadius: 0.12,
    arrowHeadLength: 0.42,
  },
  meter: {
    center: meterCenter,
    rotationY: 0,
    bodySize: meterBodySize,
    faceRadius: 1.18,
    bezelInnerRadius: 1.2,
    bezelOuterRadius: 1.42,
    tickRadius: 0.98,
    needlePivot: [0, -0.56, meterBodySize[2] / 2 + 0.06] as Vec3,
    needleLength: 1.16,
    terminalLength: 0.3,
    terminalLeft,
    terminalRight,
  },
  wires: {
    aLeadStart: restLeftContact,
    bLeadStart: restRightContact,
    aLeadEnd: terminalLeft,
    bLeadEnd: terminalRight,
  },
  vectors: {
    arrowLength: 1.8,
  },
} as const
