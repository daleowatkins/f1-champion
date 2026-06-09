const STORAGE_KEY = 'f1-dev-unlocked'
const QUERY_PARAM = 'devtools'

function gateKey(): string {
  return (import.meta.env.VITE_DEV_GATE_KEY as string | undefined)?.trim() ?? ''
}

/** True when local `npm run dev` — all dev affordances enabled. */
export function isLocalDev(): boolean {
  return import.meta.env.DEV
}

/**
 * Unlock dev tools in production via `/?devtools=YOUR_SECRET` (once per browser tab).
 * Set `VITE_DEV_GATE_KEY` at build time. If unset, dev routes stay locked in production.
 */
export function applyDevGateFromUrl(): boolean {
  if (isLocalDev()) return true

  const key = gateKey()
  if (!key) return false

  const params = new URLSearchParams(window.location.search)
  const supplied = params.get(QUERY_PARAM)
  if (supplied && supplied === key) {
    sessionStorage.setItem(STORAGE_KEY, '1')
    const url = new URL(window.location.href)
    url.searchParams.delete(QUERY_PARAM)
    const next = url.pathname + url.search + url.hash
    window.history.replaceState({}, '', next || '/')
    return true
  }

  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

export function isDevUnlocked(): boolean {
  if (isLocalDev()) return true
  if (!gateKey()) return false
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}
