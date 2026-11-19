import type { Request, Response } from 'express';
import * as cinemaService from '../services/cinema.service.ts';
import type { BookingQuery, CreateCinemaInput } from '../validation/cinemaSchemas.ts';

// Request bodies and queries have already been checked by the validate middleware in the routes.
type IdParams = { id: string };

export async function listCinemas(_req: Request, res: Response) {
  res.json(await cinemaService.listCinemas());
}

export async function createCinema(req: Request<object, unknown, CreateCinemaInput>, res: Response) {
  res.status(201).json(await cinemaService.createCinema(req.body));
}

export async function getBookingQuote(req: Request<IdParams>, res: Response<unknown, { query: BookingQuery }>) {
  res.json(await cinemaService.getBookingQuote(req.params.id, res.locals.query.groupSize));
}
