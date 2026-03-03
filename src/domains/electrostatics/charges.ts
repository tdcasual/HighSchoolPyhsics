import type { ElectrostaticCharge2D, ElectrostaticCharge3D } from './types'

const CHARGE_ID_PATTERN = /^C(\d+)$/

type ChargeIdCarrier = {
  id: string
}

type ChargeMagnitudeCarrier = {
  magnitude: number
}

export function nextChargeId(charges: ReadonlyArray<ChargeIdCarrier>): string {
  let maxIndex = 0
  for (const charge of charges) {
    const match = charge.id.match(CHARGE_ID_PATTERN)
    if (!match) {
      continue
    }
    maxIndex = Math.max(maxIndex, Number(match[1]))
  }
  return `C${maxIndex + 1}`
}

export function summarizeChargeMagnitudes(
  charges: ReadonlyArray<ChargeMagnitudeCarrier>,
): {
  positiveCount: number
  negativeCount: number
  netCharge: number
} {
  let positiveCount = 0
  let negativeCount = 0
  let netCharge = 0

  for (const charge of charges) {
    if (charge.magnitude > 0) {
      positiveCount += 1
    } else if (charge.magnitude < 0) {
      negativeCount += 1
    }
    netCharge += charge.magnitude
  }

  return { positiveCount, negativeCount, netCharge }
}

export function cloneCharges2D(charges: ReadonlyArray<ElectrostaticCharge2D>): ElectrostaticCharge2D[] {
  return charges.map((charge) => ({ ...charge }))
}

export function cloneCharges3D(charges: ReadonlyArray<ElectrostaticCharge3D>): ElectrostaticCharge3D[] {
  return charges.map((charge) => ({ ...charge }))
}
