import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDevGate } from '../hooks/useDevGate'

export function Home() {
  const devUnlocked = useDevGate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <p className="text-f1-red font-bold uppercase tracking-[0.3em] text-sm mb-4">
          F1 Team Builder
        </p>
        <h1 className="text-5xl font-black mb-4">
          F1 <span className="text-f1-red">Champion</span>
        </h1>
        <p className="text-white/60 mb-10">
          Spin a team, grab any component you like, respin and repeat — build your dream squad and chase the title.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <Link
          to="/play?mode=classic"
          className="block rounded-2xl bg-f1-card border border-white/20 p-6 hover:border-f1-accent/50 transition-colors"
        >
          <p className="font-bold text-lg">Classic</p>
          <p className="text-sm text-white/50 mt-1">
            Full ratings and stats on show. Draft the strongest team you can.
          </p>
        </Link>
        <Link
          to="/play?mode=expert"
          className="block rounded-2xl bg-f1-card border border-white/20 p-6 hover:border-f1-accent/50 transition-colors"
        >
          <p className="font-bold text-lg">Expert</p>
          <p className="text-sm text-white/50 mt-1">
            Ratings hidden — draft on pure F1 knowledge. Stats revealed at the end.
          </p>
        </Link>
        <Link
          to="/how-to-play"
          className="text-center text-sm text-white/40 hover:text-white mt-2"
        >
          How to play
        </Link>
        {devUnlocked && (
          <div className="flex flex-col gap-1 mt-2">
            <Link
              to="/dev"
              className="text-center text-xs text-f1-accent/70 hover:text-f1-accent"
            >
              Dev lab
            </Link>
            <Link
              to="/admin"
              className="text-center text-xs text-white/30 hover:text-white/50"
            >
              Admin
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
