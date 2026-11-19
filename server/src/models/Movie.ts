import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const MIN_RELEASE_YEAR = 1900;

// Checked at validation time rather than schema definition time,
// so a long-running server rolls over correctly on New Year's.
export const maxReleaseYear = () => new Date().getFullYear() + 1;

const movieSchema = new Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    releaseYear: {
      type: Number,
      required: true,
      min: MIN_RELEASE_YEAR,
      validate: {
        validator: (year: number) => year <= maxReleaseYear(),
        message: (props: { value: unknown }) =>
          `releaseYear (${props.value}) must be no later than ${maxReleaseYear()}`,
      },
    },
    runtime: { type: Number, required: true, min: 1, max: 300 },
    prereqs: { type: [{ type: Schema.Types.ObjectId, ref: 'Movie' }], default: [] },
    watched: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// API responses use `id` instead of Mongo's `_id`, and leave out the internal `__v`.
// Set separately because passing a transform in the schema options breaks type inference.
movieSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return rest;
  },
});

export type Movie = InferSchemaType<typeof movieSchema>;

export default mongoose.model('Movie', movieSchema);
