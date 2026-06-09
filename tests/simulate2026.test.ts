import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { computeDriverRacePace } from '../src/engine/ratings'
import { rankedStandings } from '../src/engine/standingsRank'
import { simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, SeasonPack, SimulationGrid } from '../src/types/game'

function loadGrid(): SimulationGrid {
  const filePath = path.join(process.cwd(), 'src/data/grid-2026.json')
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function loadPack(constructorId: string): SeasonPack {
  const filePath = path.join(
    process.cwd(),
    `public/data/seasons/2025/${constructorId}.json`,
  )
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function withSource(pack: SeasonPack, slot: DraftPick['slot'], option: DraftPick['option']): DraftPick {
  return {
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
    historicalWccPosition: pack.historicalWccPosition,
  }
}

function fullPicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  return [
    withSource(pack, 'driver1', pool.drivers[0]),
    withSource(pack, 'driver2', pool.drivers[1] ?? pool.drivers[0]),
    withSource(pack, 'chassis', pool.chassis[0]),
    withSource(pack, 'engine', pool.engines[0]),
    withSource(pack, 'teamPrincipal', pool.teamPrincipals[0]),
    withSource(pack, 'engineerCrew', pool.pitTeams[0]),
    withSource(pack, 'devBudget', pool.devBudgets[0]),
    withSource(pack, 'reserveDriver', pool.reserves[0]),
  ]
}

describe('simulateSeason 2026 grid', () => {
  const grid = loadGrid()

  it('includes the full ten-team 2026 grid with McLaren and Audi', () => {
    expect(grid.teams).toHaveLength(10)
    expect(grid.teams.some((t) => t.id === 'mclaren')).toBe(true)
    expect(grid.teams.some((t) => t.id === 'audi')).toBe(true)
    expect(grid.teams.some((t) => t.id === 'kick-sauber')).toBe(false)
    expect(grid.teams.find((t) => t.id === 'mclaren')?.drivers).toHaveLength(2)
  })

  it('grid drivers use individual ratings with team car pace', () => {
    const mercedes = grid.teams.find((t) => t.id === 'mercedes')
    const redBull = grid.teams.find((t) => t.id === 'red-bull')
    expect(mercedes?.carRating).toBeGreaterThan(redBull?.carRating ?? 0)

    const antonelli = mercedes?.drivers.find((d) => d.id.includes('antonelli'))
    const max = redBull?.drivers.find((d) => d.id.includes('verstappen'))
    expect(antonelli?.rating).toBeGreaterThan(max?.rating ?? 0)
    expect(computeDriverRacePace(antonelli!.rating!, mercedes!.carRating!)).toBeGreaterThan(
      computeDriverRacePace(max!.rating!, redBull!.carRating!),
    )
  })

  it('mercedes ace leads the AI grid WDC more often than Verstappen', () => {
    const pack = loadPack('ferrari')
    let antonelliWins = 0
    let maxWins = 0
    const trials = 40

    for (let seed = 0; seed < trials; seed++) {
      const result = simulateSeason(grid, fullPicks(pack), seed * 97)
      const ai = rankedStandings(result.standings.filter((d) => !d.isPlayer))
      const champion = ai[0]
      if (champion?.id.includes('antonelli')) antonelliWins++
      if (champion?.id.includes('verstappen')) maxWins++
    }

    expect(antonelliWins).toBeGreaterThan(maxWins)
    expect(antonelliWins).toBeGreaterThan(trials * 0.35)
  })

  it('grid has unique driver ids per entry', () => {
    const ids = grid.teams.flatMap((t) => t.drivers.map((d) => d.id))
    expect(ids.length).toBe(new Set(ids).size)
  })

  it('simulates a full season without error', () => {
    const pack = loadPack('red-bull')
    const result = simulateSeason(grid, fullPicks(pack), 42)
    expect(result.raceResults).toHaveLength(grid.raceCount)
    expect(result.year).toBe(2026)
    expect(result.standings.length).toBeGreaterThan(0)
  })

  it('player drivers never share the same race position', () => {
    const pack = loadPack('ferrari')
    const result = simulateSeason(grid, fullPicks(pack), 99)
    for (const race of result.raceResults) {
      if (
        typeof race.driver1Position === 'number' &&
        typeof race.driver2Position === 'number'
      ) {
        expect(race.driver1Position).not.toBe(race.driver2Position)
      }
    }
  })
})
