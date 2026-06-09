import { ComponentCard } from './ComponentCard'
import type { DraftOption, GameMode } from '../types/game'

interface Props {
  option: DraftOption
  mode: GameMode
  availableSlots: ('driver1' | 'driver2')[]
  disabled?: boolean
  onSelect: (slot: 'driver1' | 'driver2') => void
}

export function DriverOptionCard({
  option,
  mode,
  availableSlots,
  disabled,
  onSelect,
}: Props) {
  const showBoth = availableSlots.length === 2

  return (
    <div className="rounded-lg border border-white/10 bg-f1-card/50 overflow-hidden">
      <ComponentCard
        option={option}
        mode={mode}
        disabled={disabled}
        isOnlyOption={false}
        fillsSlot={showBoth ? 'Choose slot' : availableSlots[0] === 'driver1' ? 'Driver 1' : 'Driver 2'}
        hideSelectButton
      />
      <div className="flex border-t border-white/10">
        {availableSlots.includes('driver1') && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect('driver1')}
            className="flex-1 py-2.5 text-sm font-semibold text-white/80 hover:bg-f1-red/20 hover:text-white disabled:opacity-40 transition-colors"
          >
            Driver 1
          </button>
        )}
        {showBoth && <div className="w-px bg-white/10" />}
        {availableSlots.includes('driver2') && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect('driver2')}
            className="flex-1 py-2.5 text-sm font-semibold text-white/80 hover:bg-f1-accent/20 hover:text-white disabled:opacity-40 transition-colors"
          >
            Driver 2
          </button>
        )}
      </div>
    </div>
  )
}
