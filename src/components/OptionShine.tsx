import type { ReactNode } from 'react'
import type { OptionBadge } from '../engine/badges'

interface Props {
  badge: OptionBadge | null
  children: ReactNode
  className?: string
}

const BADGE_LABEL: Record<OptionBadge, string> = {
  prime: 'Prime',
  legend: 'Legend',
}

export function OptionShine({ badge, children, className = '' }: Props) {
  if (!badge) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={`option-shine option-shine-${badge} ${className}`}
    >
      <span
        className={`option-shine-badge option-shine-badge-${badge}`}
        aria-label={BADGE_LABEL[badge]}
      >
        {BADGE_LABEL[badge]}
      </span>
      {children}
    </div>
  )
}
