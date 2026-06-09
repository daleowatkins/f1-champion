import type { EraRules } from '../types/game'

const POINTS_2010 = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const POINTS_2003 = [10, 8, 6, 5, 4, 3, 2, 1]
const POINTS_1991 = [10, 6, 4, 3, 2, 1]
const POINTS_CLASSIC = [9, 6, 4, 3, 2, 1]
const POINTS_EARLY = [8, 6, 4, 3, 2, 1]

export function getEraRules(year: number): EraRules {
  if (year >= 2022) {
    return {
      year,
      racePoints: POINTS_2010,
      sprintPoints: [8, 7, 6, 5, 4, 3, 2, 1],
      hasConstructorChampionship: true,
    }
  }
  if (year >= 2010) {
    return { year, racePoints: POINTS_2010, hasConstructorChampionship: true }
  }
  if (year >= 2003) {
    return { year, racePoints: POINTS_2003, hasConstructorChampionship: true }
  }
  if (year >= 1991) {
    return { year, racePoints: POINTS_1991, hasConstructorChampionship: true }
  }
  if (year >= 1961) {
    return {
      year,
      racePoints: POINTS_CLASSIC,
      hasConstructorChampionship: year >= 1958,
      bestRaceCountForWcc: year < 1991 ? 11 : undefined,
    }
  }
  return {
    year,
    racePoints: POINTS_EARLY,
    hasConstructorChampionship: year >= 1958,
    bestRaceCountForWcc: 5,
  }
}

export function pointsForPosition(position: number, rules: EraRules, isSprint = false): number {
  const table = isSprint && rules.sprintPoints ? rules.sprintPoints : rules.racePoints
  if (position < 1 || position > table.length) return 0
  return table[position - 1] ?? 0
}

export function constructorPointsFromRace(
  d1Pos: number | 'DNF',
  d2Pos: number | 'DNF',
  rules: EraRules,
): number {
  const positions: number[] = []
  if (d1Pos !== 'DNF') positions.push(d1Pos)
  if (d2Pos !== 'DNF') positions.push(d2Pos)
  if (positions.length === 0) return 0

  if (rules.bestRaceCountForWcc && rules.year < 1991) {
    const sorted = [...positions].sort((a, b) => a - b)
    const best = sorted.slice(0, rules.bestRaceCountForWcc)
    return best.reduce((sum, pos) => sum + pointsForPosition(pos, rules), 0)
  }

  return positions.reduce((sum, pos) => sum + pointsForPosition(pos, rules), 0)
}
