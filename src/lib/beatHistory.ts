import type { DraftPick } from '../types/game'
import { SLOT_LABELS } from '../types/game'

export interface DraftSourceRow {
  slot: string
  pickName: string
  rating: number
  sourceTeam: string
  sourceYear: number
  historicalWcc: number
  beatHistorical: boolean
}

export interface BeatHistorySummary {
  rows: DraftSourceRow[]
  playerWcc: number
  bestHistoricalWcc: number
  averageHistoricalWcc: number
  beatCount: number
  totalSources: number
  headline: string
}

export function computeBeatHistory(picks: DraftPick[], playerWcc: number): BeatHistorySummary {
  const rows: DraftSourceRow[] = picks.map((p) => ({
    slot: SLOT_LABELS[p.slot],
    pickName: p.option.name,
    rating: p.option.rating,
    sourceTeam: p.sourceConstructorName,
    sourceYear: p.sourceYear,
    historicalWcc: p.historicalWccPosition,
    beatHistorical: playerWcc < p.historicalWccPosition,
  }))

  const positions = rows.map((r) => r.historicalWcc)
  const bestHistoricalWcc = Math.min(...positions)
  const averageHistoricalWcc =
    Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
  const beatCount = rows.filter((r) => r.beatHistorical).length

  let headline: string
  if (playerWcc === 1) {
    headline = 'World champions — you matched the ultimate goal.'
  } else if (playerWcc < bestHistoricalWcc) {
    headline = `You outperformed every team you drafted from (best historical: P${bestHistoricalWcc}).`
  } else if (beatCount === 0) {
    headline = `Tough season — none of your source teams did worse than P${playerWcc} historically.`
  } else {
    headline = `You beat ${beatCount} of ${rows.length} historical source teams.`
  }

  return {
    rows,
    playerWcc,
    bestHistoricalWcc,
    averageHistoricalWcc,
    beatCount,
    totalSources: rows.length,
    headline,
  }
}
