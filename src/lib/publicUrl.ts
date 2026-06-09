/** Resolve a path under `public/` for fetch() — honours Vite `base` (e.g. GitHub Pages /repo/). */
export function publicUrl(path: string): string {
  const normalized = path.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${normalized}`
}
