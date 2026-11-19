import { z } from 'zod';

export const MAX_GROUP_SIZE = 10_000;

// Shape and types only. The number of sizes and seats per bundle are checked
// by the Mongoose model, like movie values are.
export const createCinemaSchema = z.strictObject({
  name: z.string(),
  bundleSizes: z.array(z.int()),
});

const groupSizeMessage = `must be a whole number from 1 to ${MAX_GROUP_SIZE}`;

// Query strings are always text, so groupSize is converted to a number here.
export const bookingQuerySchema = z.object({
  groupSize: z.coerce
    .number({ error: groupSizeMessage })
    .int(groupSizeMessage)
    .min(1, groupSizeMessage)
    .max(MAX_GROUP_SIZE, groupSizeMessage),
});

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
