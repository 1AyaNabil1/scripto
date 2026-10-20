# Scripto

**Your story. Every frame.** Paste a short story and Scripto splits it into scenes, each with a camera shot, a mood, the characters and setting, a screenplay heading and a line of dialogue or narration. Then it draws a frame for every scene in one consistent look.

**Live:** https://moviconexus.me/scripto/
(open a sample directly: [English](https://moviconexus.me/scripto/?demo=clockmaker) · [Arabic, right to left](https://moviconexus.me/scripto/?demo=bottle) · [Noir](https://moviconexus.me/scripto/?demo=lighthouse))

Scripto runs in two places from one codebase. On the free site, anyone can write scenes with no key and no sign-up. On [Zibby](https://zibby.run), visitors pay per run in credits and every frame is drawn.

![The Story tab: a story box with one-click samples, the look and scene count, and the first-try card](docs/story.jpg)

## Five tabs

| Tab | What it shows |
| --- | --- |
| **Story** | The story box, with one-click **Try** stories (one in Arabic), the look (six styles), the number of scenes, and the samples gallery "Made with Scripto". |
| **Board** | Every scene as a 16:9 frame in viewfinder corners, with its number, shot, intensity, mood and spoken line. Switch between a grid and a horizontal **film strip** with sprocket holes and edge print. A floating dock exports PNG, PDF and JSON, and on Zibby draws the frames. |
| **Script** | The same storyboard read as a screenplay: `EXT. LANTERN MARKET — NIGHT`, the action, then the line under its speaker. |
| **Arc** | The emotional arc as one violet line across the scenes, the mood of each scene, and the same data as a table. |
| **Cast** | Every recurring character, how they are drawn in every frame, and the scenes they appear in. |

![The Board tab: six frames in a grid with the emotional arc in the corner](docs/board.jpg)

Stories in Arabic, Hebrew, Persian or Urdu keep their language, and the board, the arc and the script all switch to right to left.

![The Arabic sample, laid out right to left](docs/board-arabic.jpg)

## Two ways to run it

|  | Free site (GitHub Pages) | On Zibby |
| --- | --- | --- |
| Who pays the models | Nobody: Gemini's free tier, through Scripto's own scene writer | The visitor's Zibby credits (new accounts get 200 free) |
| Scenes | Gemini `gemini-3.8-flash` | Claude Sonnet 5, through Zibby |
| Frames | Sketches (image models have no free tier) | Gemini 3.1 Flash Image, through Zibby |
| Visitor needs | Nothing | A Zibby account |
| Network | The site and its scene writer only | The page's own origin only |

The build flag `VITE_SCRIPTO_HOST=zibby` picks the host. A Vite alias (`@host`) swaps in one of two small modules, `src/host/site.ts` or `src/host/zibby.ts`, so each bundle carries only its own host's code.

## How it works

```
story ──► scene writer (free site) ──► text model ──► JSON ──► validate + repair ──► storyboard
          or Zibby's /api/ai            (JSON Schema structured                          │
                                         output, low thinking)                           ▼
                                                              for each scene: image prompt
                                                              (style + shot + mood + cast)
                                                                                         │
          image model (Zibby only) ◄──────────────────────────────────────────────────────┘
          (16:9 frame, optional style reference)
                │
                ▼
          data: URL frame  ──or on the free site, or on failure──►  SVG sketch frame
```

**On the free site** the page sends only the story, the scene count and the look to Scripto's **scene writer**, a single serverless function (`src/server/`, deployed from `proxy/`). The scene writer holds the Gemini key; the browser never sees it. It builds the request itself, so the key can only ever write storyboards: one fixed model, one fixed prompt, no images. It also:

- answers only Scripto's own pages (`Origin` check, CORS);
- turns away visitors in the EU, the EEA, Switzerland and the UK, because Google's terms allow the free tier only for apps not offered there;
- allows each visitor 3 storyboards a minute and 20 a day;
- logs a failure's kind and status only, never the story, the visitor or the key.

The key belongs to a Google project with no billing, so it runs on the free tier and can never cost money. The worst abuse can do is use up the day's shared free quota.

**On Zibby** both calls go to the platform's same-origin `POST /api/ai` proxy through [`@zibby-run/app-kit`](https://www.npmjs.com/package/@zibby-run/app-kit). Scenes are an Anthropic Messages request with `output_config.format` set to the same JSON Schema, minus the keywords Claude does not take; those limits are still checked when the answer arrives. Frames are an OpenAI-format request with `modalities: ["image", "text"]`. Scripto follows the platform's rules:

- The only charge it shows is the one in the proxy's final event.
- A run without one shows "charge unknown" and its request id.
- It never retries a paid call by itself.
- It asks before resending past the spending cap.
- It offers a top-up when credits run out.

| Module | Role |
| --- | --- |
| `src/lib/backend.ts` | The backend interface, and the Gemini backend the scene writer uses |
| `src/lib/siteApi.ts` | The free site's backend: calls the scene writer and words its refusals |
| `src/server/` | The scene writer: request checks, region rule, rate limit, Vercel entry |
| `src/lib/zibby.ts`, `src/lib/zibbyPayloads.ts` | The Zibby backend, its refusals in plain words, and the pure request builders (also used for `zibby-sample.json`) |
| `src/host/` | Everything that differs per host: header pill, quotes, top-up and sign-in, start-up |
| `src/lib/prompts.ts`, `src/lib/schema.ts` | System instruction, story input, JSON Schema and image prompts |
| `src/lib/gemini.ts`, `src/lib/errors.ts` | Gemini client, timeouts, one retry on 5xx, plain-language errors |
| `src/lib/validate.ts` | Parses and repairs the model's JSON, including scene headings |
| `src/lib/generate.ts` | Story → storyboard, then frames (style reference, limited concurrency, stops on fatal errors) |
| `src/lib/placeholder.ts`, `src/lib/exportImage.ts` | Sketch frames, PNG export |
| `src/lib/persist.ts` | Keeps the board in this browser: text in localStorage, frames in IndexedDB |
| `src/components/` | The five tabs, the dock, the film strip, the arc, the settings drawer |

## Quick start

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev          # free site at http://localhost:5173/scripto/ (samples only, until it has a scene writer)
npm run dev:zibby    # Zibby version with the kit's mock: no network, no credits
npm run check        # lint, typecheck, tests, both site builds and the scene writer bundle
```

To write real scenes locally, run the scene writer with `vercel dev` in `proxy/` (with `ALLOWED_ORIGINS=http://localhost:5173` in its environment) and start the site with `VITE_SCRIPTO_API=http://localhost:3000 npm run dev`.

## Configuration

The free site has nothing to set. On Zibby, the **Settings** drawer saves these in `localStorage`:

| Setting | Default |
| --- | --- |
| Draw frames after the scenes | on |
| Match every frame to the first | on |
| Scenes model | Claude Sonnet 5 (or Haiku 4.5, Opus 5) |
| Thinking | low (effort; not for Haiku 4.5) |
| Frames model | Gemini 3.1 Flash Image (or 2.5) |

Build-time values, all public addresses rather than secrets:

| Variable | Used for |
| --- | --- |
| `VITE_SCRIPTO_HOST=zibby` | The Zibby build |
| `VITE_SCRIPTO_API` | The free site's scene writer, e.g. `https://scripto-api.vercel.app`. Without it the free site opens samples only. It is also the only extra origin in the site's CSP. |
| `VITE_ZIBBY_URL` | Optional: `https://zibby.run/@owner/app`, linked from the free site's first-try card and from its quota messages |

The scene writer's own environment, set in its Vercel project:

| Variable | Used for |
| --- | --- |
| `GEMINI_API_KEY` | Required. A key from a Google project **with no billing**, so it stays on the free tier. |
| `ALLOWED_ORIGINS` | Optional, comma-separated. Defaults to `https://moviconexus.me`. |
| `GEMINI_MODEL` | Optional. A Gemini text model with a free tier; defaults to `gemini-3.8-flash`. |

## Privacy

- **Free site:** the story goes to the scene writer and from there to Google's free tier, which may use what it receives to improve Google's products, and people at Google may read it. The Story tab says so under the button. The scene writer keeps nothing and logs no stories. An older version of Scripto kept visitors' own keys in the browser; the free site deletes any it finds.
- **Zibby:** Scripto holds no key and no secret. The visitor signs in to Zibby; Scripto's page talks only to its own origin, and Zibby forwards the requests to the model providers.
- Both builds ship a strict Content-Security-Policy, bundle their own fonts, and have no analytics, cookies or third-party scripts.

## Deploying

**The scene writer (Vercel):** `proxy/` is a ready-to-deploy Vercel project. `proxy/api/storyboard.js` is built from `src/server/` by `npm run build:proxy` and committed; CI fails if it is out of date.

1. In [Google AI Studio](https://aistudio.google.com/apikey), create a new key in a project that has **no billing account**. That keeps it on the free tier.
2. `cd proxy && vercel link`, then `vercel env add GEMINI_API_KEY production` and paste the key when the CLI asks. It is stored by Vercel, never in the repository.
3. `vercel deploy --prod`. Use the production address (such as `https://scripto-api.vercel.app`); per-deployment preview addresses may be behind Vercel's login.
4. In GitHub, add the repository variable `SCRIPTO_API_URL` with that address (Settings → Secrets and variables → Actions → Variables), then rerun the Pages deployment.

After changing `src/server/` or the prompt code, run `npm run build:proxy`, commit, and deploy again. If the Vercel project is connected to this repository with `proxy` as its root directory, pushes deploy it automatically.

**GitHub Pages:** `.github/workflows/deploy.yml` builds and publishes `dist/` on every push to `main`, with `SCRIPTO_API_URL` and `ZIBBY_URL` from the repository variables.

**Zibby:** publishing from a repository is by invitation. Connect the repository through Zibby's GitHub App (only this repository, read-only) and pick the branch. Zibby detects Vite: `npm ci`, `npm run build`, output `dist`. It also reads `zibby.json` at the root, which sets `VITE_SCRIPTO_HOST=zibby` for the build. The build needs no network and writes `dist/zibby-sample.json`, the requests Zibby replays to price the app.

## Design

Black ground, one violet light, a halftone projector beam behind every page. Courier Prime is the screenplay voice for titles, headings and numbers. Geist is the interface, and Playfair Display italic is used only for spoken lines. The logo is the S of Scripto drawn as a strip of film. Moods stay inside the violet family. All fonts are bundled from Fontsource (SIL Open Font License); Arabic uses Readex Pro.

## Tests

```sh
npm test
```

248 tests in Vitest and Testing Library, with no real API calls. They cover:

- the request bodies for every backend
- the scene writer: origins, the region rule, the rate limit, input checks, timeouts, and that the key never leaves it
- validation and repair, including scene headings
- the Gemini client and the Zibby error mapping
- charges, the cap-acknowledged retry and the credits refusal
- every tab, the film strip, settings, import, export and two-step clear
- right-to-left layout

## Limitations

- **Frames need Zibby.** Image models have no free tier, so the free site keeps a sketch for every scene; on Zibby each frame is about 9 credits.
- **The free quota is shared.** Everyone on the free site draws from one free Google quota, so on a busy day it can run out until the next.
- **Not in the EU, the UK or Switzerland.** Google's free tier cannot be offered there, so the free site's scene writer turns those visitors away. The samples still open.
- **Consistency is approximate.** Shared character descriptions and a style reference help, but faces and props can drift between frames.
- **The model can get things wrong.** Scripto repairs what it can and lets you edit any scene.
- **Short stories only.** Up to 12,000 characters and 3–10 scenes.
- **English interface.** Stories and scenes can be in any language.

## License

[MIT](LICENSE) © 2026 Aya Nabil
