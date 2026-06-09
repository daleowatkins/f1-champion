import { useEffect, useState } from 'react'
import { applyDevGateFromUrl, isDevUnlocked } from '../config/devGate'

export function useDevGate(): boolean {
  const [unlocked, setUnlocked] = useState(() => {
    applyDevGateFromUrl()
    return isDevUnlocked()
  })

  useEffect(() => {
    applyDevGateFromUrl()
    setUnlocked(isDevUnlocked())
  }, [])

  return unlocked
}
