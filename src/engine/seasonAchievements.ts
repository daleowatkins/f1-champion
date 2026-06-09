import type { SeasonResult } from '../types/game'

export interface SeasonAchievement {
  id: string
  label: string
  shortLabel: string
  achieved: boolean
  detail: string
}

function isPodium(pos: number | 'DNF'): boolean {
  return typeof pos === 'number' && pos <= 3
}

export function computeSeasonAchievements(result: SeasonResult): SeasonAchievement[] {
  const raceCount = result.raceResults.length
  const podiumsEveryRace =
    raceCount > 0 &&
    result.raceResults.every(
      (r) => isPodium(r.driver1Position) || isPodium(r.driver2Position),
    )
  const noRetirements = result.raceResults.every(
    (r) => r.driver1Position !== 'DNF' && r.driver2Position !== 'DNF',
  )
  const winEveryRace = raceCount > 0 && result.wins === raceCount
  const wdcWon = result.wdcPosition === 1
  const wccWon = result.wccPosition === 1
  const doubleChampion = wdcWon && wccWon

  return [
    {
      id: 'wdc',
      label: 'World Drivers\' Champion',
      shortLabel: 'WDC',
      achieved: wdcWon,
      detail: wdcWon ? 'Driver 1 won the title' : `Driver 1 finished P${result.wdcPosition}`,
    },
    {
      id: 'wc',
      label: 'Double Champion',
      shortLabel: 'WC',
      achieved: doubleChampion,
      detail: doubleChampion
        ? 'Won both the drivers\' and constructors\' titles'
        : wdcWon
          ? `Won WDC but finished P${result.wccPosition} in WCC`
          : wccWon
            ? `Won WCC but Driver 1 finished P${result.wdcPosition} in WDC`
            : `P${result.wdcPosition} WDC, P${result.wccPosition} WCC`,
    },
    {
      id: 'podium-every-race',
      label: 'Podium Every Race',
      shortLabel: 'Podium Every Race',
      achieved: podiumsEveryRace,
      detail: podiumsEveryRace
        ? 'At least one driver on the podium every round'
        : 'Missed the podium in at least one race',
    },
    {
      id: 'no-retirements',
      label: 'No Retirements',
      shortLabel: 'No Retirements',
      achieved: noRetirements,
      detail: noRetirements
        ? 'Both drivers finished every race'
        : 'At least one retirement during the season',
    },
    {
      id: 'win-every-race',
      label: 'Win Every Race',
      shortLabel: 'Win Every Race',
      achieved: winEveryRace,
      detail: winEveryRace
        ? `Won all ${raceCount} races`
        : `${result.wins} of ${raceCount} race wins`,
    },
  ]
}
