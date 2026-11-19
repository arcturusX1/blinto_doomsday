# Doomsday Ready

Plan an MCU rewatch before *Avengers: Doomsday* and book an opening-night watch party.

```
server/   Express + Mongoose REST API in TypeScript (port 5000)
client/   React + Vite + TypeScript (port 5173)
```

## Setup

```bash
npm install            # root tooling (concurrently)
npm run install:all    # server + client deps
docker compose up -d   # local MongoDB (or set MONGO_URI in server/.env to Atlas etc.)
npm run seed --prefix server   # load the sample movies from the brief (replaces all movies)
npm run dev            # runs API and client together
```

Server tests (feature 1 graph logic, using the brief's sample data): `npm test --prefix server`.

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

Movies are returned as `{ id, title, releaseYear, runtime, prereqs, watched, createdAt, updatedAt }`, where `prereqs` is a list of movie ids.

**Request bodies** are checked with [zod](https://zod.dev) (`server/src/validation/movieSchemas.ts`). Unknown fields, wrong types and non-integer years or runtimes are rejected with `400 VALIDATION_ERROR`; nothing is converted, so `"2020"` or `"true"` are rejected too.

- `POST /movies`: `title`, `releaseYear` and `runtime` are required; `prereqs` (default `[]`) and `watched` (default `false`) are optional.
- `PATCH /movies/:id`: any of those fields, at least one. Only the fields sent are changed. `prereqs` replaces the whole list.

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

### Error codes

| Status | `error`               | When                                                        |
| ------ | --------------------- | ----------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`    | Unknown field, wrong type, or a value outside the model's rules |
| 400    | `INVALID_ID`          | The movie id in the URL isn't a valid ObjectId              |
| 400    | `INVALID_JSON`        | The request body isn't valid JSON                           |
| 404    | `MOVIE_NOT_FOUND`     | No movie with that id                                       |
| 404    | `PREREQ_NOT_FOUND`    | A prerequisite id doesn't match any movie                   |
| 404    | `NOT_FOUND`           | Unknown route                                               |
| 409    | `CIRCULAR_DEPENDENCY` | The change would make a movie depend on itself              |
| 409    | `DUPLICATE_TITLE`     | Another movie already has that title                        |
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

## Data model

`Movie` (`server/src/models/Movie.ts`)

| Field         | Type               | Rules                                          |
| ------------- | ------------------ | ---------------------------------------------- |
| `title`       | string             | required, unique, trimmed                      |
| `releaseYear` | number             | required, 1900 to next calendar year           |
| `runtime`     | number (minutes)   | required, 1–300                                |
| `prereqs`     | ObjectId[] → Movie | defaults to `[]`                               |
| `watched`     | boolean            | defaults to `false`                            |

**Release year range:** the lower bound is 1900, which covers essentially all feature films while still catching typos like `190` or `0`. The upper bound is the current year + 1, so announced upcoming releases can be added but obvious typos like `2205` are rejected. The upper bound is computed each time a document is validated, not once at startup, so it stays correct across New Year on a long-running server.

## Decisions where the brief was open

- **Release year:** 1900 to next year (see above).
- **Prerequisite ids** that aren't valid ObjectIds get `400 VALIDATION_ERROR`. Valid ids that don't match a movie get `404 PREREQ_NOT_FOUND`; they're never silently dropped. Duplicate ids in `prereqs` are removed.
- **Validation is split in two.** zod checks the *shape* of a request (allowed fields, types, integers). The Mongoose model checks the *values* (year range, runtime 1–300, required non-blank title, unique title). Each rule is defined in exactly one place, and both kinds of failure come back as 400s, never 500s.
- **Release year and runtime must be whole numbers.**
- **`id` instead of `_id`:** every movie in a response uses `id`, matching the suggested rewatch response, and Mongo's internal `__v` is left out.
- **Sample data:** `npm run seed --prefix server` loads the brief's eight movies (`server/src/data/sampleMovies.ts`). The brief gives no years or runtimes, so these use the theatrical values. Avengers: Doomsday's 150-minute runtime is a placeholder until it's released.
- **Scale:** the rewatch order and cycle check load every movie's id and prerequisites in one query. That's fine for a catalogue the size of the MCU; a much larger graph would load only the reachable part.
- **Concurrent edits:** two requests that each pass the cycle check at the same moment could together create a cycle, since MongoDB transactions need a replica set. The search still detects a stored cycle instead of looping forever, and the next write that touches it is rejected.
- **Deep chains:** the search is recursive, so its depth is the longest prerequisite chain. That's far below Node's stack limit for any realistic catalogue.

## Environment

- `server/.env` — see `server/.env.example` (`PORT`, `MONGO_URI`, `CLIENT_URL`, `NODE_ENV`)
- `client/.env` — see `client/.env.example` (`VITE_API_URL`, only needed in production)

## TypeScript

- **server** — Node runs `src/*.ts` directly in dev (native type stripping, Node ≥ 22.18), so no `tsx`/`ts-node`. `npm run build` compiles to `server/dist/`, and `npm start` runs the compiled output. Because of this, the server uses only erasable TS syntax (no `enum`/`namespace`) and imports local files with `.ts` extensions.
- **client** — standard Vite React-TS setup with [React Compiler](https://react.dev/learn/react-compiler) enabled through Babel (`client/vite.config.ts`), so components are memoized automatically and there is no need to add `useMemo`/`useCallback`/`memo` by hand. `npm run build` type-checks and then bundles.
- `npm run typecheck` (root) checks both.
