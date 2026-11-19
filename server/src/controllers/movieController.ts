import type { Request, Response } from 'express';
import * as movieService from '../services/movie.service.ts';
import type { CreateMovieInput, UpdateMovieInput } from '../validation/movieSchemas.ts';

// Request bodies have already been checked by validateBody in the routes.
type IdParams = { id: string };

export async function listMovies(_req: Request, res: Response) {
  res.json(await movieService.listMovies());
}

export async function getMovie(req: Request<IdParams>, res: Response) {
  res.json(await movieService.getMovie(req.params.id));
}

export async function createMovie(req: Request<object, unknown, CreateMovieInput>, res: Response) {
  res.status(201).json(await movieService.createMovie(req.body));
}

export async function updateMovie(req: Request<IdParams, unknown, UpdateMovieInput>, res: Response) {
  res.json(await movieService.updateMovie(req.params.id, req.body));
}

export async function getRewatchOrder(req: Request<IdParams>, res: Response) {
  res.json(await movieService.getRewatchOrder(req.params.id));
}
