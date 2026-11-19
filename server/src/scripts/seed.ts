// Replaces every movie in the configured database with the sample data.
// Usage: npm run seed
import 'dotenv/config';
import mongoose, { type Types } from 'mongoose';
import { connectDB } from '../config/db.ts';
import Movie from '../models/Movie.ts';
import { sampleMovies } from '../data/sampleMovies.ts';

await connectDB();
await Movie.init(); // make sure the unique title index exists
await Movie.deleteMany({});

const idsByTitle = new Map<string, Types.ObjectId>();
function idOf(title: string): Types.ObjectId {
  const id = idsByTitle.get(title);
  if (!id) throw new Error(`Sample data lists "${title}" as a prerequisite before inserting it`);
  return id;
}

for (const { prereqs, ...fields } of sampleMovies) {
  const movie = new Movie({ ...fields, prereqs: prereqs.map(idOf) });
  await movie.save();
  idsByTitle.set(fields.title, movie._id);
}

console.log(`Seeded ${sampleMovies.length} movies`);
await mongoose.disconnect();
