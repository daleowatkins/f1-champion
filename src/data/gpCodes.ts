/** Wikipedia-style 3-letter race codes and flag country codes. */
export const GP_CODES: Record<string, { code: string; flag: string }> = {
  Australia: { code: 'AUS', flag: 'au' },
  China: { code: 'CHN', flag: 'cn' },
  Japan: { code: 'JPN', flag: 'jp' },
  Bahrain: { code: 'BHR', flag: 'bh' },
  'Saudi Arabia': { code: 'SAU', flag: 'sa' },
  Miami: { code: 'MIA', flag: 'us' },
  'Emilia Romagna': { code: 'EMI', flag: 'it' },
  Monaco: { code: 'MON', flag: 'mc' },
  Spain: { code: 'ESP', flag: 'es' },
  Canada: { code: 'CAN', flag: 'ca' },
  Austria: { code: 'AUT', flag: 'at' },
  'Great Britain': { code: 'GBR', flag: 'gb' },
  Belgium: { code: 'BEL', flag: 'be' },
  Hungary: { code: 'HUN', flag: 'hu' },
  Netherlands: { code: 'NED', flag: 'nl' },
  Italy: { code: 'ITA', flag: 'it' },
  Azerbaijan: { code: 'AZE', flag: 'az' },
  Singapore: { code: 'SGP', flag: 'sg' },
  'United States': { code: 'USA', flag: 'us' },
  Mexico: { code: 'MEX', flag: 'mx' },
  'São Paulo': { code: 'SAP', flag: 'br' },
  'Las Vegas': { code: 'LVG', flag: 'us' },
  Qatar: { code: 'QAT', flag: 'qa' },
  'Abu Dhabi': { code: 'ABU', flag: 'ae' },
  Brazil: { code: 'BRA', flag: 'br' },
  'South Africa': { code: 'RSA', flag: 'za' },
  France: { code: 'FRA', flag: 'fr' },
  Germany: { code: 'GER', flag: 'de' },
  Portugal: { code: 'POR', flag: 'pt' },
  Detroit: { code: 'DET', flag: 'us' },
  Dallas: { code: 'DAL', flag: 'us' },
  Europe: { code: 'EUR', flag: 'eu' },
  'San Marino': { code: 'SMR', flag: 'sm' },
  Turkey: { code: 'TUR', flag: 'tr' },
  Russia: { code: 'RUS', flag: 'ru' },
  Styria: { code: 'STY', flag: 'at' },
  Tuscany: { code: 'TUS', flag: 'it' },
  Eifel: { code: 'EIF', flag: 'de' },
}

export function gpCode(grandPrix: string): string {
  return GP_CODES[grandPrix]?.code ?? grandPrix.slice(0, 3).toUpperCase()
}

export function gpFlag(grandPrix: string): string {
  return GP_CODES[grandPrix]?.flag ?? 'xx'
}

/** Wikipedia F1 results table cell background colours. */
export function wikiPositionBg(
  position: number | 'Ret' | null,
  pointsPositions: number,
): string {
  if (position === null) return '#f8f9fa'
  if (position === 'Ret') return '#EFCFFF'
  if (position === 1) return '#FFFFBF'
  if (position === 2) return '#DFDFDF'
  if (position === 3) return '#FFDF9F'
  if (position <= pointsPositions) return '#DFFFDF'
  return '#CFCFFF'
}
