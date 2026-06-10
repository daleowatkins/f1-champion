import { pickRandomSpin, type SpinPickOptions } from '../engine/spinPool'
import type { GameMode, SimulationEraPolicy, SpinEntry } from '../types/game'

export function deriveSeed(base: number, label: string): number {
  let h = Math.abs(Math.floor(base)) % 2147483646
  if (h === 0) h = 1
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) % 2147483646
  }
  return h + 1
}

export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function pickSpinWithRand(
  entries: SpinEntry[],
  rand: () => number,
  options: SpinPickOptions = {},
): SpinEntry {
  return pickRandomSpin(entries, rand, options)
}

export function createRunSeed(): number {
  return Math.floor(Math.random() * 2_147_483_646) + 1
}

export function parseRunSeed(input: string): number | null {
  const trimmed = input.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 1 || n > 2_147_483_646) return null
  return Math.floor(n)
}

export function formatShareUrl(
  seed: number,
  options?: { mode?: GameMode; eraPolicy?: SimulationEraPolicy },
): string {
  const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '')
  const params = new URLSearchParams({
    mode: options?.mode ?? 'classic',
    seed: String(seed),
  })
  if (options?.eraPolicy === 'historical-first-spin') {
    params.set('era', 'historical')
  }
  return `${base}/play?${params}`
}

export function buildChallengeShareContent(options: {
  tierLabel: string
  year: number
  wccPosition: number
  bestWdcPosition: number
  totalPoints: number
  wins: number
  runSeed: number
  seedUrl: string
}): { title: string; text: string; url: string } {
  const {
    tierLabel,
    year,
    wccPosition,
    bestWdcPosition,
    totalPoints,
    wins,
    runSeed,
    seedUrl,
  } = options

  const text = `Think you can beat my F1 Champion season?

${year} — ${tierLabel}
P${wccPosition} WCC · P${bestWdcPosition} WDC · ${totalPoints} pts · ${wins} wins

Play the same seed and try to beat me:
${seedUrl}

Seed: ${runSeed}`

  return {
    title: 'Beat my F1 Champion run',
    text,
    url: seedUrl,
  }
}
