import type { EraRules } from '../types/game'
import { pointsForPosition } from './eraRules'

export interface GridDriver {
  id: string
  name: string
  teamId: string
  teamName: string
  strength: number
  isPlayer: boolean
}

export interface RaceClassification {
  positions: Map<string, number | 'DNF'>
  poleDriverId: string | null
  fastestLapDriverId: string | null
}

function samplePerformance(
  strength: number,
  rand: () => number,
  varianceMod: number,
  dnfChance: number,
): number | 'DNF' {
  if (rand() < dnfChance) return 'DNF'

  // Base pace noise — weekends vary, but car/driver gaps should still show over a season.
  const noise = (rand() - 0.5) * 26 * varianceMod
  const luck = (rand() - 0.5) * 12

  // Occasional standout or messy session (traffic, strategy, mistakes).
  let dayModifier = 0
  const dayRoll = rand()
  if (dayRoll < 0.08) dayModifier -= rand() * 8
  else if (dayRoll > 0.92) dayModifier += rand() * 8

  return strength + noise + luck + dayModifier
}

/** Simulate one race — every finisher gets a unique position. */
export function simulateRaceClassification(
  drivers: GridDriver[],
  rand: () => number,
  varianceMod: number,
  dnfChance: number,
): RaceClassification {
  const performances = drivers.map((d) => ({
    id: d.id,
    perf: samplePerformance(d.strength, rand, varianceMod, dnfChance),
  }))

  const finishers = performances
    .filter((p) => p.perf !== 'DNF')
    .sort((a, b) => (b.perf as number) - (a.perf as number))

  const positions = new Map<string, number | 'DNF'>()
  for (const p of performances) {
    if (p.perf === 'DNF') positions.set(p.id, 'DNF')
  }
  finishers.forEach((p, index) => positions.set(p.id, index + 1))

  const qualifying = [...drivers]
    .map((d) => ({
      id: d.id,
      q: samplePerformance(d.strength * 1.02, rand, varianceMod * 0.7, dnfChance * 0.35),
    }))
    .filter((q) => q.q !== 'DNF')
    .sort((a, b) => (b.q as number) - (a.q as number))

  const poleDriverId = qualifying[0]?.id ?? null

  const topFinishers = finishers.slice(0, Math.min(6, finishers.length))
  const fastestLapDriverId =
    topFinishers.length > 0
      ? topFinishers[Math.floor(rand() * topFinishers.length)].id
      : null

  return { positions, poleDriverId, fastestLapDriverId }
}

export function teamPointsFromClassification(
  teamDriverIds: string[],
  positions: Map<string, number | 'DNF'>,
  rules: EraRules,
): number {
  const teamPositions: number[] = []
  for (const id of teamDriverIds) {
    const pos = positions.get(id)
    if (pos !== undefined && pos !== 'DNF') teamPositions.push(pos)
  }
  if (teamPositions.length === 0) return 0

  if (rules.bestRaceCountForWcc && rules.year < 1991) {
    const sorted = [...teamPositions].sort((a, b) => a - b)
    const best = sorted.slice(0, rules.bestRaceCountForWcc)
    return best.reduce((sum, pos) => sum + pointsForPosition(pos, rules), 0)
  }

  return teamPositions.reduce((sum, pos) => sum + pointsForPosition(pos, rules), 0)
}
