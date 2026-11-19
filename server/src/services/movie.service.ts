import Movie, { type Movie as MovieFields } from '../models/Movie.ts';
import { AppError } from '../errors/AppError.ts';
import { createsCycle, findCycle, rewatchOrder } from './movieGraph.ts';
import type { CreateMovieInput, UpdateMovieInput } from '../validation/movieSchemas.ts';

// A movie as a plain object, with its id and prerequisite ids as strings.
export type MovieNode = Omit<MovieFields, 'prereqs'> & { _id: string; prereqs: string[] };

const OBJECT_ID = /^[0-9a-f]{24}$/i;

// Checks a movie id from the URL and returns it in canonical (lowercase) form, or throws 400.
function parseId(id: string): string {
  if (!OBJECT_ID.test(id)) throw new AppError(400, 'INVALID_ID', `Invalid movie id: ${id}`);
  return id.toLowerCase();
}

async function findMovie(id: string) {
  const movie = await Movie.findById(parseId(id));
  if (!movie) throw new AppError(404, 'MOVIE_NOT_FOUND', `No movie with id ${id}`);
  return movie;
}

// Dedupes the prereq ids and checks each belongs to an existing movie (404).
// Their format was already checked when the request body was validated.
async function validatePrereqs(input: string[]): Promise<string[]> {
  const ids = [...new Set(input.map((id) => id.toLowerCase()))];
  if (ids.length === 0) return ids;

  const found = await Movie.find({ _id: { $in: ids } }, { _id: 1 }).lean();
  const foundIds = new Set(found.map((m) => String(m._id)));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new AppError(404, 'PREREQ_NOT_FOUND', `No movie with id ${missing.join(', ')}`);
  }
  return ids;
}

// Every movie, keyed by id.
export async function buildGraph(): Promise<Map<string, MovieNode>> {
  const movies = await Movie.find().lean();
  return new Map(
    movies.map((m) => {
      const node: MovieNode = { ...m, _id: String(m._id), prereqs: m.prereqs.map(String) };
      return [node._id, node];
    })
  );
}

export async function listMovies() {
  return Movie.find().sort({ releaseYear: 1, title: 1 });
}

export async function getMovie(id: string) {
  return findMovie(id);
}

// A new movie has no dependents yet, so it can't close a cycle; no check needed.
export async function createMovie(data: CreateMovieInput) {
  const { prereqs = [], ...fields } = data;
  const movie = new Movie({ ...fields, prereqs: await validatePrereqs(prereqs) });
  await movie.save();
  return movie;
}

// Only the fields present in `data` are changed.
export async function updateMovie(id: string, data: UpdateMovieInput) {
  const movie = await findMovie(id);
  const { prereqs: requested, ...fields } = data;

  if (requested !== undefined) {
    const prereqs = await validatePrereqs(requested);
    const graph = await buildGraph();
    if (createsCycle(movie.id, prereqs, graph)) {
      // Only on the error path: run the search again to name the loop in the message
      const loop = findCycle(movie.id, prereqs, graph) ?? [];
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        `This would make a movie depend on itself: ${loop.map((m) => graph.get(m)?.title).join(' → ')}`
      );
    }
    movie.set('prereqs', prereqs);
  }

  movie.set(fields);
  await movie.save();
  return movie;
}

export async function getRewatchOrder(id: string) {
  const movieId = parseId(id);
  const graph = await buildGraph();
  const target = graph.get(movieId);
  if (!target) throw new AppError(404, 'MOVIE_NOT_FOUND', `No movie with id ${id}`);

  const movies = rewatchOrder(graph, movieId).flatMap((m) => graph.get(m) ?? []);
  const unwatched = movies.filter((m) => !m.watched);

  return {
    target: { id: target._id, title: target.title },
    order: movies.map((m) => ({ id: m._id, title: m.title, runtime: m.runtime, watched: m.watched })),
    total: movies.length,
    watchedCount: movies.length - unwatched.length,
    unwatchedRuntime: unwatched.reduce((sum, m) => sum + m.runtime, 0),
  };
}
