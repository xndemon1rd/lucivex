# Lucivex

Dark-fantasy anime discovery frontend. React + TypeScript + Vite, no router or icon
dependencies (only `react` and `react-dom` at runtime), so installs cleanly on Termux.
The `typescript-eslint` / `typescript@7` conflict from the default Vite template is
avoided: TypeScript is pinned to 5.6 and ESLint is not installed.

Your backend (`~/AnimeWorldIndia-Api`) is untouched. This project lives in its own folder.

## 1. Run it in Termux

```bash
cd ~
unzip lucivex.zip && cd lucivex
npm install
cp .env.example .env        # defaults already match your local backend
```

Start the backend in one Termux session (`cd ~/AnimeWorldIndia-Api && npm start`),
then in another:

```bash
cd ~/lucivex
npm run dev
```

Open `http://localhost:5173` on the phone. The dev server proxies `/api` to
`http://localhost:3000` and adds `Origin: https://watchanimeworld.one` (your current
`CORS_ORIGIN`) so the backend accepts the requests. Change `DEV_API_ORIGIN` /
`DEV_API_TARGET` in `.env` if needed. This proxy is development-only.

Check the build:

```bash
npm run build      # outputs dist/
npm run preview    # serves dist/ on :4173
npm run typecheck  # optional, strict TypeScript check
```

If anything looks wrong, open **Status** in the app: it checks `/api/health` and
`/api/home`, shows what was recognised, and explains CORS/network failures.

## 2. Deploy the backend first

Vercel hosts only the frontend. Deploy the Express API somewhere public (Railway,
Render, Fly.io, a VPS...) and note its URL, e.g. `https://my-api.example.com`.
Never put secrets in frontend code; the frontend only needs the public API URL.

## 3. Connect the live site to the API (pick one)

**Option A (recommended): call the API directly.**
1. In Vercel, add the env var `VITE_API_BASE_URL=https://my-api.example.com`.
2. On the backend set `CORS_ORIGIN` to include your Vercel URL
   (e.g. `https://lucivex.vercel.app`). If the backend only accepts one origin,
   change its CORS middleware to accept a comma-separated list.

**Option B: Vercel proxy, no backend change.**
Leave `VITE_API_BASE_URL` empty and add these in Vercel (server-side, not exposed
to the browser):
- `UPSTREAM_API_URL=https://my-api.example.com`
- `UPSTREAM_ORIGIN=https://watchanimeworld.one` (the backend's current `CORS_ORIGIN`)

`api/[...path].js` then forwards `GET /api/*` to your backend. Note this sends the
Origin your backend already trusts from a server, so Option A is the cleaner long-term setup.

After changing env vars, redeploy.

## 4. Deploy to Vercel

Easiest from Termux, via GitHub:

```bash
pkg install git
cd ~/lucivex
git init && git add . && git commit -m "Lucivex"
# create an empty GitHub repo, then:
git remote add origin https://github.com/YOU/lucivex.git
git branch -M main && git push -u origin main
```

In vercel.com: **Add New → Project → import the repo**. Framework is detected as Vite
(build `npm run build`, output `dist`). Add the env vars from step 3 and deploy.

CLI alternative: `npm i -g vercel && vercel --prod` (the CLI can be flaky on Termux).

Then test on the live URL: home, search, a details page, and **Status**.

## What is real vs. unknown

- Homepage sections are detected dynamically from `/api/home` (every array of titles
  becomes a rail, whatever its key). Nothing is hardcoded.
- Synopsis, genres and facts are shown only if `/api/info/:id` returns them.
- Language and genre filters on Browse appear only when the items carry that data.
  No audio/subtitle claims are made.
- Browse category chips come from `VITE_CATEGORY_TYPES` (default `series,movies,anime,cartoon`).
  Set it to the types your `/api/category/{type}` really supports.
- Playback: the Watch page requests `/api/embed/:id` (episode id when the episodes
  response has one) and plays only a URL found in that response, in a sandbox-free
  `iframe` or `<video>`. It never scrapes or bypasses anything. If the response
  holds no usable link, the raw JSON is shown so you can adapt `extractSource()`
  in `src/lib/normalize.ts`.
- Season list comes from the info response when present; otherwise a season stepper is shown.

## Structure

```
api/[...path].js      optional Vercel proxy to your backend
src/lib/api.ts        fetch + readable errors      src/lib/normalize.ts  response mapping
src/lib/router.tsx    tiny History router          src/lib/telegram.ts   Mini App hook
src/components/       Intro, Embers, Hero, Carousel, cards, states
src/pages/            Home, Search, Browse, Detail, Watch, Status
src/styles/global.css all styling and animation
```

## Telegram Mini App later

Mobile-first layout, safe-area padding, bottom tabs, no external router or
browser-only APIs. `src/lib/telegram.ts` loads the Telegram SDK only inside Telegram,
calls `ready()`/`expand()` and themes the header. Point a bot's Web App button at the
Vercel URL.

## Intro

Plays once per 12 hours, skippable (button or tap), and skipped entirely for
reduced-motion users. **Status → Replay intro** resets it.
