import { motion } from 'framer-motion'
import type { DriverPriority } from '../types/game'
import { DRIVER_PRIORITY_LABELS } from '../types/game'

const PRIORITY_OPTIONS: {
  id: DriverPriority
  title: string
  description: string
}[] = [
  {
    id: 'priority-d1',
    title: DRIVER_PRIORITY_LABELS['priority-d1'],
    description: 'Driver 1 gets the best strategy, setup time, and race focus. Driver 2 deputises.',
  },
  {
    id: 'equal',
    title: DRIVER_PRIORITY_LABELS.equal,
    description: 'Both drivers share resources equally — no favouritism.',
  },
  {
    id: 'best-form',
    title: DRIVER_PRIORITY_LABELS['best-form'],
    description: 'Whoever is delivering results gets priority support as the season unfolds.',
  },
]

interface Props {
  onSelect: (priority: DriverPriority) => void
}

export function PrioritySelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center max-w-lg mx-auto px-4">
      <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-center text-foreground">
        Driver priority
      </h1>
      <p className="text-muted text-sm mb-8 text-center">
        Choose how your team treats its drivers before you start spinning.
      </p>
      <div className="w-full space-y-3">
        {PRIORITY_OPTIONS.map((opt) => (
          <motion.button
            key={opt.id}
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(opt.id)}
            className="w-full text-left p-5 np-well np-hard-shadow-hover np-focus"
          >
            <p className="font-serif font-bold text-foreground">{opt.title}</p>
            <p className="text-sm text-muted mt-1">{opt.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
