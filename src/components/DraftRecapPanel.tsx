import { SLOT_LABELS } from '../types/game'
import type { DraftPick } from '../types/game'
import { RatingBreakdownDetail } from './RatingBreakdownDetail'

interface Props {
  picks: DraftPick[]
}

export function DraftRecapPanel({ picks }: Props) {
  return (
    <div className="mb-6 max-w-4xl mx-auto rounded-xl border border-white/15 bg-f1-card p-5">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Full draft</p>
      <h3 className="text-lg font-bold mb-4">Your championship squad</h3>
      <div className="space-y-4">
        {picks.map((pick) => (
          <div
            key={pick.slot}
            className="rounded-lg border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-f1-accent uppercase tracking-wider">
                  {SLOT_LABELS[pick.slot]}
                </p>
                <p className="font-bold text-white mt-1">{pick.option.name}</p>
                <p className="text-sm text-white/50 mt-0.5">
                  From {pick.sourceConstructorName} {pick.sourceYear} · Historical WCC P
                  {pick.historicalWccPosition}
                </p>
                {pick.option.meta && (
                  <p className="text-xs text-white/40 mt-1">{pick.option.meta}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-f1-accent">{pick.option.rating}</span>
                <p className="text-xs text-white/40">OVR</p>
              </div>
            </div>
            {pick.option.stats && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                {pick.option.stats.wins !== undefined && (
                  <span className="bg-white/5 px-2 py-0.5 rounded">W {pick.option.stats.wins}</span>
                )}
                {pick.option.stats.poles !== undefined && (
                  <span className="bg-white/5 px-2 py-0.5 rounded">P {pick.option.stats.poles}</span>
                )}
                {pick.option.stats.points !== undefined && (
                  <span className="bg-white/5 px-2 py-0.5 rounded">Pts {pick.option.stats.points}</span>
                )}
                {pick.option.stats.avgFinish !== undefined && (
                  <span className="bg-white/5 px-2 py-0.5 rounded">
                    Avg {pick.option.stats.avgFinish}
                  </span>
                )}
              </div>
            )}
            <RatingBreakdownDetail option={pick.option} />
          </div>
        ))}
      </div>
    </div>
  )
}
