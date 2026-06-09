import { gpCode } from '../data/gpCodes'
import type {
  DraftPick,
  DriverPriority,
  DriverRaceCell,
  DriverSeasonStanding,
  RaceResult,
  ResultTier,
  SeasonPack,
  SeasonResult,
  SimulationGrid,
} from '../types/game'
import { getEraRules, pointsForPosition } from './eraRules'
import {
  computeCarRating,
  computeDevBudgetGrowth,
  computeDriverStrengths,
  computeEngineerEffects,
  computeEngineerRating,
  computeSupportRating,
  computeSupportVarianceModifier,
  computeTeamRatings,
  computeTeamStrength,
} from './ratings'
import {
  type GridDriver,
  simulateRaceClassification,
  teamPointsFromClassification,
} from './raceGrid'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function determineTier(wccPosition: number, wdcPosition: number): ResultTier {
  if (wccPosition === 1 && wdcPosition === 1) return 'double-champion'
  if (wccPosition === 1) return 'constructors-champion'
  if (wccPosition <= 3) return 'podium-team'
  if (wccPosition <= 10) return 'points-finisher'
  return 'backmarker'
}

function updateFormBoost(
  formBoost: { d1: number; d2: number },
  d1Pos: number | 'DNF',
  d2Pos: number | 'DNF',
  gridSize: number,
): { d1: number; d2: number } {
  const score = (pos: number | 'DNF') =>
    pos === 'DNF' ? 0 : Math.max(0, gridSize - pos + 1)

  return {
    d1: formBoost.d1 * 0.84 + score(d1Pos) * 0.14,
    d2: formBoost.d2 * 0.84 + score(d2Pos) * 0.14,
  }
}

function toRaceFinish(pos: number | 'DNF' | undefined): DriverRaceCell['position'] {
  if (pos === undefined || pos === 'DNF') return 'Ret'
  return pos
}

function buildGridDrivers(
  grid: SimulationGrid,
  picks: DraftPick[],
  driverPriority: DriverPriority,
  carRating: number,
  seasonCarBonus: number,
  formBoost: { d1: number; d2: number },
): GridDriver[] {
  const strengths = computeDriverStrengths(
    picks,
    driverPriority,
    carRating,
    seasonCarBonus,
    formBoost,
  )
  const playerTeamStrength = computeTeamStrength(picks)

  const drivers: GridDriver[] = [
    {
      id: 'd1',
      name: picks.find((p) => p.slot === 'driver1')?.option.name ?? 'Driver 1',
      teamId: 'player',
      teamName: 'Dream Team',
      strength: strengths.d1,
      isPlayer: true,
    },
    {
      id: 'd2',
      name: picks.find((p) => p.slot === 'driver2')?.option.name ?? 'Driver 2',
      teamId: 'player',
      teamName: 'Dream Team',
      strength: strengths.d2,
      isPlayer: true,
    },
  ]

  for (const team of grid.teams) {
    const factors = [1, 0.93]
    team.drivers.forEach((driver, index) => {
      drivers.push({
        id: driver.id,
        name: driver.name,
        teamId: team.id,
        teamName: team.name,
        strength: team.strength * factors[index],
        isPlayer: false,
      })
    })
  }

  void playerTeamStrength
  return drivers
}

export function simulateSeason(
  grid: SimulationGrid,
  picks: DraftPick[],
  seed: number = Math.floor(Math.random() * 1_000_000),
  driverPriority: DriverPriority = 'equal',
): SeasonResult {
  const rand = seededRandom(seed)
  const rules = getEraRules(grid.year)
  const teamRatings = computeTeamRatings(picks)
  const baseTeamStrength = computeTeamStrength(picks)
  const carRating = computeCarRating(picks)
  const supportRating = computeSupportRating(picks)
  const engineerRating = computeEngineerRating(picks)
  const engineerEffects = computeEngineerEffects(engineerRating)
  const varianceMod = computeSupportVarianceModifier(supportRating)
  const devGrowth = computeDevBudgetGrowth(picks)

  const carReliability = carRating / 100
  const dnfChance = Math.min(
    0.22,
    engineerEffects.dnfChance + Math.max(0, 0.06 - carReliability * 0.05),
  )

  const raceCount = grid.raceCount
  const gridSize = grid.teams.length + 1

  const teamPoints: Record<string, number> = { player: 0 }
  for (const team of grid.teams) {
    teamPoints[team.id] = 0
  }

  const driverPoints: Record<string, number> = {}
  const driverPoles: Record<string, number> = {}
  const driverRaceLog: Record<string, DriverRaceCell[]> = {}

  const allDriverMeta: { id: string; name: string; teamName: string; teamId: string; isPlayer: boolean }[] =
    []

  let playerPoints = 0
  let d1Points = 0
  let d2Points = 0
  let wins = 0
  let podiums = 0
  let poles = 0
  const raceResults: RaceResult[] = []
  let formBoost = { d1: 0, d2: 0 }

  for (let round = 0; round < raceCount; round++) {
    const gp = grid.calendar[round] ?? `Round ${round + 1}`
    const seasonProgress = raceCount > 1 ? round / (raceCount - 1) : 0
    const seasonCarBonus = devGrowth * seasonProgress

    const gridDrivers = buildGridDrivers(
      grid,
      picks,
      driverPriority,
      carRating,
      seasonCarBonus,
      formBoost,
    )

    if (round === 0) {
      for (const d of gridDrivers) {
        allDriverMeta.push({
          id: d.id,
          name: d.name,
          teamName: d.teamName,
          teamId: d.teamId,
          isPlayer: d.isPlayer,
        })
        driverRaceLog[d.id] = []
        driverPoints[d.id] = 0
        driverPoles[d.id] = 0
      }
    }

    const classification = simulateRaceClassification(
      gridDrivers,
      rand,
      varianceMod,
      dnfChance,
    )

    const d1Pos = classification.positions.get('d1') ?? 'DNF'
    const d2Pos = classification.positions.get('d2') ?? 'DNF'

    formBoost = updateFormBoost(formBoost, d1Pos, d2Pos, gridSize)

    const d1Pts =
      d1Pos === 'DNF' || d1Pos > rules.racePoints.length
        ? 0
        : (rules.racePoints[d1Pos - 1] ?? 0)
    const d2Pts =
      d2Pos === 'DNF' || d2Pos > rules.racePoints.length
        ? 0
        : (rules.racePoints[d2Pos - 1] ?? 0)

    const teamPts = teamPointsFromClassification(['d1', 'd2'], classification.positions, rules)
    playerPoints += teamPts
    d1Points += d1Pts
    d2Points += d2Pts
    teamPoints.player = (teamPoints.player ?? 0) + teamPts

    const positions = [d1Pos, d2Pos].filter((p) => p !== 'DNF') as number[]
    if (positions.some((p) => p === 1)) wins++
    if (positions.some((p) => p <= 3)) podiums++

    if (classification.poleDriverId === 'd1' || classification.poleDriverId === 'd2') {
      poles++
    }

    raceResults.push({
      round: round + 1,
      grandPrix: gp,
      grandPrixCode: gpCode(gp),
      driver1Position: d1Pos,
      driver2Position: d2Pos,
      driver1Points: d1Pts,
      driver2Points: d2Pts,
      teamPoints: teamPts,
    })

    for (const d of gridDrivers) {
      const pos = classification.positions.get(d.id)
      const finish = toRaceFinish(pos)
      const pts =
        pos !== undefined && pos !== 'DNF' && pos <= rules.racePoints.length
          ? pointsForPosition(pos, rules)
          : 0

      driverPoints[d.id] = (driverPoints[d.id] ?? 0) + pts
      if (classification.poleDriverId === d.id) {
        driverPoles[d.id] = (driverPoles[d.id] ?? 0) + 1
      }

      driverRaceLog[d.id].push({
        position: finish,
        pole: classification.poleDriverId === d.id,
        fastestLap: classification.fastestLapDriverId === d.id,
      })
    }

    for (const team of grid.teams) {
      const teamDriverIds = team.drivers.map((d) => d.id)
      const pts = teamPointsFromClassification(teamDriverIds, classification.positions, rules)
      teamPoints[team.id] = (teamPoints[team.id] ?? 0) + pts
    }
  }

  const allTeams = [
    { id: 'player', points: playerPoints },
    ...grid.teams.map((t) => ({ id: t.id, points: teamPoints[t.id] ?? 0 })),
  ].sort((a, b) => b.points - a.points)

  const wccPosition = allTeams.findIndex((t) => t.id === 'player') + 1

  const standings: DriverSeasonStanding[] = allDriverMeta
    .map((d) => ({
      id: d.id,
      name: d.name,
      teamName: d.teamName,
      isPlayer: d.isPlayer,
      races: driverRaceLog[d.id] ?? [],
      totalPoints: driverPoints[d.id] ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const wdcPosition = standings.findIndex((d) => d.id === 'd1') + 1
  const driver2WdcPosition = standings.findIndex((d) => d.id === 'd2') + 1

  const reliability = carReliability * (engineerRating / 100)

  return {
    tier: determineTier(wccPosition, wdcPosition),
    wccPosition,
    wdcPosition,
    driver2WdcPosition,
    totalPoints: playerPoints,
    wins,
    podiums,
    poles: Math.max(poles, Math.round(wins * 0.6 * reliability)),
    raceResults,
    standings,
    calendar: grid.calendar,
    teamStrength: baseTeamStrength,
    teamRatings,
    constructorName: 'Dream Team',
    year: grid.year,
  }
}

/** Build simulation grid from a season pack (opponents + calendar). */
export function seasonPackToSimulationGrid(pack: SeasonPack): SimulationGrid {
  return {
    year: pack.year,
    raceCount: pack.raceCount,
    calendar: pack.calendar,
    teams: pack.opponents.map((opp) => ({
      id: opp.id,
      name: opp.name,
      strength: opp.strength,
      drivers: [
        { id: `${opp.id}-d1`, name: `${opp.name} #1` },
        { id: `${opp.id}-d2`, name: `${opp.name} #2` },
      ],
    })),
  }
}

export const TIER_LABELS: Record<ResultTier, string> = {
  'double-champion': 'Double Champion',
  'constructors-champion': 'Constructors Champion',
  'podium-team': 'Podium Team',
  'points-finisher': 'Points Finisher',
  backmarker: 'Backmarker',
}

export const TIER_DESCRIPTIONS: Record<ResultTier, string> = {
  'double-champion': 'WCC and WDC — the ultimate season.',
  'constructors-champion': 'You won the Constructors\' Championship.',
  'podium-team': 'A front-running season, just short of the title.',
  'points-finisher': 'Respectable points, but no silverware.',
  backmarker: 'A tough season at the back of the grid.',
}
