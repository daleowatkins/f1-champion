import type { DriverSeasonStanding } from '../types/game'

export function championshipPosition(
  driverId: string,
  standings: DriverSeasonStanding[],
): number {
  const ranked = [...standings].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return a.id.localeCompare(b.id)
  })
  const index = ranked.findIndex((d) => d.id === driverId)
  return index >= 0 ? index + 1 : 0
}
