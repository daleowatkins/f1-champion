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

export function pickSpinWithRand(entries: SpinEntry[], rand: () => number): SpinEntry {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  let r = rand() * totalWeight
  for (const entry of entries) {
    r -= entry.weight
    if (r <= 0) return entry
  }
  return entries[entries.length - 1]
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
