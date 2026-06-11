import type { DraftPick } from '../types/game'
import { computeTeamRatings } from '../engine/ratings'

interface Props {
  picks: DraftPick[]
}

function RatingBar({ label, value, color }: { label: string; value: number; color: string }) {
  const display = value > 0 ? value : '—'
  const width = value > 0 ? `${value}%` : '0%'

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">{label}</p>
        <p className="text-lg font-bold tabular-nums text-foreground">{display}</p>
      </div>
      <div className="h-2.5 np-inset overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width }}
        />
      </div>
    </div>
  )
}

export function TeamRatingsPanel({ picks }: Props) {
  const ratings = computeTeamRatings(picks)

  return (
    <aside className="np-panel sticky top-24">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">
        Team Ratings
      </h3>
      <div className="space-y-4">
        <RatingBar label="Driver Lineup" value={ratings.driverLineup} color="bg-accent" />
        <RatingBar label="Car" value={ratings.car} color="bg-accent-light" />
        <RatingBar label="Support" value={ratings.support} color="bg-accent-secondary" />
      </div>
      <p className="text-xs text-muted mt-4 leading-relaxed">
        Good drivers and a good car win races. Support keeps drivers consistent. Engineer crew
        affects reliability and pit stops.
      </p>
    </aside>
  )
}
