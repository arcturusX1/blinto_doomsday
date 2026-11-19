import type { Schema } from 'mongoose';

// API responses use `id` instead of Mongo's `_id`, and leave out the internal `__v`.
// Applied with schema.set() because passing a transform in the schema options breaks type inference.
export function useApiJson<T extends Schema>(schema: T): void {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      const { _id, ...rest } = ret;
      return rest;
    },
  });
}
