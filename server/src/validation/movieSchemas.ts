import { z } from 'zod';
import { objectId } from './objectId.ts';

// Shape and types only. Value ranges (release year, runtime) and title
// uniqueness live in the Mongoose model, so each rule is defined once.
export const createMovieSchema = z.strictObject({
  title: z.string(),
  releaseYear: z.int(),
  runtime: z.int(),
  prereqs: z.array(objectId('movie')).optional(),
  watched: z.boolean().optional(),
});

export const updateMovieSchema = createMovieSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Send at least one field to update');

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
