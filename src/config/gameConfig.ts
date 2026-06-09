const parsed = Number(import.meta.env.VITE_RESPINS_PER_RUN)

/** Re-spins allowed per full game (draft phase). Dev-unlocked sessions are unlimited. */
export const RESPINS_PER_RUN =
  Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 3
