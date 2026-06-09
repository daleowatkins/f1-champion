import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { computeDriverRacePace } from '../src/engine/ratings'
import { simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, DraftOption, SeasonPack, SimulationGrid } from '../src/types/game'

function loadGrid(): SimulationGrid {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/data/grid-2026.json'), 'utf-8'),
  )
}

function loadPack(): SeasonPack {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/data/seasons/2025/mclaren.json'), 'utf-8'),
  )
}

function pick(
  pack: SeasonPack,
  slot: DraftPick['slot'],
  option: DraftOption,
): DraftPick {
  return {
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
  }
}

describe('car vs driver balance', () => {
  const grid = loadGrid()
  const pack = loadPack()

  it('legend driver with mediocre car is slower than a top grid team', () => {
    const legendPace = computeDriverRacePace(94, 70)
    const redBullPace = 87
    expect(legendPace).toBeLessThan(redBullPace - 8)
  })

  it('legend driver with GOAT car matches elite grid pace', () => {
    const goatPace = computeDriverRacePace(94, 94)
    expect(goatPace).toBeGreaterThan(88)
  })

  it('legend driver with ok car does not dominate a season', () => {
    const pool = pack.draftPool
    const goatDriver: DraftOption = { id: 'goat', name: 'GOAT Driver', rating: 94 }
    const okChassis: DraftOption = { id: 'ok-chassis', name: 'Midfield Chassis', rating: 68 }
    const okEngine: DraftOption = { id: 'ok-engine', name: 'Midfield Engine', rating: 68 }
    const supportDriver =
      [...pool.drivers].sort((a, b) => a.rating - b.rating)[0] ?? pool.drivers[0]

    const picks: DraftPick[] = [
      pick(pack, 'driver1', goatDriver),
      pick(pack, 'driver2', supportDriver),
      pick(pack, 'chassis', okChassis),
      pick(pack, 'engine', okEngine),
      pick(pack, 'teamPrincipal', pool.teamPrincipals[0]),
      pick(pack, 'engineerCrew', pool.pitTeams[0]),
      pick(pack, 'devBudget', pool.devBudgets[0]),
      pick(pack, 'reserveDriver', pool.reserves[0]),
    ]

    let totalWins = 0
    const trials = 200
    for (let seed = 0; seed < trials; seed++) {
      const result = simulateSeason(grid, picks, 10_000 + seed)
      totalWins += result.wins
    }

    const avgWins = totalWins / trials
    expect(avgWins).toBeLessThan(8)
  })
})
