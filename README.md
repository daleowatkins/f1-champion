# F1 Champion

A browser-based F1 team-builder game inspired by [38-0-0](https://38-0-0.com/). Spin a random constructor and season, draft 8 components from that year's pool, then simulate a full championship campaign.

## How to play

1. Choose **Classic** (stats visible) or **Expert** (names only).
2. **Spin** to draw a real constructor + season.
3. **Draft** Driver 1, Driver 2, Chassis, Engine, Team Principal, Pit Team, Development Budget, and Reserved Driver.
4. Watch your season simulate and see if you win the championship.

## Development

```bash
npm install
npm run build:data   # Download F1DB and generate game JSON (first run)
npm run dev          # Start dev server
npm test             # Run tests
npm run build        # Production build
npm run preview      # Serve production build locally
```

Copy `.env.example` to `.env` before deploying (see Hosting below).

## Hosting on GitHub Pages (recommended — free, unlimited updates)

**Full step-by-step guide:** [docs/GITHUB-PAGES-SETUP.md](docs/GITHUB-PAGES-SETUP.md)

Quick summary: push this repo to a **public** GitHub repository, enable **Pages → GitHub Actions**, add a `VITE_DEV_GATE_KEY` secret, and your game goes live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

## Other hosting (Netlify, Vercel, etc.)

This is a **static site** — build once, upload the `dist/` folder. No server required for gameplay.

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

- `VITE_DEV_GATE_KEY` — secret string for your dev tools (dev lab, admin link, skip-sim). Players never see these unless they know the URL trick below.
- `VITE_RESPINS_PER_RUN=3` — manual re-spins per game (default 3).

### 2. Build

```bash
npm run build:data   # if data not already built
npm run build
```

Output is in `dist/` (includes `public/data/` JSON assets).

### 3. Deploy `dist/` to any static host

| Platform | How |
|----------|-----|
| **Vercel** | Import repo, build command `npm run build`, output `dist`. `vercel.json` handles SPA routing. |
| **Netlify** | Build `npm run build`, publish `dist`. `public/_redirects` handles SPA routing. |
| **Cloudflare Pages** | Build `npm run build`, output `dist`, enable SPA fallback to `/index.html`. |
| **GitHub Pages** | Upload `dist` contents to `gh-pages` branch or use Actions. |
| **Azure Static Web Apps** | Point at `dist`, set fallback to `index.html`. |

Set the same `VITE_*` variables in the host’s **build environment** (not at runtime — Vite bakes them in at build time).

### 4. Dev tools in production (optional)

Visit once per browser tab:

```text
https://your-site.com/?devtools=YOUR_VITE_DEV_GATE_KEY
```

That unlocks dev lab, admin UI link, skip-sim, and unlimited respins for that tab. The key is stripped from the address bar after unlock.

**Note:** Ratings **Admin** (edit overrides + rebuild) only works with `npm run dev` — it needs the local Vite API. The hosted game is read-only for ratings data.

### Game rules (production)

- **3 re-spins** per full run (configurable via `VITE_RESPINS_PER_RUN`)
- Dev routes hidden unless the gate URL above is used

## Data

Historical data is sourced from [F1DB](https://github.com/f1db/f1db) (1950–2025). Team principals use curated entries where available, with synthetic fallbacks for older eras.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zustand (game state)
- Framer Motion (animations)
- Vitest (tests)
