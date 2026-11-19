import Cinema from '../models/Cinema.ts';
import { AppError } from '../errors/AppError.ts';
import { fewestBundles } from './bookingQuote.ts';
import type { CreateCinemaInput } from '../validation/cinemaSchemas.ts';
import { parseId } from '../validation/objectId.ts';

export async function listCinemas() {
  return Cinema.find().sort({ name: 1 });
}

// Repeated bundle sizes are dropped and the rest stored smallest first.
export async function createCinema(data: CreateCinemaInput) {
  const bundleSizes = [...new Set(data.bundleSizes)].sort((a, b) => a - b);
  const cinema = new Cinema({ ...data, bundleSizes });
  await cinema.save();
  return cinema;
}

// No exact combination is a normal answer (possible: false), not an error.
export async function getBookingQuote(id: string, groupSize: number) {
  const cinema = await Cinema.findById(parseId(id, 'cinema')).lean();
  if (!cinema) throw new AppError(404, 'CINEMA_NOT_FOUND', `No cinema with id ${id}`);

  const quote = fewestBundles(cinema.bundleSizes, groupSize);
  return {
    cinema: { id: String(cinema._id), name: cinema.name },
    groupSize,
    possible: quote !== null,
    totalBundles: quote?.totalBundles ?? null,
    bundles: quote?.bundles ?? [],
  };
}
