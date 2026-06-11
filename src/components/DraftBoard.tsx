import type { DraftPick } from '../types/game'
import { SLOT_LABELS, SLOT_ORDER } from '../types/game'
import { cn } from '../lib/cn'

interface Props {
  picks: DraftPick[]
  currentConstructorName?: string
  currentYear?: number
}

export function DraftBoard({ picks, currentConstructorName, currentYear }: Props) {
  const pickMap = Object.fromEntries(picks.map((p) => [p.slot, p]))
  const remaining = SLOT_ORDER.length - picks.length

  return (
    <div className="w-full np-panel">
      {currentConstructorName && currentYear && (
        <div className="mb-6 text-center">
          <p className="text-sm text-muted">Current spin</p>
          <p className="font-serif text-lg font-bold text-foreground">
            {currentConstructorName}{' '}
            <span className="text-accent">{currentYear}</span>
          </p>
          <p className="text-xs text-muted mt-1">
            Pick any component below · {remaining} slot{remaining !== 1 ? 's' : ''} left
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SLOT_ORDER.map((slot) => {
          const pick = pickMap[slot]
          const isEmpty = !pick
          return (
            <div
              key={slot}
              className={cn(isEmpty ? 'np-empty-slot' : 'np-filled-slot', 'transition-all duration-300')}
            >
              <p className="text-xs uppercase tracking-wider text-muted font-semibold">
                {SLOT_LABELS[slot]}
              </p>
              <p
                className={cn(
                  'mt-1 font-medium truncate',
                  pick ? 'text-foreground' : 'text-placeholder',
                )}
              >
                {pick ? pick.option.name : '—'}
              </p>
              {pick && (
                <>
                  <p className="text-xs text-accent mt-0.5 font-semibold">OVR {pick.option.rating}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">
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
