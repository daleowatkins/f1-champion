import { gpCode, gpFlag, wikiPositionBg } from '../data/gpCodes'
import { championshipPosition, rankedStandings } from '../engine/standingsRank'
import type { DriverSeasonStanding, SeasonResult } from '../types/game'

interface Props {
  result: SeasonResult
  highlightRound?: number
  /** When true, show every driver in championship order (final results screen). */
  showAllDrivers?: boolean
}

function FlagImg({ country, size = 16 }: { country: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${country}.png`}
      srcSet={`https://flagcdn.com/w40/${country}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt=""
      className="inline-block align-middle"
      loading="lazy"
    />
  )
}

function formatCell(cell: DriverSeasonStanding['races'][0] | undefined) {
  if (!cell || cell.position === null) return { text: '', bg: '#f8f9fa' }

  const bg = wikiPositionBg(cell.position, 10)
  if (cell.position === 'Ret') {
    return { text: 'Ret', bg }
  }

  let text = String(cell.position)
  const tags: string[] = []
  if (cell.pole) tags.push('P')
  if (cell.fastestLap) tags.push('F')
  if (tags.length > 0) text += ` ${tags.join('')}`

  return { text, bg }
}

export function WikipediaSeasonTable({ result, highlightRound, showAllDrivers = false }: Props) {
  const calendar = result.calendar.length > 0 ? result.calendar : result.raceResults.map((r) => r.grandPrix)

  const tableDrivers = showAllDrivers
    ? rankedStandings(result.standings)
    : result.standings
        .filter((d) => d.isPlayer)
        .sort((a, b) => (a.id === 'd1' ? -1 : b.id === 'd1' ? 1 : 0))

  const nameColWidth = showAllDrivers ? '12%' : '14%'
  const raceColPct = `${Math.max(2.2, (100 - (showAllDrivers ? 28 : 18)) / calendar.length)}%`

  return (
    <div
      className={`w-full rounded border border-[#a2a9b1] bg-white text-[#202122] text-xs shadow-sm ${
        showAllDrivers ? 'max-h-[70vh] overflow-auto' : ''
      }`}
    >
      <table
        className="border-collapse w-full table-fixed"
        style={{ fontFamily: 'sans-serif' }}
      >
        <colgroup>
          <col className="w-[2.5rem]" />
          <col style={{ width: nameColWidth }} />
          {showAllDrivers && <col className="w-[10%]" />}
          {calendar.map((gp, index) => (
            <col key={`${gp}-${index}`} style={{ width: raceColPct }} />
          ))}
          <col className="w-[3rem]" />
        </colgroup>
        <thead>
          <tr className="bg-[#eaecf0]">
            <th className="sticky left-0 z-20 bg-[#eaecf0] border border-[#a2a9b1] px-1 py-1 text-center font-normal">
              Pos
            </th>
            <th className="sticky left-[2.5rem] z-20 bg-[#eaecf0] border border-[#a2a9b1] px-2 py-1 text-left font-normal">
              Driver
            </th>
            {showAllDrivers && (
              <th className="sticky left-[calc(2.5rem+12%)] z-20 bg-[#eaecf0] border border-[#a2a9b1] px-2 py-1 text-left font-normal">
                Team
              </th>
            )}
            {calendar.map((gp, index) => (
              <th
                key={`${gp}-${index}`}
                className={`border border-[#a2a9b1] px-0.5 py-1 text-center font-normal ${
                  highlightRound === index + 1 ? 'ring-2 ring-inset ring-[#3366cc]' : ''
                }`}
              >
                <div className="text-[#0645ad]">{gpCode(gp)}</div>
                <div className="flex justify-center mt-0.5">
                  <FlagImg country={gpFlag(gp)} size={14} />
                </div>
              </th>
            ))}
            <th className="border border-[#a2a9b1] px-2 py-1 text-center font-bold bg-[#eaecf0]">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {tableDrivers.map((driver, index) => {
            const rowBg = driver.isPlayer ? '#fff8e6' : '#ffffff'
            const position = showAllDrivers
              ? index + 1
              : championshipPosition(driver.id, result.standings)

            return (
              <tr key={driver.id} className={driver.isPlayer ? 'font-medium' : undefined}>
                <td
                  className="sticky left-0 z-10 border border-[#a2a9b1] px-2 py-0.5 text-center"
                  style={{ backgroundColor: rowBg }}
                >
                  {position}
                </td>
                <td
                  className="sticky left-[2.5rem] z-10 border border-[#a2a9b1] px-2 py-0.5 text-left truncate"
                  style={{ backgroundColor: rowBg }}
                >
                  <span className={`truncate ${driver.isPlayer ? 'font-bold text-[#202122]' : ''}`}>
                    {driver.name}
                  </span>
                </td>
                {showAllDrivers && (
                  <td
                    className="sticky left-[calc(2.5rem+12%)] z-10 border border-[#a2a9b1] px-2 py-0.5 text-left truncate text-[#54595d]"
                    style={{ backgroundColor: rowBg }}
                  >
                    {driver.teamName}
                  </td>
                )}
                {driver.races.map((cell, raceIndex) => {
                  const { text, bg } = formatCell(cell)
                  return (
                    <td
                      key={raceIndex}
                      className={`border border-[#a2a9b1] px-0.5 py-0.5 text-center ${
                        highlightRound === raceIndex + 1 ? 'ring-2 ring-inset ring-[#3366cc]' : ''
                      }`}
                      style={{ backgroundColor: bg }}
                    >
                      {text}
                    </td>
                  )
                })}
                <td
                  className="border border-[#a2a9b1] px-2 py-0.5 text-center font-bold"
                  style={{ backgroundColor: rowBg }}
                >
                  {driver.totalPoints}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="px-2 py-1 text-[10px] text-[#54595d] bg-[#f8f9fa] border-t border-[#a2a9b1]">
        <span className="inline-block w-3 h-3 mr-1 align-middle" style={{ background: '#FFFFBF' }} />
        Winner
        <span className="inline-block w-3 h-3 mx-1 align-middle" style={{ background: '#DFDFDF' }} />
        2nd
        <span className="inline-block w-3 h-3 mx-1 align-middle" style={{ background: '#FFDF9F' }} />
        3rd
        <span className="inline-block w-3 h-3 mx-1 align-middle" style={{ background: '#DFFFDF' }} />
        Points
        <span className="inline-block w-3 h-3 mx-1 align-middle" style={{ background: '#CFCFFF' }} />
        Finished
        <span className="inline-block w-3 h-3 mx-1 align-middle" style={{ background: '#EFCFFF' }} />
        Retired
        {' · '}P = Pole · F = Fastest lap
      </p>
    </div>
  )
}
