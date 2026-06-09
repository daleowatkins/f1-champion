import { Link } from 'react-router-dom'

export function HowToPlay() {
  return (
    <div className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-white/40 hover:text-white mb-8 inline-block">
        ← Back
      </Link>
      <h1 className="text-3xl font-bold mb-6">How to play</h1>
      <div className="space-y-6 text-white/70">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">The goal</h2>
          <p>
            Build the ultimate all-time F1 team across eight spins, then simulate a full championship campaign.
            Win the Constructors&apos; Championship — or go for the Double with Driver 1 also taking the Drivers&apos; title.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Step by step</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Pick Classic or Expert mode.</li>
            <li>Choose your driver priority — favour Driver 1, treat both equally, or back whoever is in best form.</li>
            <li>Spin to land on a real constructor and season.</li>
            <li>Every option from that team is shown — drivers, chassis, engine, plus one team principal, engineer crew, development budget, and reserve driver for that year.</li>
            <li>When picking a driver, choose whether they slot in as Driver 1 or Driver 2.</li>
            <li>You need a strong driver lineup and a strong car (chassis + engine) to fight for wins. Engineer crew affects reliability and pit stops. Team principal and reserve driver build your support score, which keeps drivers consistent.</li>
            <li>Development budget reflects real team wealth — Ferrari&apos;s is huge, Hesketh&apos;s is tiny — and boosts how much your car improves through the season.</li>
            <li>Pick whichever component you want; it fills the matching slot on your board. Watch your Driver Lineup, Car, and Support ratings build on the right.</li>
            <li>
              After each pick the reels respin automatically. You also get up to 3 manual re-spins
              per run if you want a different team/year before choosing.
            </li>
            <li>Watch your team compete in a full 2026 season with Wikipedia-style results.</li>
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Result tiers</h2>
          <ul className="space-y-1">
            <li><strong className="text-yellow-400">Double Champion</strong> — WCC + WDC</li>
            <li><strong className="text-f1-accent">Constructors Champion</strong> — P1 in WCC</li>
            <li><strong className="text-white">Podium Team</strong> — P2–P3 WCC</li>
            <li>Points Finisher — P4–P10</li>
            <li>Backmarker — P11+</li>
          </ul>
        </section>
      </div>
      <Link
        to="/play?mode=classic"
        className="mt-10 inline-block px-8 py-3 rounded-full bg-f1-red font-bold"
      >
        Play now
      </Link>
    </div>
  )
}
