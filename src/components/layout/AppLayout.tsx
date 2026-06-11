import { Outlet } from 'react-router-dom'
import { AppNav } from './AppNav'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col sharp-corners">
      <AppNav />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4">
        <Outlet />
      </main>
      <footer className="border-t-4 border-ink mt-16 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted">
        Edition Vol. 1.0 · Printed for the web · All the pace that&apos;s fit to sim
      </footer>
    </div>
  )
}
