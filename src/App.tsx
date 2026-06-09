import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { applyDevGateFromUrl } from './config/devGate'
import { loadDraftBadges } from './engine/badges'
import { Home } from './pages/Home'
import { Play } from './pages/Play'
import { HowToPlay } from './pages/HowToPlay'
import { Admin } from './pages/Admin'
import { DevLab } from './pages/DevLab'
import { TrophyCabinet } from './pages/TrophyCabinet'

export default function App() {
  useEffect(() => {
    applyDevGateFromUrl()
    loadDraftBadges().catch(console.error)
  }, [])

  const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <BrowserRouter basename={routerBase || undefined}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dev" element={<DevLab />} />
        <Route path="/trophy-cabinet" element={<TrophyCabinet />} />
      </Routes>
    </BrowserRouter>
  )
}
