import type { DraftPick, DriverPriority, TeamRatings } from '../types/game'

function pickRating(picks: DraftPick[], slot: DraftPick['slot']): number | null {
  return picks.find((p) => p.slot === slot)?.option.rating ?? null
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function computeDriverLineupRating(picks: DraftPick[]): number {
  const d1 = pickRating(picks, 'driver1')
  const d2 = pickRating(picks, 'driver2')
  const values = [d1, d2].filter((v): v is number => v !== null)
  if (values.length === 0) return 0
  if (values.length === 1) return Math.round(values[0])
  return Math.round(avg(values) * 0.55 + Math.max(...values) * 0.45)
}

export function computeCarRating(picks: DraftPick[]): number {
  const chassis = pickRating(picks, 'chassis')
  const engine = pickRating(picks, 'engine')
  const values = [chassis, engine].filter((v): v is number => v !== null)
  if (values.length === 0) return 0
  if (values.length === 1) return Math.round(values[0])
  return Math.round(avg(values))
}

export function computeSupportRating(picks: DraftPick[]): number {
  const tp = pickRating(picks, 'teamPrincipal')
  const reserve = pickRating(picks, 'reserveDriver')
  const values: number[] = []
  if (tp !== null) values.push(tp * 0.6)
  if (reserve !== null) values.push(reserve * 0.4)
  if (values.length === 0) return 0
  if (tp !== null && reserve !== null) {
    return Math.round(tp * 0.6 + reserve * 0.4)
  }
  return Math.round(values.reduce((a, b) => a + b, 0))
}

export function computeEngineerRating(picks: DraftPick[]): number {
  return pickRating(picks, 'engineerCrew') ?? 50
}

export function computeTeamRatings(picks: DraftPick[]): TeamRatings {
  return {
    driverLineup: computeDriverLineupRating(picks),
    car: computeCarRating(picks),
    support: computeSupportRating(picks),
  }
}

/** How much driver skill converts to pace — bad machinery sharply limits even legends. */
export function driverExtractionFactor(carRating: number): number {
  if (carRating <= 0) return 0.18
  return Math.max(0.18, Math.min(1, (carRating / 100) ** 1.55))
}

/** Bonus when both driver and car are strong — does not help weak-car outliers. */
export function packageSynergy(driverRating: number, carRating: number): number {
  if (Math.min(driverRating, carRating) < 78) return 0
  const integration = Math.min(driverRating, carRating) / 100
  return Math.max(0, (integration - 0.76) * 50)
}

/** Car sets the baseline; driver skill only extracts a slice on top (F1 is car-first). */
export function computeDriverRacePace(driverRating: number, carRating: number): number {
  const car = Math.max(0, carRating)
  const extraction = driverExtractionFactor(car)
  const base = car * 0.7 + driverRating * 0.3 * extraction
  return base + packageSynergy(driverRating, car)
}

/** Legacy helper — effective driver rating multiplier at reference talent 80. */
export function carPerformanceMultiplier(carRating: number): number {
  if (carRating <= 0) return 0.4
  return computeDriverRacePace(80, carRating) / 80
}

export function computeDevBudgetGrowth(picks: DraftPick[]): number {
  const budget = pickRating(picks, 'devBudget') ?? 50
  return (budget - 50) * 0.22
}

export function computeSupportVarianceModifier(supportRating: number): number {
  if (supportRating <= 0) return 1.15
  // Keep a healthy luck floor so close driver battles stay unpredictable.
  return Math.max(0.62, 1.15 - (supportRating / 100) * 0.5)
}

export interface EngineerEffects {
  dnfChance: number
  pitstopRisk: number
  pitstopPenalty: number
}

export function computeEngineerEffects(engineerRating: number): EngineerEffects {
  const norm = engineerRating / 100
  return {
    dnfChance: Math.max(0.02, 0.14 - norm * 0.11),
    pitstopRisk: Math.max(0.03, 0.16 - norm * 0.12),
    pitstopPenalty: Math.round(Math.max(1, 7 - norm * 5)),
  }
}

export function computeDriverStrengths(
  picks: DraftPick[],
  priority: DriverPriority,
  carRating: number,
  seasonCarBonus: number,
  formBoost: { d1: number; d2: number },
): { d1: number; d2: number } {
  const d1Rating = pickRating(picks, 'driver1') ?? 50
  const d2Rating = pickRating(picks, 'driver2') ?? 50
  const effectiveCar = Math.min(99, carRating + seasonCarBonus)

  let d1 = computeDriverRacePace(d1Rating, effectiveCar)
  let d2 = computeDriverRacePace(d2Rating, effectiveCar)

  if (priority === 'priority-d1') {
    d1 *= 1.06
    d2 *= 0.95
  } else if (priority === 'best-form') {
    const totalForm = formBoost.d1 + formBoost.d2 + 0.01
    d1 *= 1 + (formBoost.d1 / totalForm) * 0.04
    d2 *= 1 + (formBoost.d2 / totalForm) * 0.04
  }

  return {
    d1: d1 + formBoost.d1 * 0.1,
    d2: d2 + formBoost.d2 * 0.1,
  }
}

/** Legacy aggregate — used for results summary only */
export function computeTeamStrength(picks: DraftPick[]): number {
  const ratings = computeTeamRatings(picks)
  const engineer = computeEngineerRating(picks)
  const budget = pickRating(picks, 'devBudget') ?? 0
  if (ratings.driverLineup === 0 && ratings.car === 0) return 0
  return Math.round(
    ratings.driverLineup * 0.38 +
      ratings.car * 0.35 +
      ratings.support * 0.12 +
      engineer * 0.1 +
      budget * 0.05,
  )
}
