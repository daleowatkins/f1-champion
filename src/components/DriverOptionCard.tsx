import { ComponentCard } from './ComponentCard'
import { OptionShine } from './OptionShine'
import type { OptionBadge } from '../engine/badges'
import type { DriverSlot } from '../engine/spinPool'
import type { DraftOption, GameMode } from '../types/game'
import { SLOT_LABELS } from '../types/game'

interface Props {
  option: DraftOption
  mode: GameMode
  availableSlots: DriverSlot[]
  badge?: OptionBadge | null
  disabled?: boolean
  onSelect: (slot: DriverSlot) => void
}

const SLOT_BUTTON_LABEL: Record<DriverSlot, string> = {
  driver1: 'Driver 1',
  driver2: 'Driver 2',
  reserveDriver: 'Development',
}

const SLOT_BUTTON_HOVER: Record<DriverSlot, string> = {
  driver1: 'hover:bg-f1-red/20',
  driver2: 'hover:bg-f1-accent/20',
  reserveDriver: 'hover:bg-yellow-500/15',
}

export function DriverOptionCard({
  option,
  mode,
  availableSlots,
  badge = null,
  disabled,
  onSelect,
}: Props) {
  const fillsSlot =
    availableSlots.length === 1
      ? SLOT_LABELS[availableSlots[0]]
      : 'Choose role'

  return (
    <OptionShine badge={badge} className="border border-white/10 bg-f1-card/50">
      <ComponentCard
        option={option}
        mode={mode}
        disabled={disabled}
        isOnlyOption={false}
        fillsSlot={fillsSlot}
        hideSelectButton
      />
      <div className="flex border-t border-white/10">
        {availableSlots.map((slot, index) => (
          <div key={slot} className="flex flex-1 min-w-0">
            {index > 0 && <div className="w-px bg-white/10 shrink-0" />}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(slot)}
              className={`flex-1 min-w-0 px-1 py-2.5 text-xs sm:text-sm font-semibold text-white/80 hover:text-white disabled:opacity-40 transition-colors ${SLOT_BUTTON_HOVER[slot]}`}
            >
              {SLOT_BUTTON_LABEL[slot]}
            </button>
          </div>
        ))}
      </div>
    </OptionShine>
  )
}
