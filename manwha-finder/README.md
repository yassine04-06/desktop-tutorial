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
- Filter by status (Completed / Ongoing)
- Sort by chapter count or update date
- Save favorites (persisted in local SQLite)
- Search history (last 20 searches)
- Direct Tachiyomi deep links
- Installable as Android PWA
