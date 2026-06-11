import { ComponentCard } from './ComponentCard'
import { OptionShine } from './OptionShine'
import type { OptionBadge } from '../engine/badges'
import type { DriverSlot } from '../engine/spinPool'
import type { DraftOption, GameMode } from '../types/game'
import { SLOT_LABELS } from '../types/game'
import { getDriverCategoryEffect, getDriverRoleHint, getSlotEffect } from '../lib/componentEffects'
import { cn } from '../lib/cn'

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
  reserveDriver: 'Reserve',
}

function slotButtonClass(slot: DriverSlot, slotCount: number): string {
  if (slotCount === 1) return 'np-btn-primary w-full'
  if (slot === 'driver1') return 'np-btn-primary w-full'
  if (slot === 'driver2') return 'np-btn-secondary w-full'
  return 'np-btn-secondary w-full'
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
      : 'Pick a slot below'

  const driverEffect =
    availableSlots.length === 1
      ? getSlotEffect(availableSlots[0])
      : getDriverCategoryEffect()

  return (
    <OptionShine badge={badge} className="np-card overflow-hidden">
      <ComponentCard
        option={option}
        mode={mode}
        effectOverride={driverEffect}
        disabled={disabled}
        isOnlyOption={false}
        fillsSlot={fillsSlot}
        hideSelectButton
      />
      <div className="border-t border-ink bg-neutral-100 p-3 sm:p-4">
        <p className="np-label mb-3 text-center sm:text-left">
          {availableSlots.length === 1
            ? 'Add to your team'
            : 'Select which slot to fill'}
        </p>
        <div
          className={cn(
            'grid gap-2',
            availableSlots.length === 1 && 'grid-cols-1',
            availableSlots.length === 2 && 'grid-cols-1 sm:grid-cols-2',
            availableSlots.length >= 3 && 'grid-cols-1 sm:grid-cols-3',
          )}
        >
          {availableSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(slot)}
              title={getDriverRoleHint(slot)}
              className={cn(slotButtonClass(slot, availableSlots.length), 'np-focus min-h-12')}
            >
              <span className="block">
                {availableSlots.length === 1
                  ? `Select as ${SLOT_BUTTON_LABEL[slot]}`
                  : `→ ${SLOT_BUTTON_LABEL[slot]}`}
              </span>
              {availableSlots.length > 1 && (
                <span
                  className={cn(
                    'block text-[10px] font-normal mt-0.5 leading-tight tracking-normal normal-case',
                    slot === 'driver1' ? 'text-paper/80' : 'text-muted',
                  )}
                >
                  {slot === 'reserveDriver' ? 'Development driver' : 'Race seat'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </OptionShine>
  )
}
