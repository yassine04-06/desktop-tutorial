# ManwhaFinder

AI-powered manwha recommendation app — find Korean manga similar to what you love, powered by MangaDex and Claude AI.

## Prerequisites

- Node.js 18+
- npm 8+
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

```bash
# 1. Install all dependencies (root + frontend workspace)
npm install

# 2. Copy env template and fill in your API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:5173`

Open **http://localhost:5173** in your browser.

## Build (production)

```bash
npm run build
# Serves the built frontend from /frontend/dist
```

## Deploy to Vercel

The app is structured to deploy as a single Vercel project: the frontend
builds to static files, and the Express backend runs as a Vercel serverless
function (`api/[...path].js`) — no separate server to host.

1. **Push this repo to GitHub** (if not already) and import it in the
   [Vercel dashboard](https://vercel.com/new), or deploy from the CLI:
   ```bash
   npm i -g vercel
   cd manwha-finder
   vercel --prod
   ```
   Build settings are already defined in `vercel.json` — Vercel picks them up
   automatically (install: `npm install`, build:
   `npm run build --workspace=frontend`, output: `frontend/dist`).

2. **Create a free Turso database** (SQLite-compatible, persists across
   requests — a local file won't work on serverless):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth login
   turso db create manwha-finder
   turso db show manwha-finder --url
   turso db tokens create manwha-finder
   ```

3. **Set environment variables** in the Vercel project settings
   (Settings → Environment Variables):
   - `ANTHROPIC_API_KEY`
   - `TURSO_DATABASE_URL` (from step 2)
   - `TURSO_AUTH_TOKEN` (from step 2)

   Without the Turso variables, the app still runs but favorites/library/
   history won't persist between requests (each serverless invocation gets
   an ephemeral filesystem).

4. Redeploy after setting env vars so the function picks them up.

## Android PWA Install

1. Open `http://<your-local-ip>:5173` in **Chrome on Android**
2. Tap the three-dot menu → **"Add to Home Screen"**
3. App launches in standalone mode like a native app

## Tachiyomi Deep Links

The "Open in Tachiyomi" button uses the `tachiyomi://manga/mangadex/:id` deep link scheme.

**Requirements:**
- Tachiyomi or Mihon installed on Android
- MangaDex extension installed and enabled inside Tachiyomi

## Features

- Search manwha by title via MangaDex API
- Get AI-powered similar recommendations (Claude AI analyzes tags/genres)
- Filter by status (Completed / Ongoing) and minimum 50+ chapters
- Sort by chapter count or update date
- Save favorites (persisted in local SQLite)
- **My Library** — mark manwha as already read; the AI automatically excludes
  everything in your library (and everything recommended before) from future
  results, so you stop getting the same suggestions
- Import/export your library as JSON (bookmark icon → Export/Import JSON)
- Reset recommendation history if you want previously-seen titles to resurface
- Search history (last 20 searches)
- Direct Tachiyomi deep links
- Installable as Android PWA

### How the "no repeats" logic works

Every `/api/similar` call excludes three sets of manga IDs:
1. The source manwha itself
2. Everything in **My Library** (bookmark icon in the top bar)
3. Everything ever returned by a previous `/api/similar` call (tracked server-side)

Use the "Reset recommendation history" button in the Library panel if you want
set (3) cleared — e.g. after months, when older suggestions are fair game again.
Set (2) only clears when you manually remove a title from your library.
