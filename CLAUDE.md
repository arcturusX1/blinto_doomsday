# Doomsday Ready

Full-stack app to plan an MCU rewatch before *Avengers: Doomsday* (feature 1) and book an opening-night watch party in seat bundles (feature 2), with a React frontend (feature 3).

- Design docs in the repo root: `design doc prompt.txt` (setup and the backend, features 1 and 2) and `front end design doc prompt.txt` (the client: setup, API layer, design, pages, page transitions). Keep both in sync with the repo, in their terse lowercase style, with CRLF line endings.

## How to work here

- Go through steps one at a time and wait for the user's input before starting the next step.
- Brief rules: the logic of features 1 and 2 must be written by hand, with no libraries that solve them (zod for validation is fine). The README must say how AI tools were used: its "AI usage" section has the user's own wording, so don't change it without asking.
- When the brief is unclear, make a reasonable choice and record it under "Decisions where the brief was open" in `README.md`.
- Keep `README.md` current when behavior changes: API table, error codes, feature sections, decisions.

## Commands

From the root: `npm run dev` (server and client together), `npm run build`, `npm run typecheck`.
In `server/`: `npm run dev`, `npm test`, `npm run seed` (**deletes all movies and cinemas**, then loads the brief's sample data), `npm run build`, `npm start`.
In `client/`: `npm run dev`, `npm run build` (type-checks first), `npm run lint` (oxlint).

## Layout

```
server/src/
  models/        Movie.ts, Cinema.ts, apiJson.ts (shared toJSON: `id` instead of `_id`, no `__v`)
  services/      movieGraph.ts (DFS, feature 1), bookingQuote.ts (DP, feature 2)  ← pure, no DB, unit-tested
                 movie.service.ts, cinema.service.ts                             ← business rules + DB
  controllers/   thin: pass req to the service, send the result
  routes/        movieRoutes.ts, cinemaRoutes.ts (validate middleware runs here)
  validation/    zod schemas (movieSchemas.ts, cinemaSchemas.ts), objectId.ts (parseId + zod objectId)
  middleware/    validate.ts (validateBody, validateQuery), errorHandler.ts
  errors/        AppError.ts
  data/          sampleMovies.ts, sampleCinemas.ts
  scripts/       seed.ts
client/src/
  api/           client.ts (request, ApiError with the server's error code), movies.ts, cinemas.ts (typed endpoints)
  hooks/         useApi.ts (load by key, reload(); a null key loads nothing)
  pages/         LandingPage (hero with the two calls to action)
  views/         MoviesView, RewatchView, BookingView: the content of /add-movies, /watch-order, /find-cinemas (routes in App.tsx, each wrapped in PageLayout)
  components/    layout/ (SiteHeader, PageLayout, DisplayTitle, AvengersLogo), movies/ (AddMovieForm, EditPrereqsDialog, PrereqPicker), ui/ (shadcn)
  assets/        doomsday-hero.jpg (hero and page banner background)
  lib/           utils.ts (shadcn cn), format.ts (formatRuntime, formatList)
```

## Conventions and gotchas

- **Server TypeScript runs directly in Node** (type stripping, no tsx/ts-node). Only erasable syntax: no `enum`, `namespace` or constructor parameter properties. Local imports use `.ts` extensions; `tsc` rewrites them to `.js` in `dist/`.
- **TypeScript 7** in both packages. Server tsconfig is `strict` with `noUnusedLocals`/`noUnusedParameters`.
- **Errors:** throw `new AppError(status, CODE, message?)`. The single error handler returns `{ error: CODE, message }`. Mongo duplicate keys map by field in `DUPLICATE_ERRORS` in `errorHandler.ts`; add an entry for any new unique field.
- **Validation is split:** zod checks shape and types (unknown fields and wrong types → 400, nothing is converted). The Mongoose model checks values (ranges, required, unique). Keep each rule in one place.
- **Express 5:** async errors reach the error handler automatically. `req.query` is read-only, so `validateQuery` puts the parsed query on `res.locals.query`.
- **Mongoose:** passing a `toJSON` transform in the schema options breaks `InferSchemaType`; use `useApiJson(schema)` after creating the schema.
- **IDs, not titles:** the API takes and returns Mongo ids (`prereqs` is an id list). Ids are lowercased by `parseId`.
- **Graph invariant:** the stored movie graph never has a cycle. Updates that set `prereqs` run `createsCycle`; creates skip it because a new movie can't close a loop.
- **React Compiler is on:** don't add `useMemo`/`useCallback`/`memo` by hand.
- **shadcn/ui:** `base-nova` style on **Base UI** (not Radix), lucide icons, Tailwind v4, `@/` → `client/src`. Use `render={<Button />}` instead of `asChild`; `Select` needs an `items` prop (placeholder = `{ value: null }` item). Add components with `npx shadcn@latest add <name>` in `client/`. Delete unused generated components (the strict tsconfig rejects their unused imports).
- **Design (dark-only, `<html class="dark">`):** colors are the `.dark` tokens in `client/src/index.css` (background #070a06, card #10160d, lime primary #9fca6a, orange destructive #f0a77d). Fonts: Inter for body, `font-heading` = Saira (Bank Gothic if installed). The look lives in the theme and in the edited shadcn components (pill buttons with `glass`/`nav`/`hero`, 52px inputs/selects, 20px cards, uppercase table headers, `success` alert variant), so views use plain shadcn components and only set layout. Apply `buttonVariants` to links through `cn(...)`, or the base's transparent border wins. Routes: `/`, `/add-movies`, `/watch-order`, `/find-cinemas` (React Router); `NavLink`'s `aria-current="page"` styles the active pill.
- **Page slides:** navigate with `TransitionLink` (never a plain `Link`): it runs the navigation in `startTransition` with `addTransitionType('nav-left' | 'nav-right')`, from the page order in `lib/navigation.ts` (home, then the nav buttons left to right). `App.tsx` wraps the routes in a `<ViewTransition>` keyed by path whose enter/exit classes are styled in `index.css`; the header is a named `<ViewTransition>` (`site-header`, raised with `z-index`) so it stays put. The hero image is one static `.site-backdrop` layer in `App.tsx`, outside the transition; pages only paint tints over it (`.hero-backdrop`, `.banner-backdrop`) and are opaque below the banner. Snapshots use `object-fit: none` anchored top left, because Firefox otherwise squashes a page that grows mid-transition (its data arriving), and the header snapshot would stretch when the scrollbar appears or disappears between pages. Don't use `scrollbar-gutter: stable` for that: it leaves an empty bar down the right of the landing page, which doesn't scroll. Select view-transition classes as `::view-transition-old(*.name)`; the `(.name)` form doesn't match in Edge. Everything is off under `prefers-reduced-motion`. Firefox 160 is installed on Windows; headless Firefox can be driven over WebDriver BiDi (`--remote-debugging-port`, WebSocket `/session`; end the session after each run), but its screenshots show the live page, not the transition layer.
- Match the style of surrounding code: comment density, naming, single quotes; server uses semicolons, client doesn't.

## Testing against a real database

The dev database is this project's Compose `mongo` service (`docker compose up -d mongo`, container `blinto_doomsday-mongo-1` on 27017, holding the user's data). A plain `docker compose up` starts the whole app instead: mongo, a `seed` job that only seeds an empty database (`seed.ts --if-empty`), the compiled server, and nginx serving the client on http://localhost:8080 with `/api` proxied to the server (Dockerfiles in `server/` and `client/`, `client/nginx.conf`). Without the database the server can't start ("Failed running 'src/server.ts'" plus Vite `ECONNREFUSED` on `/api`). Another project's container, `steam-mongo`, also binds 27017, so only one of them can run at a time. For end-to-end checks, don't touch the dev database: start a throwaway container and point the server at it:

```bash
docker run -d --rm --name doomsday-e2e-mongo -p 27018:27017 mongo:8
MONGO_URI=mongodb://127.0.0.1:27018/doomsday_e2e PORT=5077 npm run seed   # then start the server the same way
```

Stop the server by its PID (`pkill -f` can match and kill the calling shell), then `docker stop doomsday-e2e-mongo` (it removes itself).

To check the UI: run the API on port 5000 (the Vite proxy target) and Vite on 5173. Headless Edge on Windows (`/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --headless=new --screenshot=...`) can load `localhost:5173`. WSL runs in NAT mode, so it can't reach Edge's DevTools port. To click through the UI, drive Edge from a PowerShell script (WebSocket to the DevTools protocol, `Input.dispatchMouseEvent`), and stop only the Edge processes whose command line contains your profile folder. Vite started via `node node_modules/.bin/vite` may need killing by its own PID.

## Status

- Done: scaffold, feature 1 (movies, rewatch order, cycle detection), feature 2 (cinemas, booking quote). Unit tests and end-to-end checks pass for every expected result in the brief.
- Feature 3: done, styled after the user's design canvas (https://claude.ai/code/artifact/e4cb1aa6-6261-4a6e-9eba-c0f8f39b5883); checked by clicking through in headless Edge.
- Bonus done: Docker Compose for the whole app, and the data model diagram (a Mermaid `erDiagram` at the top of the README's Data model section, checked to render with Mermaid 11).
- Git: the repo is initialized; commit only when the user asks.
