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

function isOneTwoFinish(d1: number | 'DNF', d2: number | 'DNF'): boolean {
  if (d1 === 'DNF' || d2 === 'DNF') return false
  const sorted = [d1, d2].sort((a, b) => a - b)
  return sorted[0] === 1 && sorted[1] === 2
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
  const totalDomination =
    raceCount > 0 &&
    result.raceResults.every((r) => isOneTwoFinish(r.driver1Position, r.driver2Position))
  const bestWdcPosition = Math.min(result.wdcPosition, result.driver2WdcPosition)
  const wdcWinner =
    result.wdcPosition === 1
      ? result.standings.find((d) => d.id === 'd1')
      : result.driver2WdcPosition === 1
        ? result.standings.find((d) => d.id === 'd2')
        : null
  const wdcWon = bestWdcPosition === 1
  const wccWon = result.wccPosition === 1
  const doubleChampion = wdcWon && wccWon
  const noRespins = result.respinsUsed === 0
  const pureWcc = wccWon && noRespins
  const pureWdc = wdcWon && noRespins

  return [
    {
      id: 'wdc',
      label: 'World Drivers\' Champion',
      shortLabel: 'WDC',
      achieved: wdcWon,
      detail: wdcWon
        ? `${wdcWinner?.name ?? 'Your driver'} won the title`
        : `Best driver finish P${bestWdcPosition}`,
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
            ? `Won WCC but best driver finish was P${bestWdcPosition} in WDC`
            : `P${bestWdcPosition} WDC, P${result.wccPosition} WCC`,
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
    {
      id: 'total-domination',
      label: 'Total Domination',
      shortLabel: 'Total Domination',
      achieved: totalDomination,
      detail: totalDomination
        ? 'Locked out the front row every race — 1-2 all season'
        : 'Did not finish 1-2 in every race',
    },
    {
      id: 'wcc-no-respins',
      label: 'Pure Constructors Champion',
      shortLabel: 'Pure WCC',
      achieved: pureWcc,
      detail: pureWcc
        ? 'Won the constructors\' title without using a single respin'
        : wccWon
          ? `Won WCC but used ${result.respinsUsed} respin${result.respinsUsed === 1 ? '' : 's'}`
          : noRespins
            ? 'No respins used, but did not win the constructors\' title'
            : `Used ${result.respinsUsed} respin${result.respinsUsed === 1 ? '' : 's'} during the draft`,
    },
    {
      id: 'wdc-no-respins',
      label: 'Pure Drivers\' Champion',
      shortLabel: 'Pure WDC',
      achieved: pureWdc,
      detail: pureWdc
        ? `${wdcWinner?.name ?? 'Your driver'} won the title without a single respin`
        : wdcWon
          ? `Won WDC but used ${result.respinsUsed} respin${result.respinsUsed === 1 ? '' : 's'}`
          : noRespins
            ? 'No respins used, but did not win the drivers\' title'
            : `Used ${result.respinsUsed} respin${result.respinsUsed === 1 ? '' : 's'} during the draft`,
    },
  ]
}
