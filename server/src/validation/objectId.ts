import { z } from 'zod';
import { AppError } from '../errors/AppError.ts';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

// For ids inside request bodies.
export const objectId = (label: string) => z.string().regex(OBJECT_ID, `Invalid ${label} id`);

// Checks an id from the URL and returns it in canonical (lowercase) form, or throws 400.
export function parseId(id: string, label: string): string {
  if (!OBJECT_ID.test(id)) throw new AppError(400, 'INVALID_ID', `Invalid ${label} id: ${id}`);
  return id.toLowerCase();
}
