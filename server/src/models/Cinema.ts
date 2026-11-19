import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { useApiJson } from './apiJson.ts';

export const MAX_BUNDLE_SIZES = 10;
export const MAX_BUNDLE_SEATS = 500;

const cinemaSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // The seat bundles sold for opening night, e.g. [2, 5]
    bundleSizes: {
      type: [{ type: Number, min: 1, max: MAX_BUNDLE_SEATS }],
      validate: [
        {
          validator: (sizes: number[]) => sizes.length >= 1 && sizes.length <= MAX_BUNDLE_SIZES,
          message: `bundleSizes must have between 1 and ${MAX_BUNDLE_SIZES} sizes`,
        },
        {
          validator: (sizes: number[]) => new Set(sizes).size === sizes.length,
          message: 'bundleSizes must not repeat a size',
        },
      ],
    },
  },
  { timestamps: true }
);

useApiJson(cinemaSchema);

export type Cinema = InferSchemaType<typeof cinemaSchema>;

export default mongoose.model('Cinema', cinemaSchema);
