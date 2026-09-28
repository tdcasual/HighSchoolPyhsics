type Vec3 = [number, number, number]

const flow = {
  direction: [1, 0, 0] as Vec3,
  lanes: [-0.3, 0, 0.3],
  startX: -1.15,
  spanX: 2.3,
  y: 0,
}
const magneticField = {
  direction: [0, 0, 1] as Vec3,
  xGuides: [-0.72, -0.28, 0.28, 0.72],
  zStart: -0.48,
  zEnd: 0.48,
}
const loadX = 2.4
const loadZ = 0.6
const electrodeHalfLengthX = 0.95
const electrodeThickness = 0.08
const sceneUnitsPerMeter = 1.55

export function deriveMhdLayout(electrodeGapM: number) {
  const safeGapM = Number.isFinite(electrodeGapM)
    ? Math.min(1, Math.max(0.1, electrodeGapM))
    : 0.4
  const clearGapScene = safeGapM * sceneUnitsPerMeter
  const halfGapScene = clearGapScene / 2
  const fieldLineInset = Math.min(0.06, halfGapScene * 0.18)
  const electrodeCenterY = halfGapScene + electrodeThickness / 2
  const topCenter: Vec3 = [0, electrodeCenterY, 0]
  const bottomCenter: Vec3 = [0, -electrodeCenterY, 0]
  const topContact: Vec3 = [electrodeHalfLengthX, electrodeCenterY, 0.5]
  const bottomContact: Vec3 = [electrodeHalfLengthX, -electrodeCenterY, 0.5]
  const wireHeight = Math.max(0.76, electrodeCenterY + 0.35)
  const loadBodyPosition: Vec3 = [loadX, 0, loadZ]
  const loadTopLead: Vec3 = [loadX, 0.22, loadZ]
  const loadBottomLead: Vec3 = [loadX, -0.22, loadZ]

  return {
    flow,
    magneticField: {
      ...magneticField,
      yStart: -halfGapScene + fieldLineInset,
      yEnd: halfGapScene - fieldLineInset,
    },
    magnets: {
      northPosition: [0, 0, -1.35] as Vec3,
      southPosition: [0, 0, 1.35] as Vec3,
      size: [1.7, Math.max(0.95, clearGapScene + 0.3), 0.9] as Vec3,
    },
    electrodes: {
      axis: [0, 1, 0] as Vec3,
      size: [1.9, electrodeThickness, 1.02] as Vec3,
      topCenter,
      bottomCenter,
      topRotationY: 0,
      bottomRotationY: 0,
      topContact,
      bottomContact,
    },
    channel: {
      center: [0, 0, 0] as Vec3,
      size: [2.45, clearGapScene, 1.12] as Vec3,
    },
    load: {
      bodyPosition: loadBodyPosition,
      bodySize: [0.14, 0.42, 0.18] as Vec3,
      topLead: loadTopLead,
      bottomLead: loadBottomLead,
    },
    wires: {
      top: [topContact, [1.55, wireHeight, 0.68], [loadX, wireHeight, loadZ], loadTopLead] as Vec3[],
      bottom: [bottomContact, [1.55, -wireHeight, 0.68], [loadX, -wireHeight, loadZ], loadBottomLead] as Vec3[],
    },
  }
}

export const MHD_LAYOUT = deriveMhdLayout(0.4)
