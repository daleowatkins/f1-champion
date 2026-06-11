import { ComponentCard } from './ComponentCard'
import { DriverOptionCard } from './DriverOptionCard'
import { getDriverBadge, getOptionBadge } from '../engine/badges'
import type { OptionGroup } from '../engine/spinPool'
import type { GameMode } from '../types/game'

interface Props {
  groups: OptionGroup[]
  mode: GameMode
  packYear: number
  onSelect: (slot: OptionGroup['options'][0]['slot'], option: OptionGroup['options'][0]['option']) => void
  disabled?: boolean
}

export function OptionPool({ groups, mode, packYear, onSelect, disabled }: Props) {
  if (groups.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-4">
        All slots filled — finishing up...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-1">
            {group.category}
          </h3>
          {group.driverOptions && group.driverOptions.length > 0 && (
            <p className="text-xs text-foreground mb-3 font-mono uppercase tracking-wide border-l-2 border-editorial-red pl-2">
              Use the buttons below each driver to add them to your team
            </p>
          )}
          <div className="space-y-3">
            {group.driverOptions?.map((item) => (
              <DriverOptionCard
                key={item.option.id}
                option={item.option}
                mode={mode}
                availableSlots={item.availableSlots}
                badge={getDriverBadge(item.option, packYear)}
                disabled={disabled}
                onSelect={(slot) => onSelect(slot, item.option)}
              />
            ))}
            {group.options.map((item) => (
              <div key={`${item.slot}-${item.option.id}`}>
                <ComponentCard
                  option={item.option}
                  mode={mode}
                  effectSlot={item.slot}
                  badge={getOptionBadge(item.option, item.slot, packYear)}
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
