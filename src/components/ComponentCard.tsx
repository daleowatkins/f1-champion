import { motion } from 'framer-motion'
import type { OptionBadge } from '../engine/badges'
import type { DraftOption, GameMode } from '../types/game'
import { OptionShine } from './OptionShine'
import { RatingBreakdownDetail } from './RatingBreakdownDetail'
import { ComponentEffectNote } from './ComponentEffectNote'
import { getSlotEffect, type ComponentEffect } from '../lib/componentEffects'
import type { SlotType } from '../types/game'
import { cn } from '../lib/cn'

interface Props {
  option: DraftOption
  mode: GameMode
  effectSlot?: SlotType
  effectOverride?: ComponentEffect
  badge?: OptionBadge | null
  onSelect?: () => void
  disabled?: boolean
  isOnlyOption?: boolean
  fillsSlot?: string
  hideSelectButton?: boolean
}

export function ComponentCard({
  option,
  mode,
  effectSlot,
  effectOverride,
  badge = null,
  onSelect,
  disabled,
  isOnlyOption,
  fillsSlot,
  hideSelectButton,
}: Props) {
  const showStats = mode === 'classic'
  const effect =
    effectOverride ?? (effectSlot ? getSlotEffect(effectSlot) : undefined)
  const className = cn(
    'w-full text-left p-4 transition-all duration-300',
    hideSelectButton
      ? 'bg-transparent'
      : disabled
        ? 'np-inset opacity-50 cursor-not-allowed'
        : 'np-card np-hard-shadow-hover cursor-pointer np-focus',
  )

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">{option.name}</p>
          {option.meta && <p className="text-sm text-muted mt-0.5">{option.meta}</p>}
          {fillsSlot && (
            <p className="text-xs text-accent mt-1 font-medium">Fills {fillsSlot}</p>
          )}
        </div>
        {showStats && (
          <div className={cn('shrink-0 text-right', badge && 'pt-5')}>
            <span className="text-2xl font-bold text-accent">{option.rating}</span>
            <p className="text-xs text-muted">OVR</p>
          </div>
        )}
      </div>
      {showStats && option.stats && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          {option.stats.wins !== undefined && (
            <span className="np-meta-chip">W {option.stats.wins}</span>
          )}
          {option.stats.poles !== undefined && (
            <span className="np-meta-chip">P {option.stats.poles}</span>
          )}
          {option.stats.points !== undefined && (
            <span className="np-meta-chip">Pts {option.stats.points}</span>
          )}
          {option.stats.avgFinish !== undefined && (
            <span className="np-meta-chip">Avg {option.stats.avgFinish}</span>
          )}
        </div>
      )}
      {effect && <ComponentEffectNote effect={effect} />}
      {showStats && <RatingBreakdownDetail option={option} />}
      {isOnlyOption && (
        <span className="mt-2 inline-block text-xs text-amber-600 font-medium">Only option</span>
      )}
    </>
  )

  if (hideSelectButton) {
    return (
      <OptionShine badge={badge}>
        <div className={className}>{content}</div>
      </OptionShine>
    )
  }

  return (
    <OptionShine badge={badge}>
      <motion.button
        type="button"
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={onSelect}
        disabled={disabled}
        className={className}
      >
        {content}
      </motion.button>
    </OptionShine>
  )
}
