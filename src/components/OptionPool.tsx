import { ComponentCard } from './ComponentCard'
import { DriverOptionCard } from './DriverOptionCard'
import type { OptionGroup } from '../engine/spinPool'
import type { GameMode } from '../types/game'

interface Props {
  groups: OptionGroup[]
  mode: GameMode
  onSelect: (slot: OptionGroup['options'][0]['slot'], option: OptionGroup['options'][0]['option']) => void
  disabled?: boolean
}

export function OptionPool({ groups, mode, onSelect, disabled }: Props) {
  if (groups.length === 0) {
    return (
      <p className="text-center text-white/50 text-sm py-4">
        All slots filled — finishing up...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-2">
            {group.category}
          </h3>
          <div className="space-y-2">
            {group.driverOptions?.map((item) => (
              <DriverOptionCard
                key={item.option.id}
                option={item.option}
                mode={mode}
                availableSlots={item.availableSlots}
                disabled={disabled}
                onSelect={(slot) => onSelect(slot, item.option)}
              />
            ))}
            {group.options.map((item) => (
              <div key={`${item.slot}-${item.option.id}`}>
                <ComponentCard
                  option={item.option}
                  mode={mode}
                  disabled={disabled}
                  isOnlyOption={group.options.length === 1}
                  fillsSlot={item.fillsLabel}
                  onSelect={() => onSelect(item.slot, item.option)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
