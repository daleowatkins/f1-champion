import type { DraftPick } from '../types/game'
import { SLOT_LABELS, SLOT_ORDER } from '../types/game'

interface Props {
  picks: DraftPick[]
  currentConstructorName?: string
  currentYear?: number
}

export function DraftBoard({ picks, currentConstructorName, currentYear }: Props) {
  const pickMap = Object.fromEntries(picks.map((p) => [p.slot, p]))
  const remaining = SLOT_ORDER.length - picks.length

  return (
    <div className="w-full">
      {currentConstructorName && currentYear && (
        <div className="mb-4 text-center">
          <p className="text-sm text-white/50">Current spin</p>
          <p className="text-lg font-bold">
            {currentConstructorName} <span className="text-f1-red">{currentYear}</span>
          </p>
          <p className="text-xs text-white/40 mt-1">
            Pick any component below · {remaining} slot{remaining !== 1 ? 's' : ''} left
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SLOT_ORDER.map((slot) => {
          const pick = pickMap[slot]
          const isEmpty = !pick
          return (
            <div
              key={slot}
              className={`rounded-lg border p-3 transition-all ${
                isEmpty
                  ? 'border-f1-accent/40 bg-f1-accent/5 border-dashed'
                  : 'border-white/20 bg-f1-card'
              }`}
            >
              <p className="text-xs uppercase tracking-wider text-white/40">
                {SLOT_LABELS[slot]}
              </p>
              <p className={`mt-1 font-medium truncate ${pick ? 'text-white' : 'text-white/30'}`}>
                {pick ? pick.option.name : '—'}
              </p>
              {pick && (
                <>
                  <p className="text-xs text-f1-accent mt-0.5">OVR {pick.option.rating}</p>
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {pick.sourceConstructorName} {pick.sourceYear}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
