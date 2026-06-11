import type { SeasonPack, SimulationGrid } from '../types/game'
import { chassisOptionsForDraft, loadSeasonPack } from './spinPool'

function carRatingFromPool(pack: SeasonPack): number {
  const chassis = chassisOptionsForDraft(pack.draftPool.chassis)[0]?.rating ?? 50
  const engine = pack.draftPool.engines[0]?.rating ?? 50
  return Math.round((chassis + engine) / 2)
}

export async function buildHistoricalSimulationGrid(anchorPack: SeasonPack): Promise<SimulationGrid> {
  const teams: SimulationGrid['teams'] = []

  for (const opp of anchorPack.opponents) {
    try {
      const oppPack = await loadSeasonPack(anchorPack.year, opp.id)
      const carRating = carRatingFromPool(oppPack)
      teams.push({
        id: opp.id,
        name: opp.name,
        strength: carRating,
        carRating,
        drivers: oppPack.draftPool.drivers.slice(0, 2).map((d) => ({
          id: `${opp.id}__${d.id}`,
          name: d.name,
          rating: d.rating,
        })),
      })
    } catch {
      teams.push({
        id: opp.id,
        name: opp.name,
        strength: opp.strength,
        carRating: opp.strength,
        drivers: [
          { id: `${opp.id}-d1`, name: `${opp.name} #1`, rating: opp.strength },
          { id: `${opp.id}-d2`, name: `${opp.name} #2`, rating: opp.strength * 0.93 },
        ],
      })
    }
  }

  return {
    year: anchorPack.year,
    raceCount: anchorPack.raceCount,
    calendar: anchorPack.calendar,
    teams,
  }
}
