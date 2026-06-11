import { Link, Outlet } from 'react-router-dom'
import { AppNav } from './AppNav'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col sharp-corners">
      <AppNav />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4">
        <Outlet />
      </main>
      <footer className="border-t-4 border-ink mt-16 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted">
        <p>Edition Vol. 1.0 · Printed for the web · All the pace that&apos;s fit to sim</p>
        <Link
          to="/feedback"
          className="inline-block mt-3 text-ink underline-offset-4 hover:underline hover:decoration-editorial-red hover:decoration-2 np-focus"
        >
          Send feedback
        </Link>
      </footer>
    </div>
  )
}
