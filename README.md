# Doomsday Ready

Plan an MCU rewatch before *Avengers: Doomsday* and book an opening-night watch party.

```
server/   Express + Mongoose REST API in TypeScript (port 5000)
client/   React + Vite + TypeScript (port 5173)
```

## Run with Docker

One command starts everything (needs Docker with Compose):

```bash
docker compose up --build
```

Then open http://localhost:8080. The first start loads the brief's sample movies and cinemas into the empty database.

| Service  | What it does |
| -------- | ------------ |
| `mongo`  | MongoDB 8, data kept in the `mongo-data` volume. Published on 27017 so local development can use it too. |
| `seed`   | Runs once on each start and loads the sample data only if the database has no movies or cinemas, so it never overwrites your data. |
| `server` | The API, compiled to JavaScript and run on Node 22. Only reachable inside Compose. |
| `client` | nginx serving the built React app on port 8080. It forwards `/api` to `server`, so the app and API share one origin. |

Stop with `docker compose down`; add `-v` to also delete the database.

## Local development

```bash
npm install            # root tooling (concurrently)
npm run install:all    # server + client deps
docker compose up -d mongo     # just the database (or set MONGO_URI in server/.env to Atlas etc.)
npm run seed --prefix server   # load the brief's sample movies and cinemas (replaces all of both)
npm run dev            # runs API and client together
```

Server tests (feature 1 graph logic and feature 2 booking logic, using the brief's examples): `npm test --prefix server`.

Open http://localhost:5173. In development Vite proxies `/api/*` to the server.

## API

All routes are under `/api`. Errors are always `{ "error": CODE, "message": "..." }`.

| Method | Route                       | Description                                   |
| ------ | --------------------------- | --------------------------------------------- |
| GET    | /health                     | Health check                                  |
| GET    | /movies                     | List movies (by release year, then title)     |
| POST   | /movies                     | Create a movie                                |
| GET    | /movies/:id                 | Get one movie                                 |
| PATCH  | /movies/:id                 | Update any of `title`, `releaseYear`, `runtime`, `prereqs`, `watched` |
| GET    | /movies/:id/rewatch-order   | Rewatch order (feature 1)                     |
| GET    | /cinemas                    | List cinemas (by name)                        |
| POST   | /cinemas                    | Create a cinema                               |
| GET    | /cinemas/:id/booking?groupSize=6 | Booking quote (feature 2)                |

Movies are returned as `{ id, title, releaseYear, runtime, prereqs, watched, createdAt, updatedAt }`, where `prereqs` is a list of movie ids.

Cinemas are returned as `{ id, name, bundleSizes, createdAt, updatedAt }`.

**Request bodies** are checked with [zod](https://zod.dev) (`server/src/validation/`). Unknown fields, wrong types and non-integer years or runtimes are rejected with `400 VALIDATION_ERROR`; nothing is converted, so `"2020"` or `"true"` are rejected too.

- `POST /movies`: `title`, `releaseYear` and `runtime` are required; `prereqs` (default `[]`) and `watched` (default `false`) are optional.
- `PATCH /movies/:id`: any of those fields, at least one. Only the fields sent are changed. `prereqs` replaces the whole list.
- `POST /cinemas`: `name` and `bundleSizes` (an array of whole numbers) are required.
- `GET /cinemas/:id/booking`: `groupSize` must be a whole number from 1 to 10,000.

Rewatch order response:

```json
{
  "target": { "id": "...", "title": "Avengers: Doomsday" },
  "order": [{ "id": "...", "title": "Iron Man", "runtime": 126, "watched": true }, "..."],
  "total": 7,
  "watchedCount": 2,
  "unwatchedRuntime": 727
}
```

Booking quote response:

```json
{
  "cinema": { "id": "...", "name": "Galaxy Multiplex" },
  "groupSize": 11,
  "possible": true,
  "totalBundles": 4,
  "bundles": [{ "size": 5, "count": 1 }, { "size": 2, "count": 3 }]
}
```

When no exact combination exists: `"possible": false, "totalBundles": null, "bundles": []`.

### Error codes

| Status | `error`               | When                                                        |
| ------ | --------------------- | ----------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | Unknown field, wrong type, or a value outside the model's rules |
| 400    | `INVALID_ID`          | The movie or cinema id in the URL isn't a valid ObjectId    |
| 400    | `INVALID_JSON`        | The request body isn't valid JSON                           |
| 404    | `MOVIE_NOT_FOUND`     | No movie with that id                                       |
| 404    | `PREREQ_NOT_FOUND`    | A prerequisite id doesn't match any movie                   |
| 404    | `CINEMA_NOT_FOUND`    | No cinema with that id                                      |
| 404    | `NOT_FOUND`           | Unknown route                                               |
| 409    | `CIRCULAR_DEPENDENCY` | The change would make a movie depend on itself              |
| 409    | `DUPLICATE_TITLE`     | Another movie already has that title                        |
| 409    | `DUPLICATE_NAME`      | Another cinema already has that name                        |
| 500    | `INTERNAL_ERROR`      | Anything unexpected (details are logged, not returned)      |

## Feature 1: how it works

The code is in two layers:

- `server/src/services/movieGraph.ts` holds the graph algorithms, written by hand with no graph libraries. It has no database code, so it's unit-tested directly against the brief's sample data.
- `server/src/services/movie.service.ts` holds the business rules. `buildGraph()` loads every movie into a `Map<id, MovieNode>` with ids as strings. The create and update functions validate prerequisites and run the cycle check, and `getRewatchOrder` turns the ordered ids back into full movies. The controller just passes requests to the service and sends back what it returns.

Each movie points to its prerequisites, and one **depth-first search with post-order output** handles both jobs:

- **Rewatch order.** The search adds a movie to the output only after all of its prerequisites have been added. So the output already puts every prerequisite before the movies that need it (a topological order), and the target comes last. Dropping the target gives the rewatch order. Movies the search has finished are skipped, so a prerequisite shared by several movies appears exactly once.
- **Cycle detection.** Each movie is marked *in progress* while the search is exploring its prerequisites, and *done* afterwards. Reaching a movie that is still in progress means the search has looped back on itself, which is a cycle. When an update sets `prereqs`, `createsCycle` runs the search from that movie on the graph *with the proposed change applied*. A cycle means the write is rejected with `409 CIRCULAR_DEPENDENCY`, and the message names the loop (e.g. `Iron Man → Avengers: Endgame → … → Iron Man`).
- **Why one search from the changed movie is enough.** Every update is checked, so the stored graph never contains a cycle. Any new cycle must therefore pass through the movie being changed, and searching from it will find it.
- **Why creates aren't checked.** A new movie gets a fresh id that no other movie can list as a prerequisite yet. Its prerequisites can lead to other movies, but nothing leads back to it, so it can't close a loop.

`watchedCount` and `unwatchedRuntime` are computed from the ordered list.

## Feature 2: how it works

The booking logic is in `server/src/services/bookingQuote.ts`, written by hand with no libraries and no database code. `server/src/services/cinema.service.ts` loads the cinema and shapes the response.

Finding the fewest bundles that add up to exactly the group size is the classic **coin change** problem.

- **Why biggest-first doesn't work.** With bundles of 1, 3 and 4 and a group of 6, always taking the biggest bundle that fits gives 4 + 1 + 1 = 3 bundles. But 3 + 3 is only 2.
- **Dynamic programming instead.** `best[s]` is the fewest bundles that make exactly `s` seats, starting from `best[0] = 0`. A bundle of size `b` turns any answer for `s − b` into one for `s`, so `best[s] = 1 + min(best[s − b])` over every size `b ≤ s`. The loop fills `best[1]` up to `best[groupSize]`. It also records which bundle gave each answer, so the bundles can be read back from `groupSize` down to 0. If `best[groupSize]` is still infinity, no exact combination exists.
- **Cost.** At most 10,000 group sizes × 10 bundle sizes = 100,000 steps, which is effectively instant.
- **Ties.** When two combinations use the same number of bundles, the one with bigger bundles wins. Sizes are tried largest first, and only a strictly better answer replaces the current one. So 6 seats from sizes 2, 3, 4 gives 4 + 2, not 3 + 3, and the same request always gets the same quote.
- **Tests.** Besides the brief's four examples, a test compares the result against an exhaustive search for every set of 1 to 3 sizes from `1, 2, 3, 4, 5, 7, 9` and every group from 1 to 60. That's 3,780 cases, and it shows the answer is the true minimum, not just right for the examples.

## Frontend

`client/` is a React app built with [shadcn/ui](https://ui.shadcn.com) (Base UI primitives, Tailwind v4) and React Router, in a dark theme with Inter and Saira. It has a landing page and three pages:

- **Add Movies** (`/add-movies`): add a movie with optional prerequisites (each field shows its own error), tick movies as watched, and edit a movie's prerequisites in a dialog. A change that would create a cycle shows the server's `CIRCULAR_DEPENDENCY` message in the dialog.
- **Watch Order** (`/watch-order`): pick a target movie (the newest is preselected) to see everything to watch before it, in order, with watched ticks, a progress bar ("4 of 7 watched") and the remaining watch time.
- **Find Cinemas** (`/find-cinemas`): pick a cinema and enter a group size to see the bundles to buy, or "Not possible".

Each page loads fresh data when it's opened. The form limits match the server's (release year 1900 to next year, runtime 1–300, group size 1–10,000). The API calls live in `client/src/api/`, and the views in `client/src/views/`.

## Data model

`Movie` (`server/src/models/Movie.ts`)

| Field         | Type               | Rules                                          |
| ------------- | ------------------ | ---------------------------------------------- |
| `title`       | string             | required, unique, trimmed                      |
| `releaseYear` | number             | required, 1900 to next calendar year           |
| `runtime`     | number (minutes)   | required, 1–300                                |
| `prereqs`     | ObjectId[] → Movie | defaults to `[]`                               |
| `watched`     | boolean            | defaults to `false`                            |

`Cinema` (`server/src/models/Cinema.ts`)

| Field         | Type     | Rules                                                       |
| ------------- | -------- | ----------------------------------------------------------- |
| `name`        | string   | required, unique, trimmed                                   |
| `bundleSizes` | number[] | 1–10 different sizes, each a whole number from 1 to 500     |

**Release year range:** the lower bound is 1900, which covers essentially all feature films while still catching typos like `190` or `0`. The upper bound is the current year + 1, so announced upcoming releases can be added but obvious typos like `2205` are rejected. The upper bound is computed each time a document is validated, not once at startup, so it stays correct across New Year on a long-running server.

## Decisions where the brief was open

- **Release year:** 1900 to next year (see above).
- **Prerequisite ids** that aren't valid ObjectIds get `400 VALIDATION_ERROR`. Valid ids that don't match a movie get `404 PREREQ_NOT_FOUND`; they're never silently dropped. Duplicate ids in `prereqs` are removed.
- **Validation is split in two.** zod checks the *shape* of a request (allowed fields, types, integers). The Mongoose model checks the *values* (year range, runtime 1–300, required non-blank title, unique title). Each rule is defined in exactly one place, and both kinds of failure come back as 400s, never 500s.
- **Release year and runtime must be whole numbers.**
- **`id` instead of `_id`:** every movie and cinema in a response uses `id`, matching the suggested rewatch response, and Mongo's internal `__v` is left out.
- **Sample data:** `npm run seed --prefix server` loads the brief's eight movies (`server/src/data/sampleMovies.ts`) and four cinemas (`server/src/data/sampleCinemas.ts`). The brief gives no years or runtimes, so these use the theatrical values. Avengers: Doomsday's 150-minute runtime is a placeholder until it's released. The brief doesn't name any cinemas, so each sample cinema gets a made-up name and the bundle sizes from one of the brief's booking examples.
- **"Not possible" is a normal answer**, not an error: the booking endpoint returns `200` with `possible: false`. The request is valid; there just isn't an exact combination.
- **Repeated bundle sizes are removed**, the same way repeated prerequisites are: `[2, 5, 5]` is saved as `[2, 5]`. The 1–10 limit counts *different* sizes, after duplicates are removed. Sizes are stored smallest first.
- **Booking ties** go to bigger bundles (see Feature 2).
- **Scale:** the rewatch order and cycle check load every movie's id and prerequisites in one query. That's fine for a catalogue the size of the MCU; a much larger graph would load only the reachable part.
- **Concurrent edits:** two requests that each pass the cycle check at the same moment could together create a cycle, since MongoDB transactions need a replica set. The search still detects a stored cycle instead of looping forever, and the next write that touches it is rejected.
- **Deep chains:** the search is recursive, so its depth is the longest prerequisite chain. That's far below Node's stack limit for any realistic catalogue.

## Environment

- `server/.env` — see `server/.env.example` (`PORT`, `MONGO_URI`, `CLIENT_URL`, `NODE_ENV`)
- `client/.env` — see `client/.env.example` (`VITE_API_URL`, only needed in production)

## TypeScript

- **server** — Node runs `src/*.ts` directly in dev (native type stripping, Node ≥ 22.18), so no `tsx`/`ts-node`. `npm run build` compiles to `server/dist/`, and `npm start` runs the compiled output. Because of this, the server uses only erasable TS syntax (no `enum`/`namespace`) and imports local files with `.ts` extensions.
- **client** — Vite React-TS setup with shadcn/ui, Tailwind v4, the `@/` import alias for `client/src`, and [React Compiler](https://react.dev/learn/react-compiler) enabled through Babel (`client/vite.config.ts`), so components are memoized automatically and there is no need to add `useMemo`/`useCallback`/`memo` by hand. `npm run build` type-checks and then bundles.
- `npm run typecheck` (root) checks both.
