// Replaces every movie and cinema in the configured database with the sample data.
// Usage: npm run seed
// With --if-empty it only seeds a database that has no movies or cinemas yet, and otherwise
// leaves it alone (Docker Compose runs it that way on every start).
import 'dotenv/config';
import mongoose, { type Types } from 'mongoose';
import { connectDB } from '../config/db.ts';
import Movie from '../models/Movie.ts';
import Cinema from '../models/Cinema.ts';
import { sampleMovies } from '../data/sampleMovies.ts';
import { sampleCinemas } from '../data/sampleCinemas.ts';

const onlyIfEmpty = process.argv.includes('--if-empty');

await connectDB();
// Make sure the unique title and name indexes exist
await Promise.all([Movie.init(), Cinema.init()]);

const [movieCount, cinemaCount] = await Promise.all([Movie.countDocuments(), Cinema.countDocuments()]);

if (onlyIfEmpty && movieCount + cinemaCount > 0) {
  console.log(`Database already has ${movieCount} movies and ${cinemaCount} cinemas; not seeding`);
} else {
  await Promise.all([Movie.deleteMany({}), Cinema.deleteMany({})]);

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

  await Cinema.create(sampleCinemas);

  console.log(`Seeded ${sampleMovies.length} movies and ${sampleCinemas.length} cinemas`);
}

await mongoose.disconnect();
