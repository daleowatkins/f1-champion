# Host F1 Champion on GitHub Pages (complete guide)

This guide takes you from zero to a live game URL — **100% free** on a public GitHub repository.

**Your game will live at:**

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME/
```

Example: `https://dalewatkins.github.io/f1-champion/`

---

## What you need before starting

| Thing | Why |
|-------|-----|
| [GitHub account](https://github.com/signup) | Free — hosts the code and website |
| [Git for Windows](https://git-scm.com/download/win) | Sends code from your PC to GitHub |
| [Node.js LTS](https://nodejs.org) | Already used to build the game locally |

You do **not** need a credit card.

---

## Part 1 — One-time setup on your PC

### Step 1: Open PowerShell in the project folder

1. Open File Explorer and go to your `f1-champion` folder  
2. Click the address bar, type `powershell`, press Enter  

### Step 2: Install dependencies (if you haven’t already)

```powershell
npm install
```

### Step 3: Check the project builds (optional but recommended)

```powershell
$env:GITHUB_PAGES = "true"
$env:GITHUB_REPOSITORY_NAME = "f1-champion"
npm run build:pages
```

If this finishes without errors, you’re ready to publish.  
*(Use the same repo name you plan to create on GitHub in step 2 below.)*

---

## Part 2 — Create the GitHub repository

### Step 1: Create a new repo on GitHub

1. Go to https://github.com/new  
2. **Repository name:** e.g. `f1-champion` (remember this — it appears in your URL)  
3. **Public** — required for free GitHub Pages  
4. Do **not** tick “Add a README” (you already have code)  
5. Click **Create repository**

### Step 2: Push your code to GitHub

GitHub shows commands after creating the repo. In PowerShell from your `f1-champion` folder, run:

```powershell
git init
git add .
git commit -m "Initial commit — F1 Champion game"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/f1-champion.git
git push -u origin main
```

Replace `YOUR-GITHUB-USERNAME` and `f1-champion` with your real username and repo name.

**First time using Git?** It may ask you to sign in to GitHub. Follow the browser prompts.

**Large upload:** The `public/data` folder is several MB. The first push can take a minute.

---

## Part 3 — Add your secret dev key (optional but recommended)

This hides dev tools from players and lets you unlock them with a private URL.

1. On GitHub, open your repo  
2. Go to **Settings** → **Secrets and variables** → **Actions**  
3. Click **New repository secret**  
4. Name: `VITE_DEV_GATE_KEY`  
5. Value: a long random password only you know (e.g. `MyF1DevKey2026_xK9p`)  
6. Click **Add secret**

Players never see this. You use it in Part 6 to unlock dev lab / skip-sim for yourself.

---

## Part 4 — Turn on GitHub Pages

1. In your repo, go to **Settings** → **Pages** (left sidebar)  
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**  
3. That’s it — no branch dropdown needed

The project already includes a workflow file (`.github/workflows/deploy-pages.yml`) that builds and publishes automatically.

---

## Part 5 — First deploy

### Trigger the deploy

Pushing to `main` starts a deploy. If you already pushed in Part 2:

1. Go to the **Actions** tab in your repo  
2. You should see **Deploy to GitHub Pages** running or finished  

**First deploy takes 5–15 minutes** because it downloads F1 history data and builds everything.

### Check it worked

1. **Actions** tab → latest workflow run → green tick ✓  
2. **Settings** → **Pages** → you’ll see:  
   `Your site is live at https://YOUR-USERNAME.github.io/f1-champion/`

Open that URL — you should see the F1 Champion home screen.

---

## Part 6 — Share with players

Send people the **normal** link only:

```text
https://YOUR-USERNAME.github.io/f1-champion/
```

They click **Classic** or **Expert** and play. No install needed.

### Your private dev tools (don’t share this link)

Visit once per browser tab:

```text
https://YOUR-USERNAME.github.io/f1-champion/?devtools=YOUR_VITE_DEV_GATE_KEY
```

After loading, dev links appear on the home page (Dev lab, Admin). The password disappears from the address bar.

---

## Part 7 — How to publish updates

Every time you change the game:

```powershell
git add .
git commit -m "Describe your change"
git push
```

GitHub automatically rebuilds and updates the live site in a few minutes. Watch progress under the **Actions** tab.

**How many updates?** On a public repo, you can push **many times per day** — no monthly deploy limit like Netlify credits.

| Update frequency | OK? |
|------------------|-----|
| A few times a week | ✓ |
| Daily | ✓ |
| Several times in one day | ✓ |

---

## Part 8 — Rename the repo?

If you rename the repo on GitHub, the URL changes too. The build picks up the new name automatically — no code changes needed. Just update the link you share.

---

## Troubleshooting

### “Git is not recognized”

Install Git: https://git-scm.com/download/win — close and reopen PowerShell.

### Actions workflow failed

1. Open **Actions** → click the failed run → expand the red step  
2. Common fixes:
   - **npm ci failed** — run `npm install` locally, commit `package-lock.json`, push again  
   - **powershell: not found** during `build:data` — pull the latest code (build script must use `unzip` on Linux, not PowerShell)  
   - **Build timed out** — wait and re-run: **Actions** → workflow → **Re-run all jobs**

### Site loads but is blank / no styles

- Wait 2–3 minutes after a green deploy (CDN cache)  
- Hard refresh: `Ctrl + Shift + R`  
- Check the URL ends with your repo name: `...github.io/f1-champion/` (trailing slash is fine)

### Game says “Failed to load” data

The first deploy must finish `build:data` successfully. Check the **Build for GitHub Pages** step in Actions didn’t fail.

### `/play` page 404 on refresh

The project includes a `404.html` fix for this. If it still happens, always start from the home page link.

### Dev tools don’t unlock

1. Confirm `VITE_DEV_GATE_KEY` secret is set in repo Settings  
2. Secret must match the `?devtools=` value exactly  
3. Push any small change to trigger a new deploy after adding the secret

---

## Limits (free tier — you won’t hit these with friends)

| Limit | Amount |
|-------|--------|
| Cost | $0 |
| Bandwidth | ~100 GB/month (soft) |
| Site size | 1 GB max (yours is ~6 MB) |
| Updates | Unlimited on public repos |

---

## Quick checklist

- [ ] GitHub account created  
- [ ] Git installed  
- [ ] Public repo created  
- [ ] Code pushed to `main`  
- [ ] `VITE_DEV_GATE_KEY` secret added  
- [ ] Pages source set to **GitHub Actions**  
- [ ] Actions workflow finished with green tick  
- [ ] Game loads at `https://USERNAME.github.io/REPO-NAME/`  
- [ ] Shared plain link with friends (no `?devtools=`)

---

## Optional: faster deploys

Each deploy runs `build:data` (downloads F1 database). To speed up later deploys:

1. Run `npm run build:data` locally once  
2. Commit the `public/data` folder (if not already in git)  
3. Future pushes only rebuild the site (~2–3 min instead of ~10+ min)

The workflow already caches the F1DB download between runs to help.

---

## Optional: custom domain

1. Buy a domain (e.g. from Cloudflare, Namecheap)  
2. Repo **Settings** → **Pages** → **Custom domain**  
3. Add the DNS records GitHub shows you  

Still free on GitHub Pages — you only pay for the domain name.
