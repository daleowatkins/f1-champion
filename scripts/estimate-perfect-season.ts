/**
 * Monte Carlo estimate for "Win Every Race" achievement.
 * Run: npx tsx scripts/estimate-perfect-season.ts
 */
import fs from 'fs'
import path from 'path'
import { simulateSeason } from '../src/engine/simulateSeason'
import type { DraftPick, SeasonPack, SimulationGrid } from '../src/types/game'

function loadGrid(): SimulationGrid {
  return JSON.parse(fs.readFileSync(path.join('src/data/grid-2026.json'), 'utf-8'))
}

function loadPack(year: number, constructorId: string): SeasonPack {
  return JSON.parse(
    fs.readFileSync(path.join('public/data/seasons', String(year), `${constructorId}.json`), 'utf-8'),
  )
}

function elitePicks(pack: SeasonPack): DraftPick[] {
  const pool = pack.draftPool
  const best = <T extends { rating: number }>(arr: T[]) =>
    [...arr].sort((a, b) => b.rating - a.rating)[0]
  const drivers = [...pool.drivers].sort((a, b) => b.rating - a.rating)
  const withSource = (slot: DraftPick['slot'], option: DraftPick['option']): DraftPick => ({
    slot,
    option,
    sourceConstructorId: pack.constructorId,
    sourceConstructorName: pack.constructorName,
    sourceYear: pack.year,
  })
  return [
    withSource('driver1', drivers[0]),
    withSource('driver2', drivers[1] ?? drivers[0]),
    withSource('chassis', best(pool.chassis)),
    withSource('engine', best(pool.engines)),
    withSource('teamPrincipal', best(pool.teamPrincipals)),
    withSource('engineerCrew', best(pool.pitTeams)),
    withSource('devBudget', best(pool.devBudgets)),
    withSource('reserveDriver', pool.reserves[0]),
  ]
}

const grid = loadGrid()
const scenarios = [
  { label: '1988 McLaren draft (GOAT)', pack: loadPack(1988, 'mclaren') },
  { label: '2023 Red Bull draft (GOAT)', pack: loadPack(2023, 'red-bull') },
  { label: '2025 McLaren draft (typical WDC)', pack: loadPack(2025, 'mclaren') },
  { label: '2022 Williams draft (midfield)', pack: loadPack(2022, 'williams') },
]

const RUNS = 20_000

for (const { label, pack } of scenarios) {
  const picks = elitePicks(pack)
  let winEvery = 0
  let wdc = 0
  let wcc = 0
  let noDnf = 0
  let podiumEvery = 0

  for (let seed = 0; seed < RUNS; seed++) {
    const r = simulateSeason(grid, picks, seed)
    const races = r.raceResults.length
    if (r.wins === races) winEvery++
    if (r.wdcPosition === 1) wdc++
    if (r.wccPosition === 1) wcc++
    if (r.raceResults.every((x) => x.driver1Position !== 'DNF' && x.driver2Position !== 'DNF')) noDnf++
    if (
      r.raceResults.every(
        (x) =>
          (typeof x.driver1Position === 'number' && x.driver1Position <= 3) ||
          (typeof x.driver2Position === 'number' && x.driver2Position <= 3),
      )
    ) {
      podiumEvery++
    }
  }

  const pct = (n: number) => ((n / RUNS) * 100).toFixed(3)
  const runsPer = (n: number) => (n > 0 ? Math.round(RUNS / n) : Infinity)

  console.log(`\n${label} (${RUNS.toLocaleString()} sims, ${pack.raceCount} races)`)
  console.log(`  WCC:            ${pct(wcc)}% (~1 in ${runsPer(wcc)})`)
  console.log(`  WDC:            ${pct(wdc)}% (~1 in ${runsPer(wdc)})`)
  console.log(`  Podium every:   ${pct(podiumEvery)}% (~1 in ${runsPer(podiumEvery)})`)
  console.log(`  No retirements: ${pct(noDnf)}% (~1 in ${runsPer(noDnf)})`)
  console.log(`  Win every race: ${pct(winEvery)}% (~1 in ${runsPer(winEvery)})`)
}
