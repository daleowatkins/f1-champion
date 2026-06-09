import type { SeasonPerk } from '../types/game'

export type BanditSymbolId = 'trophy' | 'helmet' | 'wheel' | 'flag' | 'car' | 'champagne'

export interface BanditSymbol {
  id: BanditSymbolId
  label: string
  emoji: string
  accent: string
}

export const BANDIT_SYMBOLS: BanditSymbol[] = [
  { id: 'trophy', label: 'Trophy', emoji: '🏆', accent: '#f5c518' },
  { id: 'helmet', label: 'Helmet', emoji: '🪖', accent: '#e10600' },
  { id: 'wheel', label: 'Tyre', emoji: '🛞', accent: '#1a1a1a' },
  { id: 'flag', label: 'Chequered', emoji: '🏁', accent: '#ffffff' },
  { id: 'car', label: 'Racer', emoji: '🏎️', accent: '#00d2be' },
  { id: 'champagne', label: 'Podium', emoji: '🍾', accent: '#9acd32' },
]

/** Three matching trophies ≈ 1 jackpot per 5 runs. */
const JACKPOT_CHANCE = 0.2
const TROPHY_WEIGHT = Math.cbrt(JACKPOT_CHANCE)
const OTHER_WEIGHT = (1 - TROPHY_WEIGHT) / (BANDIT_SYMBOLS.length - 1)

export function banditJackpotChance(): number {
  return TROPHY_WEIGHT ** 3
}

const PERKS: SeasonPerk[] = [
  'flawless-engineering',
  'huge-sponsor',
  'creative-rules',
  'driver-wellbeing',
]

export interface BanditSpinResult {
  reels: [BanditSymbolId, BanditSymbolId, BanditSymbolId]
  won: boolean
  perk: SeasonPerk | null
}

function pickSymbol(rand: () => number): BanditSymbolId {
  const roll = rand()
  if (roll < TROPHY_WEIGHT) return 'trophy'
  let cursor = TROPHY_WEIGHT
  for (const symbol of BANDIT_SYMBOLS) {
    if (symbol.id === 'trophy') continue
    cursor += OTHER_WEIGHT
    if (roll < cursor) return symbol.id
  }
  return 'car'
}

export function pickRandomPerk(rand: () => number = Math.random): SeasonPerk {
  return PERKS[Math.floor(rand() * PERKS.length)]
}

export function spinBandit(rand: () => number = Math.random): BanditSpinResult {
  const reels: [BanditSymbolId, BanditSymbolId, BanditSymbolId] = [
    pickSymbol(rand),
    pickSymbol(rand),
    pickSymbol(rand),
  ]
  const won = reels.every((id) => id === 'trophy')
  return {
    reels,
    won,
    perk: won ? pickRandomPerk(rand) : null,
  }
}

export function getBanditSymbol(id: BanditSymbolId): BanditSymbol {
  return BANDIT_SYMBOLS.find((s) => s.id === id) ?? BANDIT_SYMBOLS[0]
}
