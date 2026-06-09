/** Shared OVR calibration for chassis and engines — mirrors driver GOAT logic. */

export const COMPONENT_OVR_SHIFT = 5
const NON_GOAT_CAP = 93
const GOAT_PEAK_CAP = 99
const GOAT_STRONG_CAP = 97
const GOAT_SOLID_CAP = 94

/** Legendary cars — only these can reach the elite tier in dominant seasons. */
export const GOAT_CHASSIS_IDS = new Set([
  'mclaren-mp4-4',
  'red-bull-rb19',
  'brawn-bgp-001',
  'ferrari-f2004',
  'williams-fw14b',
  'red-bull-rb9',
  'alfa-romeo-158',
  'alfa-romeo-159',
  // Mercedes hybrid-era dominance (W05–W12)
  'mercedes-f1-w05',
  'mercedes-f1-w06',
  'mercedes-f1-w07',
  'mercedes-f1-w08',
  'mercedes-f1-w09',
  'mercedes-f1-w10',
  'mercedes-f1-w11',
  'mercedes-f1-w12',
])

/** Top 10 all-time engine units — peak scores only in dominant seasons. */
export const GOAT_ENGINE_IDS = new Set([
  'honda-ra168e-15-v6-t', // MP4/4 1988
  'alfa-romeo-158-15-l8-s', // Alfa 158/159 1950
  'ferrari-053-30-v10', // F2004 2004
  'renault-rs4-35-v10', // FW14B 1992
  'mercedes-fo-108w-24-v8', // Brawn BGP 001 2009
  'renault-rs27-2013-24-v8', // RB9 2013
  'ford-cosworth-dfv-30-v8', // DFV era
  'mercedes-amg-f1-m11-16-v6-t-h', // W11 2020
  'mercedes-pu106c-16-v6-t-h', // W07 2016 hybrid PU
  'honda-rbpt-rbpth001-16-v6-t-h', // RB19 2023
])

export interface ComponentOvrContext {
  /** Constructor/engine season percentile (0–99). */
  seasonStrength: number
  /** Constructor WCC finishing position that year. */
  wccPosition: number
}

function isDominantSeason(ctx: ComponentOvrContext): boolean {
  return ctx.wccPosition === 1 && ctx.seasonStrength >= 88
}

function isStrongSeason(ctx: ComponentOvrContext): boolean {
  return ctx.wccPosition <= 2 && ctx.seasonStrength >= 82
}

function goatPreShiftCap(ctx: ComponentOvrContext): number {
  if (isDominantSeason(ctx)) {
    if (ctx.seasonStrength >= 95) return GOAT_PEAK_CAP
    if (ctx.seasonStrength >= 90) return GOAT_STRONG_CAP
    return GOAT_SOLID_CAP
  }
  if (isStrongSeason(ctx)) {
    if (ctx.seasonStrength >= 90) return GOAT_STRONG_CAP
    return GOAT_SOLID_CAP - 2
  }
  if (ctx.seasonStrength >= 75) return 90
  return 86
}

export function isGoatChassis(chassisId: string): boolean {
  return GOAT_CHASSIS_IDS.has(chassisId)
}

export function isGoatEngine(engineId: string): boolean {
  return GOAT_ENGINE_IDS.has(engineId)
}

export function calibrateChassisOvr(
  chassisId: string,
  rating: number,
  ctx: ComponentOvrContext,
): number {
  const tierCap = isGoatChassis(chassisId) ? goatPreShiftCap(ctx) : NON_GOAT_CAP
  return Math.max(30, Math.min(tierCap, rating) - COMPONENT_OVR_SHIFT)
}

export function calibrateEngineOvr(
  engineId: string,
  rating: number,
  ctx: ComponentOvrContext,
): number {
  const tierCap = isGoatEngine(engineId) ? goatPreShiftCap(ctx) : NON_GOAT_CAP
  return Math.max(30, Math.min(tierCap, rating) - COMPONENT_OVR_SHIFT)
}
