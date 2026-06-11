declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const ANALYTICS_IN_DEV = import.meta.env.VITE_ANALYTICS_IN_DEV === 'true'

let initialized = false

function canTrack(): boolean {
  if (!GA_MEASUREMENT_ID) return false
  if (import.meta.env.DEV && !ANALYTICS_IN_DEV) return false
  return true
}

/** Load Google Analytics 4 (free tier). */
export function initAnalytics(): void {
  if (!canTrack() || initialized) return
  initialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: true })
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (!canTrack() || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
