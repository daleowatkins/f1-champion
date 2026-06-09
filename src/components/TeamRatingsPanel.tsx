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
        <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
        <p className="text-lg font-bold tabular-nums">{display}</p>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width }}
        />
      </div>
    </div>
  )
}

export function TeamRatingsPanel({ picks }: Props) {
  const ratings = computeTeamRatings(picks)

  return (
    <aside className="rounded-xl border border-white/10 bg-f1-card p-4 sticky top-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">
        Team Ratings
      </h3>
      <div className="space-y-4">
        <RatingBar label="Driver Lineup" value={ratings.driverLineup} color="bg-f1-red" />
        <RatingBar label="Car" value={ratings.car} color="bg-f1-accent" />
        <RatingBar label="Support" value={ratings.support} color="bg-emerald-500" />
      </div>
      <p className="text-xs text-white/30 mt-4 leading-relaxed">
        Good drivers and a good car win races. Support keeps drivers consistent. Engineer crew
        affects reliability and pit stops.
      </p>
    </aside>
  )
}
