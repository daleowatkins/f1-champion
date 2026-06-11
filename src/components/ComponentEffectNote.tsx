import type { ComponentEffect } from '../lib/componentEffects'

interface Props {
  effect: ComponentEffect
  compact?: boolean
}

export function ComponentEffectNote({ effect, compact = false }: Props) {
  return (
    <div
      className={`np-inset ${
        compact ? 'mt-2 px-2.5 py-2' : 'mt-3 px-3 py-2.5'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">
        {effect.title}
      </p>
      <p className={`text-muted leading-snug ${compact ? 'text-[11px] mt-0.5' : 'text-xs mt-1'}`}>
        {effect.body}
      </p>
    </div>
  )
}
