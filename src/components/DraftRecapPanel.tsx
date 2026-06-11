import { SLOT_LABELS } from '../types/game'
import type { DraftPick } from '../types/game'
import { RatingBreakdownDetail } from './RatingBreakdownDetail'
import { ComponentEffectNote } from './ComponentEffectNote'
import { getSlotEffect } from '../lib/componentEffects'

interface Props {
  picks: DraftPick[]
}

export function DraftRecapPanel({ picks }: Props) {
  return (
    <div className="mb-6 max-w-4xl mx-auto np-panel">
      <p className="text-xs text-muted uppercase tracking-widest mb-1 font-semibold">Full draft</p>
      <h3 className="font-serif text-lg font-bold mb-4 text-foreground">Your championship squad</h3>
      <div className="space-y-4">
        {picks.map((pick) => (
          <div key={pick.slot} className="np-inset p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-accent uppercase tracking-wider font-semibold">
                  {SLOT_LABELS[pick.slot]}
                </p>
                <p className="font-bold text-foreground mt-1">{pick.option.name}</p>
                <p className="text-sm text-muted mt-0.5">
                  From {pick.sourceConstructorName} {pick.sourceYear} · Historical WCC P
                  {pick.historicalWccPosition}
                </p>
                {pick.option.meta && (
                  <p className="text-xs text-muted mt-1">{pick.option.meta}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-accent">{pick.option.rating}</span>
                <p className="text-xs text-muted">OVR</p>
              </div>
            </div>
            {pick.option.stats && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                {pick.option.stats.wins !== undefined && (
                  <span className="np-meta-chip">W {pick.option.stats.wins}</span>
                )}
                {pick.option.stats.poles !== undefined && (
                  <span className="np-meta-chip">P {pick.option.stats.poles}</span>
                )}
                {pick.option.stats.points !== undefined && (
                  <span className="np-meta-chip">Pts {pick.option.stats.points}</span>
                )}
                {pick.option.stats.avgFinish !== undefined && (
                  <span className="np-meta-chip">Avg {pick.option.stats.avgFinish}</span>
                )}
              </div>
            )}
            <ComponentEffectNote effect={getSlotEffect(pick.slot)} compact />
            <RatingBreakdownDetail option={pick.option} />
          </div>
        ))}
      </div>
    </div>
  )
}
