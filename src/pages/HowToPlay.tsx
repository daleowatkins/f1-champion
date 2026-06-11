import { Link } from 'react-router-dom'

export function HowToPlay() {
  return (
    <div className="py-12 max-w-3xl">
      <p className="np-label mb-3">Rules &amp; reference</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight mb-8 text-ink border-b-4 border-ink pb-4">
        How to play
      </h1>

      <div className="border border-ink divide-y divide-ink">
        <section className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">The goal</h2>
          <p className="text-muted leading-relaxed text-justify">
            Build the ultimate all-time F1 team across eight spins, then simulate a full championship
            campaign. Win the Constructors&apos; Championship — or go for the Double with Driver 1 also
            taking the Drivers&apos; title.
          </p>
        </section>

        <section className="p-6 sm:p-8 newsprint-texture">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Step by step</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted leading-relaxed">
            <li>Pick Classic or Expert mode.</li>
            <li>
              Choose your driver priority — favour Driver 1, treat both equally, or back whoever is in
              best form.
            </li>
            <li>Spin to land on a real constructor and season.</li>
            <li>
              Every option from that team is shown — drivers, chassis, engine, plus one team principal,
              engineer crew, development budget, and reserve driver for that year.
            </li>
            <li>When picking a driver, choose whether they slot in as Driver 1 or Driver 2.</li>
            <li>
              You need a strong driver lineup and a strong car (chassis + engine) to fight for wins.
              Engineer crew affects reliability and pit stops. Team principal and reserve driver build
              your support score.
            </li>
            <li>
              Development budget reflects real team wealth and boosts how much your car improves through
              the season.
            </li>
            <li>
              Pick whichever component you want; it fills the matching slot on your board. Watch your
              Driver Lineup, Car, and Support ratings build on the right.
            </li>
            <li>
              After each pick the reels respin automatically. You also get up to 3 manual re-spins per
              run if you want a different team/year before choosing.
            </li>
            <li>Watch your team compete in a full season with Wikipedia-style results.</li>
          </ol>
        </section>

        <section className="p-6 sm:p-8 np-section-inverted">
          <h2 className="font-serif text-2xl font-bold mb-3">Result tiers</h2>
          <ul className="space-y-3 font-mono text-sm uppercase tracking-wide">
            <li>
              <span className="text-editorial-red font-bold">01</span> — Double Champion — WCC + WDC
            </li>
            <li>
              <span className="text-editorial-red font-bold">02</span> — Constructors Champion — P1 WCC
            </li>
            <li>
              <span className="text-editorial-red font-bold">03</span> — Podium Team — P2–P3 WCC
            </li>
            <li>
              <span className="text-editorial-red font-bold">04</span> — Points Finisher — P4–P10
            </li>
            <li>
              <span className="text-editorial-red font-bold">05</span> — Backmarker — P11+
            </li>
          </ul>
        </section>
      </div>

      <Link to="/play?mode=classic" className="np-btn-primary mt-10 inline-flex np-focus">
        Play now
      </Link>
    </div>
  )
}
