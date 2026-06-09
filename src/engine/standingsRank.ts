import type { DriverSeasonStanding } from '../types/game'

export function rankedStandings(standings: DriverSeasonStanding[]): DriverSeasonStanding[] {
  return [...standings].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return a.id.localeCompare(b.id)
  })
}

export function championshipPosition(
  driverId: string,
  standings: DriverSeasonStanding[],
): number {
  const index = rankedStandings(standings).findIndex((d) => d.id === driverId)
  return index >= 0 ? index + 1 : 0
}
